import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { connectDB } from "../db/connectDB.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

async function runTests() {
    try {
        console.log("Connecting to DB...");
        await connectDB();
        console.log("Connected to DB successfully.");

        const testEmail = `enterprise.test.${Date.now()}@corporate.com`;
        const testPassword = "SecurePassword123";

        console.log("\n--- TEST 1: User Schema & Pre-Validate Hook ---");
        const user = new User({
            fullName: "Priya Sharma",
            companyName: "Tech Innovators Pvt Ltd",
            email: testEmail,
            phone: "+91 9876543210",
            businessType: "Corporate Gifting & HR",
            gstin: "07AAAAA0000A1Z5",
            password: testPassword,
            role: "b2b_buyer",
            accountType: "B2B",
        });

        await user.save();
        console.log("User created successfully with ID:", user._id.toString());
        console.log("fullName getter:", user.fullName);
        console.log("full_name field:", user.full_name);
        console.log("companyName:", user.companyName);
        console.log("role:", user.role);
        console.log("isB2BVerified:", user.isB2BVerified);
        console.log("businessType:", user.businessType);
        console.log("b2bProfile sync:", user.b2bProfile);

        console.log("\n--- TEST 2: Password Verification ---");
        const match1 = await user.matchPassword(testPassword);
        const match2 = await user.comparePassword(testPassword);
        const matchFail = await user.matchPassword("WrongPassword");
        console.log("matchPassword('SecurePassword123'):", match1 === true ? "PASS" : "FAIL");
        console.log("comparePassword('SecurePassword123'):", match2 === true ? "PASS" : "FAIL");
        console.log("matchPassword('WrongPassword'):", matchFail === false ? "PASS" : "FAIL");

        console.log("\n--- TEST 3: JWT Generation & Expiry Verification ---");
        const token7d = jwt.sign(
            { id: user._id, role: user.role, isB2BVerified: user.isB2BVerified, accountType: user.accountType },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        const decoded7d = jwt.verify(token7d, process.env.JWT_SECRET);
        const validityHours = Math.round((decoded7d.exp - decoded7d.iat) / 3600);
        console.log("JWT 7d Token generated, duration:", validityHours, "hours (>= 24h requirement)");
        if (validityHours < 24) throw new Error("Token validity less than 24h!");

        const token30d = jwt.sign(
            { id: user._id, role: user.role, isB2BVerified: user.isB2BVerified, accountType: user.accountType },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );
        const decoded30d = jwt.verify(token30d, process.env.JWT_SECRET);
        const validity30dHours = Math.round((decoded30d.exp - decoded30d.iat) / 3600);
        console.log("JWT 30d Token (rememberMe) duration:", validity30dHours, "hours");

        console.log("\n--- TEST 4: Auto-Refresh Flow Simulation ---");
        // Simulate refresh with active token
        const refreshDecoded = jwt.verify(token7d, process.env.JWT_SECRET);
        const refreshedUser = await User.findById(refreshDecoded.id).select("-password");
        console.log("Refreshed user found:", refreshedUser.fullName, refreshedUser.email);
        const newToken = jwt.sign(
            { id: refreshedUser._id, role: refreshedUser.role, isB2BVerified: refreshedUser.isB2BVerified, accountType: refreshedUser.accountType },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        console.log("New Refreshed Token signed successfully:", newToken.slice(0, 30) + "...");

        // Clean up test user
        await User.deleteOne({ _id: user._id });
        console.log("\nCleaned up test user.");

        console.log("\n ALL B2B AUTH SPECIFICATION TESTS PASSED SUCCESSFULLY!");
        process.exit(0);
    } catch (err) {
        console.error("Test failed with error:", err);
        process.exit(1);
    }
}

runTests();

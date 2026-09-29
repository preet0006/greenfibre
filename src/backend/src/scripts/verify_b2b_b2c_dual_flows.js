import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "../db/connectDB.js";
import { User } from "../models/user.model.js";
import { OTP } from "../models/otp.model.js";
import userRoutes from "../routes/user.route.js";
import b2bRoutes from "../routes/b2b.route.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/users", userRoutes);
app.use("/api/b2b", b2bRoutes);

async function verifyDualFlows() {
    try {
        console.log("Connecting to MongoDB...");
        await connectDB();
        const server = app.listen(0);
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}`;

        const timestamp = Date.now();
        const b2cEmail = `consumer.${timestamp}@gmail.com`;
        const b2cPassword = "ConsumerPass123!";

        const b2bEmail = `enterprise.${timestamp}@company.com`;
        const b2bPassword = "CorporatePass123!";

        console.log("\n=======================================================");
        console.log("             TESTING B2C RETAIL FLOW");
        console.log("=======================================================");

        // Step 1: Register B2C User
        console.log("1. Registering B2C retail user...");
        const b2cRegRes = await fetch(`${baseUrl}/api/users/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                full_name: "Rahul Verma",
                email: b2cEmail,
                password: b2cPassword,
                phone: "9876543210",
            }),
        });
        const b2cRegData = await b2cRegRes.json();
        console.log("B2C Register Status:", b2cRegRes.status, b2cRegData.message);
        if (b2cRegRes.status !== 200) throw new Error("B2C registration failed!");

        // Step 2: Attempt B2C Login BEFORE OTP Verification (MUST be rejected with 403)
        console.log("2. Attempting B2C Login before OTP verification (should be blocked)...");
        const b2cUnverifiedLoginRes = await fetch(`${baseUrl}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: b2cEmail,
                password: b2cPassword,
            }),
        });
        const b2cUnverifiedLoginData = await b2cUnverifiedLoginRes.json();
        console.log("B2C Unverified Login Status:", b2cUnverifiedLoginRes.status, "(Expected 403)");
        console.log("B2C Code:", b2cUnverifiedLoginData.code, "(Expected EMAIL_NOT_VERIFIED)");
        if (b2cUnverifiedLoginRes.status !== 403 || b2cUnverifiedLoginData.code !== "EMAIL_NOT_VERIFIED") {
            throw new Error("B2C unverified login was NOT properly blocked by OTP requirement!");
        }

        // Step 3: Verify email with OTP
        console.log("3. Setting and verifying OTP for B2C email...");
        const b2cUserInDb = await User.findOne({ email: b2cEmail });
        await OTP.deleteMany({ userId: b2cUserInDb._id });
        const testOtp = "654321";
        const newOtp = new OTP({
            userId: b2cUserInDb._id,
            otp: testOtp,
            purpose: "email_verification",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        await newOtp.save();

        const verifyOtpRes = await fetch(`${baseUrl}/api/users/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: b2cEmail,
                otp: testOtp,
            }),
        });
        const verifyOtpData = await verifyOtpRes.json();
        console.log("Verify OTP Status:", verifyOtpRes.status, verifyOtpData.message);
        if (verifyOtpRes.status !== 200 || !verifyOtpData.token) throw new Error("B2C OTP verification failed!");


        // Step 4: Login as B2C after verification
        console.log("4. Logging in as verified B2C user...");
        const b2cLoginRes = await fetch(`${baseUrl}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: b2cEmail,
                password: b2cPassword,
            }),
        });
        const b2cLoginData = await b2cLoginRes.json();
        console.log("B2C Login Status:", b2cLoginRes.status, "AccountType:", b2cLoginData.user.accountType, "Role:", b2cLoginData.user.role);
        if (b2cLoginRes.status !== 200 || b2cLoginData.user.accountType !== "B2C" || b2cLoginData.user.role !== "user") {
            throw new Error("B2C verified login returned incorrect accountType or role!");
        }

        // Step 5: Check B2C Profile
        console.log("5. Fetching B2C profile (/api/users/me)...");
        const b2cMeRes = await fetch(`${baseUrl}/api/users/me`, {
            headers: { Authorization: `Bearer ${b2cLoginData.token}` },
        });
        const b2cMeData = await b2cMeRes.json();
        console.log("B2C Profile:", JSON.stringify(b2cMeData.user, null, 2));

        console.log("\n=======================================================");
        console.log("             TESTING B2B ENTERPRISE FLOW");
        console.log("=======================================================");

        // Step 6: Register B2B Enterprise Account
        console.log("6. Registering B2B enterprise account...");
        const b2bRegRes = await fetch(`${baseUrl}/api/b2b/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Priya Sharma",
                companyName: "EcoTech Industries",
                email: b2bEmail,
                phone: "+91 9876543210",
                businessType: "Corporate Gifting & HR",
                gstin: "27ABCDE1234F1Z5",
                password: b2bPassword,
                billingAddress: {
                    street: "123 Business Hub",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001",
                    country: "India",
                },
            }),
        });
        const b2bRegData = await b2bRegRes.json();
        console.log("B2B Register Status:", b2bRegRes.status, b2bRegData.message);
        console.log("B2B User Response:", JSON.stringify(b2bRegData.user, null, 2));
        if (b2bRegRes.status !== 201 || b2bRegData.user.accountType !== "B2B" || b2bRegData.user.role !== "b2b_buyer") {
            throw new Error("B2B registration failed or returned wrong role!");
        }

        // Step 7: B2B Login (Direct login without OTP blockage)
        console.log("7. Logging in as B2B enterprise user (direct login, no OTP required)...");
        const b2bLoginRes = await fetch(`${baseUrl}/api/b2b/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: b2bEmail,
                password: b2bPassword,
                rememberMe: true,
            }),
        });
        const b2bLoginData = await b2bLoginRes.json();
        console.log("B2B Login Status:", b2bLoginRes.status, b2bLoginData.message);
        console.log("B2B Login User:", JSON.stringify(b2bLoginData.user, null, 2));
        if (b2bLoginRes.status !== 200 || b2bLoginData.user.companyName !== "EcoTech Industries") {
            throw new Error("B2B login failed!");
        }

        // Step 8: Fetch B2B Profile
        console.log("8. Fetching B2B profile (/api/b2b/me)...");
        const b2bMeRes = await fetch(`${baseUrl}/api/b2b/me`, {
            headers: { Authorization: `Bearer ${b2bLoginData.token}` },
        });
        const b2bMeData = await b2bMeRes.json();
        console.log("B2B Profile:", JSON.stringify(b2bMeData.user, null, 2));
        if (b2bMeRes.status !== 200 || b2bMeData.user.gstin !== "27ABCDE1234F1Z5") {
            throw new Error("B2B profile mismatch!");
        }

        // Step 9: Refresh B2B Token
        console.log("9. Refreshing B2B token (/api/b2b/refresh-token)...");
        const b2bRefreshRes = await fetch(`${baseUrl}/api/b2b/refresh-token`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${b2bLoginData.token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        });
        const b2bRefreshData = await b2bRefreshRes.json();
        console.log("B2B Token Refresh Status:", b2bRefreshRes.status, b2bRefreshData.message);
        if (b2bRefreshRes.status !== 200 || !b2bRefreshData.token) {
            throw new Error("B2B token refresh failed!");
        }

        // Cleanup
        await User.deleteMany({ email: { $in: [b2cEmail, b2bEmail] } });
        await OTP.deleteMany({ userId: { $in: [b2cUserInDb._id] } });
        console.log("\nCleaned up test data from DB.");

        server.close();
        console.log("\n✅ ALL DUAL FLOW TESTS PASSED: B2C AND B2B ARE CLEANLY SEPARATED AND OPERATIONAL!");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Verification failed:", err);
        process.exit(1);
    }
}

verifyDualFlows();

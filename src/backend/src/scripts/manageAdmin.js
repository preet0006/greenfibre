import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";

dotenv.config();

const manageAdmin = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`Connected to MongoDB (${mongoose.connection.name})`);

        // Check existing admins
        const existingAdmins = await User.find({ role: "admin" });
        console.log(`Found ${existingAdmins.length} admin accounts in DB:`);
        existingAdmins.forEach(a => console.log(`- ${a.email} (Verified: ${a.isVerified}, Name: ${a.full_name})`));

        const targetEmail = "admin@greenfibre.org";
        const targetPassword = "Admin@GreenFibre2026!";

        let adminUser = await User.findOne({ email: targetEmail });
        if (adminUser) {
            adminUser.role = "admin";
            adminUser.isVerified = true;
            adminUser.password = targetPassword; // pre('save') hook will hash it
            await adminUser.save();
            console.log(`Updated admin account: ${targetEmail}`);
        } else {
            adminUser = new User({
                full_name: "GreenFibre Admin",
                email: targetEmail,
                password: targetPassword,
                role: "admin",
                isVerified: true,
            });
            await adminUser.save();
            console.log(`Created new admin account: ${targetEmail}`);
        }

        console.log("=== ADMIN CREDENTIALS ===");
        console.log("Email:", targetEmail);
        console.log("Password:", targetPassword);
        console.log("Role:", adminUser.role);
        console.log("Verified:", adminUser.isVerified);
        console.log("=========================");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Error managing admin:", err);
        process.exit(1);
    }
};

manageAdmin();

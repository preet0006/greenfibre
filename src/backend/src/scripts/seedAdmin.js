import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline";
import { User } from "../models/user.model.js";

dotenv.config();

/* ================================
   DB CONNECT
================================ */
const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URL}`);
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ DB Connection Failed", error);
        process.exit(1);
    }
};

/* ================================
   CREATE SUPER ADMIN
================================ */
const seedAdmin = async () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const existingAdmin = await User.findOne({
        email: adminEmail,
        role: "admin",
    });

    if (existingAdmin) {
        console.log("⚠️ Admin already exists:", adminEmail);
        return;
    }

    const admin = await User.create({
        full_name: "Pzone Super Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        isVerified: true,
    });

    console.log("✅ Admin seeded successfully");
    console.log({
        email: adminEmail,
        password: adminPassword,
    });
};

/* ================================
   UPDATE USER ROLE / FIELDS
================================ */
const updateUser = async (email) => {
    const user = await User.findOne({ email });

    if (!user) {
        console.log("❌ User not found:", email);
        return;
    }

    user.role = "admin"; // or "user"
    user.isVerified = true;
    user.full_name = user.full_name || "Updated User";

    await user.save();

    console.log("✅ User updated successfully");
    console.log({
        email: user.email,
        role: user.role,
        verified: user.isVerified,
    });
};

/* ================================
   CLI
================================ */
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const start = async () => {
    await connectDB();

    rl.question(
        `
Choose an action:
1 → Seed Super Admin
2 → Promote User to Admin
Enter choice (1/2): `,
        async (choice) => {
            if (choice.trim() === "1") {
                await seedAdmin();
                rl.close();
                process.exit(0);
            }

            if (choice.trim() === "2") {
                rl.question("Enter user email to promote: ", async (email) => {
                    await updateUser(email.trim());
                    rl.close();
                    process.exit(0);
                });
                return; // ⬅️ IMPORTANT
            }

            console.log("❌ Invalid choice");
            rl.close();
            process.exit(0);
        }
    );
};

start();

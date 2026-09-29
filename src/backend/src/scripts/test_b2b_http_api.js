import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "../db/connectDB.js";
import { User } from "../models/user.model.js";
import userRoutes from "../routes/user.route.js";
import b2bRoutes from "../routes/b2b.route.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/users", userRoutes);
app.use("/api/b2b", b2bRoutes);

async function testHttpEndpoints() {
    try {
        await connectDB();
        const server = app.listen(0);
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}`;

        console.log(`Test server running at ${baseUrl}`);

        const testEmail = `b2b.http.${Date.now()}@corporate.com`;
        const testPassword = "SecurePassword123";

        // 1. Test POST /api/users/register
        console.log("\n--- TEST 1: POST /api/users/register ---");
        const regRes = await fetch(`${baseUrl}/api/users/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Priya Sharma",
                companyName: "Tech Innovators Pvt Ltd",
                email: testEmail,
                phone: "+91 9876543210",
                businessType: "Corporate Gifting & HR",
                gstin: "07AAAAA0000A1Z5",
                password: testPassword,
            }),
        });
        const regData = await regRes.json();
        console.log("Status:", regRes.status);
        console.log("Response:", JSON.stringify(regData, null, 2));
        if (regRes.status !== 201 || !regData.token || !regData.user) {
            throw new Error("Registration failed!");
        }

        const token = regData.token;

        // 2. Test POST /api/users/login
        console.log("\n--- TEST 2: POST /api/users/login ---");
        const loginRes = await fetch(`${baseUrl}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
                rememberMe: true,
            }),
        });
        const loginData = await loginRes.json();
        console.log("Status:", loginRes.status);
        console.log("Response:", JSON.stringify(loginData, null, 2));
        if (loginRes.status !== 200 || !loginData.token) {
            throw new Error("Login failed!");
        }

        // 3. Test GET /api/users/me with Bearer token
        console.log("\n--- TEST 3: GET /api/users/me ---");
        const meRes = await fetch(`${baseUrl}/api/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const meData = await meRes.json();
        console.log("Status:", meRes.status);
        console.log("Response:", JSON.stringify(meData, null, 2));
        if (meRes.status !== 200 || meData.user.fullName !== "Priya Sharma") {
            throw new Error("GET /api/users/me failed!");
        }

        // 4. Test POST /api/users/refresh-token
        console.log("\n--- TEST 4: POST /api/users/refresh-token ---");
        const refreshRes = await fetch(`${baseUrl}/api/users/refresh-token`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        });
        const refreshData = await refreshRes.json();
        console.log("Status:", refreshRes.status);
        console.log("Response:", JSON.stringify(refreshData, null, 2));
        if (refreshRes.status !== 200 || !refreshData.token) {
            throw new Error("Refresh token failed!");
        }

        // 5. Test GET /api/b2b/me
        console.log("\n--- TEST 5: GET /api/b2b/me ---");
        const b2bMeRes = await fetch(`${baseUrl}/api/b2b/me`, {
            headers: {
                Authorization: `Bearer ${refreshData.token}`,
            },
        });
        const b2bMeData = await b2bMeRes.json();
        console.log("Status:", b2bMeRes.status);
        console.log("Response:", JSON.stringify(b2bMeData, null, 2));
        if (b2bMeRes.status !== 200 || !b2bMeData.user) {
            throw new Error("GET /api/b2b/me failed!");
        }

        // 6. Test POST /api/b2b/refresh-token
        console.log("\n--- TEST 6: POST /api/b2b/refresh-token ---");
        const b2bRefreshRes = await fetch(`${baseUrl}/api/b2b/refresh-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: refreshData.token }),
        });
        const b2bRefreshData = await b2bRefreshRes.json();
        console.log("Status:", b2bRefreshRes.status);
        console.log("Response:", JSON.stringify(b2bRefreshData, null, 2));
        if (b2bRefreshRes.status !== 200 || !b2bRefreshData.token) {
            throw new Error("POST /api/b2b/refresh-token failed!");
        }

        // Cleanup
        await User.deleteOne({ email: testEmail });
        console.log("\nCleaned up test user from DB.");

        server.close();
        console.log("\n🎉 ALL HTTP ENDPOINT INTEGRATION TESTS PASSED!");
        process.exit(0);
    } catch (error) {
        console.error("HTTP test failed:", error);
        process.exit(1);
    }
}

testHttpEndpoints();

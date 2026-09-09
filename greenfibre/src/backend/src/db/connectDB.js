import mongoose from "mongoose";

let isConnecting = false;

export const connectDB = async () => {
    if (isConnecting || mongoose.connection.readyState === 1) {
        return;
    }

    isConnecting = true;
    try {
        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            console.warn("⚠️ MONGO_URL not defined in environment variables.");
            isConnecting = false;
            return;
        }

        const connectionInstance = await mongoose.connect(mongoUrl, {
            serverSelectionTimeoutMS: 5000,
            dbName: process.env.MONGO_DB_NAME || undefined,
        });

        console.log(`✅ MongoDB connected successfully at: ${connectionInstance.connection.host} (DB: ${connectionInstance.connection.name})`);
    } catch (error) {
        console.error(`⚠️ MongoDB connection error: ${error.message || error}`);
        console.log("🔄 Will retry connecting to MongoDB in 10 seconds...");
        setTimeout(() => {
            isConnecting = false;
            connectDB();
        }, 10000);
    } finally {
        isConnecting = false;
    }
};

mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected. Attempting reconnection...");
    setTimeout(() => {
        connectDB();
    }, 5000);
});

import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGO_URL}`
        );

        console.log(`DB connected at: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error(`Error connecting DB: ${error}`);
        process.exit(1);
    }
};

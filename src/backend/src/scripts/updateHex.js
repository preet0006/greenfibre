import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.MONGO_DB_NAME });

    const result = await mongoose.connection.collection("products").updateOne(
        { slug: "velveta-tissue-box" },
        { $set: { "colors.0.hex": "linear-gradient(135deg, #F5F0E8 50%, #6B4226 50%)" } }
    );

    console.log("✅ Updated:", result.modifiedCount, "document");
    console.log("   hex set to: linear-gradient(135deg, #F5F0E8 50%, #6B4226 50%)");
    console.log("   Off White (#F5F0E8) | Coffee (#6B4226)");
    process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });

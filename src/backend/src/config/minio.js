import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const MINIO_ENDPOINT = process.env.MINIO_BASE_URL || "http://localhost:9000";
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;

if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
    throw new Error(
        "MINIO_ACCESS_KEY and MINIO_SECRET_KEY must be set in environment"
    );
}

console.log("S3 Client connecting to:", MINIO_ENDPOINT);

export const s3 = new S3Client({
    region: "us-east-1",
    endpoint: MINIO_ENDPOINT,
    credentials: {
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
});

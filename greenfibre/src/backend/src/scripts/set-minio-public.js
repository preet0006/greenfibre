import { S3Client, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.MINIO_BASE_URL || "http://localhost:9000";
const accessKeyId = process.env.MINIO_ACCESS_KEY;
const secretAccessKey = process.env.MINIO_SECRET_KEY;
const bucket = process.env.MINIO_BUCKET || "media";

if (!accessKeyId || !secretAccessKey) {
    throw new Error(
        "MINIO_ACCESS_KEY and MINIO_SECRET_KEY must be set in environment"
    );
}

const s3Client = new S3Client({
    endpoint,
    region: "us-east-1",
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
    forcePathStyle: true,
});

const policy = {
    Version: "2012-10-17",
    Statement: [
        {
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucket}/*`],
        },
    ],
};

async function setPublicPolicy() {
    try {
        const command = new PutBucketPolicyCommand({
            Bucket: bucket,
            Policy: JSON.stringify(policy),
        });

        await s3Client.send(command);
        console.log("Bucket policy set to public");
    } catch (error) {
        console.error("Error setting bucket policy:", error);
        process.exitCode = 1;
    }
}

setPublicPolicy();

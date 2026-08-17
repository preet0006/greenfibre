import {
    S3Client,
    CreateBucketCommand,
    PutBucketPolicyCommand,
    HeadBucketCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.MINIO_BASE_URL || "http://localhost:9000";
const accessKeyId = process.env.MINIO_ACCESS_KEY;
const secretAccessKey = process.env.MINIO_SECRET_KEY;

if (!accessKeyId || !secretAccessKey) {
    throw new Error(
        "MINIO_ACCESS_KEY and MINIO_SECRET_KEY must be set in environment"
    );
}

const s3 = new S3Client({
    region: "us-east-1",
    endpoint,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
    forcePathStyle: true,
});

const BUCKET = process.env.MINIO_BUCKET || "media";

// Public read policy
const bucketPolicy = {
    Version: "2012-10-17",
    Statement: [
        {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${BUCKET}/*`],
        },
    ],
};

async function setupMinio() {
    try {
        // Check if bucket exists
        try {
            await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
            console.log(`Bucket '${BUCKET}' already exists`);
        } catch (error) {
            // Create bucket if it doesn't exist
            await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
            console.log(`Created bucket '${BUCKET}'`);
        }

        // Set public read policy
        await s3.send(
            new PutBucketPolicyCommand({
                Bucket: BUCKET,
                Policy: JSON.stringify(bucketPolicy),
            })
        );

        console.log(`Set public read policy on '${BUCKET}'`);
        console.log("\nMinIO setup complete!");
    } catch (error) {
        console.error("Setup failed:", error);
        process.exitCode = 1;
    }
}

setupMinio();

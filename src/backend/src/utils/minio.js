import {
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { s3 } from "../config/minio.js";
import dotenv from 'dotenv'

dotenv.config();

const BUCKET = "media";
const INTERNAL_BASE_URL = process.env.MINIO_INTERNAL_URL || "http://green-minio:9000";
const PUBLIC_BASE_URL = process.env.MINIO_PUBLIC_URL || "http://localhost:9000";

console.log("Using MinIO Internal URL:", INTERNAL_BASE_URL);
console.log("Using MinIO Public URL:", PUBLIC_BASE_URL);

// ========================
// Helper: Get Content Type
// ========================
const getContentType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
        // Images
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",

        // Videos
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",

        // Documents
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    return contentTypes[ext] || "application/octet-stream";
};

// ========================
// Upload Image
// ========================
export const uploadToMinio = async (filePath, folder = "general") => {
    try {
        if (!filePath || !fs.existsSync(filePath)) {
            console.error("File does not exist:", filePath);
            return null;
        }

        const ext = path.extname(filePath);
        const fileName = `${folder}/${Date.now()}-${uuidv4()}${ext}`;
        const fileBuffer = fs.readFileSync(filePath);
        const contentType = getContentType(filePath);

        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: fileName,
            Body: fileBuffer,
            ContentType: contentType,
        });

        await s3.send(command);

        // delete temp file
        fs.unlinkSync(filePath);

        // Return internal URL (for imgproxy/backend) or public URL (for frontend)
        return `${INTERNAL_BASE_URL}/${BUCKET}/${fileName}`;
    } catch (error) {
        console.error("MinIO upload error:", error);

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        return null;
    }
};

// ========================
// Upload Video
// ========================
export const uploadVideoToMinio = async (filePath, folder = "videos") => {
    try {
        if (!filePath || !fs.existsSync(filePath)) {
            console.error("File does not exist:", filePath);
            return null;
        }

        const ext = path.extname(filePath);
        const fileName = `${folder}/${Date.now()}-${uuidv4()}${ext}`;
        const fileBuffer = fs.readFileSync(filePath);
        const contentType = getContentType(filePath);

        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: fileName,
            Body: fileBuffer,
            ContentType: contentType,
        });

        await s3.send(command);

        // delete temp file
        fs.unlinkSync(filePath);

        return `${INTERNAL_BASE_URL}/${BUCKET}/${fileName}`;
    } catch (error) {
        console.error("MinIO video upload error:", error);

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        return null;
    }
};

// ========================
// Upload PDF
// ========================
export const uploadPdfToMinio = async (filePath, customName = null) => {
    try {
        if (!filePath || !fs.existsSync(filePath)) {
            console.error("File does not exist:", filePath);
            return null;
        }

        const fileName = customName
            ? `invoices/${customName}.pdf`
            : `pdfs/${Date.now()}-${uuidv4()}.pdf`;

        const fileBuffer = fs.readFileSync(filePath);

        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: fileName,
            Body: fileBuffer,
            ContentType: "application/pdf",
        });

        await s3.send(command);

        // delete temp file
        fs.unlinkSync(filePath);

        return `${INTERNAL_BASE_URL}/${BUCKET}/${fileName}`;
    } catch (error) {
        console.error("MinIO PDF upload error:", error);

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        return null;
    }
};

// ========================
// Delete from MinIO
// ========================
export const deleteFromMinio = async (fileUrl) => {
    try {
        if (!fileUrl) return;

        // extract key from URL
        const url = new URL(fileUrl);
        const key = url.pathname.replace(`/${BUCKET}/`, "");

        const command = new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
        });

        await s3.send(command);

        console.log(`✅ Deleted: ${key}`);
    } catch (error) {
        console.error("MinIO delete error:", error);
    }
};

// ========================
// Check if file exists
// ========================
export const checkFileExists = async (fileUrl) => {
    try {
        if (!fileUrl) return false;

        const url = new URL(fileUrl);
        const key = url.pathname.replace(`/${BUCKET}/`, "");

        const command = new HeadObjectCommand({
            Bucket: BUCKET,
            Key: key,
        });

        await s3.send(command);
        return true;
    } catch (error) {
        if (error.name === "NotFound") {
            return false;
        }
        console.error("MinIO check error:", error);
        return false;
    }
};

// ========================
// Convert internal URL to public URL
// (for returning to frontend)
// ========================
export const toPublicUrl = (internalUrl) => {
    if (!internalUrl) return null;
    return internalUrl.replace(INTERNAL_BASE_URL, PUBLIC_BASE_URL);
};

// ========================
// Convert public URL to internal URL
// (for imgproxy processing)
// ========================
export const toInternalUrl = (publicUrl) => {
    if (!publicUrl) return null;
    return publicUrl.replace(PUBLIC_BASE_URL, INTERNAL_BASE_URL);
};

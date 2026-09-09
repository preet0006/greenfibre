import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const IMGPROXY_URL = process.env.IMGPROXY_URL || "http://localhost:8080";
const MINIO_PUBLIC_URL =
    process.env.MINIO_PUBLIC_URL || "http://localhost:9000";

const rawKey = process.env.IMGPROXY_KEY;
const rawSalt = process.env.IMGPROXY_SALT;

if (!rawKey || !rawSalt) {
    throw new Error("IMGPROXY_KEY and IMGPROXY_SALT must be set in environment");
}

console.log("Using imgproxy URL:", IMGPROXY_URL);
console.log("Using MinIO public URL:", MINIO_PUBLIC_URL);

// MUST match docker-compose / imgproxy service env
const KEY = Buffer.from(rawKey, "hex");
const SALT = Buffer.from(rawSalt, "hex");

// base64 url safe
const base64url = (input) =>
    input
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

// create signature
const sign = (path) => {
    const hmac = crypto.createHmac("sha256", KEY);
    hmac.update(SALT);
    hmac.update(path);
    return base64url(hmac.digest());
};

/**
 * Generate imgproxy URL with optimized settings
 * @param {string} imageUrl - Source image URL
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {object} options - Additional options
 */
export const getImgproxyUrl = (
    imageUrl,
    width = 600,
    height = 600,
    options = {}
) => {
    if (!imageUrl) return null;

    const {
        resize = "fit",
        quality = 85,
        sharpen = true,
        format = "auto",
    } = options;

    // Convert ALL URLs to public URL (for both signature and client)
    let publicUrl = imageUrl;

    // Normalize to public URL
    if (publicUrl.includes("localhost:9000")) {
        publicUrl = publicUrl.replace(
            "http://localhost:9000",
            MINIO_PUBLIC_URL
        );
    } else if (publicUrl.includes("green-minio:9000")) {
        publicUrl = publicUrl.replace(
            "http://green-minio:9000",
            MINIO_PUBLIC_URL
        );
    } else if (publicUrl.includes("minio:9000")) {
        publicUrl = publicUrl.replace("http://minio:9000", MINIO_PUBLIC_URL);
    }

    // Build processing options
    const processing = [];
    processing.push(`rs:${resize}:${width}:${height}`);
    processing.push(`q:${quality}`);
    if (sharpen) {
        processing.push(`sh:0.5`);
    }
    if (format !== "auto") {
        processing.push(`f:${format}`);
    }

    // Build path with PUBLIC URL
    const path = `/${processing.join("/")}/plain/${publicUrl}`;

    // Sign the path
    const signature = sign(path);

    // Return full imgproxy URL with public URL
    return `${IMGPROXY_URL}/${signature}${path}`;
};

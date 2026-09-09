// Add this helper to your order.controller.js or create a new utils file

import fs from "fs";
import axios from "axios";
import path from "path";

/**
 * Generate invoice and handle both local file (for email) and MinIO URL (for storage)
 */
export const generateAndUploadInvoice = async (order) => {
    try {
        // Generate invoice PDF (returns MinIO URL or local path)
        const invoiceUrl = await generateInvoicePdf(order);

        // Determine if we need to download from MinIO for email attachment
        let localFilePath;

        if (invoiceUrl.startsWith("http")) {
            // It's a MinIO URL, download it for email attachment
            const tempDir = path.join("public", "temp-invoices");
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const fileName = `invoice-${order._id.toString()}.pdf`;
            localFilePath = path.join(tempDir, fileName);

            // Download from MinIO
            const response = await axios({
                method: "GET",
                url: invoiceUrl,
                responseType: "stream",
            });

            const writer = fs.createWriteStream(localFilePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
            });
        } else {
            // It's already a local path
            localFilePath = invoiceUrl;
        }

        return {
            invoiceUrl, // MinIO URL for database storage
            localFilePath, // Local path for email attachment
        };
    } catch (error) {
        console.error("Error in generateAndUploadInvoice:", error);
        throw error;
    }
};

/**
 * Clean up temporary invoice files after email is sent
 */
export const cleanupTempInvoice = (filePath) => {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("Cleaned up temp invoice:", filePath);
        }
    } catch (error) {
        console.error("Error cleaning up temp invoice:", error);
    }
};

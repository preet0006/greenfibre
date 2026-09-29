import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendMail = async (to, subject, message, attachments = []) => {
    try {
        if (!process.env.USER_EMAIL || !process.env.USER_PASS) {
            console.warn("sendMail: USER_EMAIL or USER_PASS not set. Skipping email dispatch.");
            return false;
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.USER_PASS,
            },
        });

        await transporter.sendMail({
            from: `"GreenFibre" <${process.env.USER_EMAIL}>`,
            to,
            subject,
            html: message,
            attachments,
        });
        return true;
    } catch (error) {
        console.error("sendMail error (handled gracefully):", error.message || error);
        return false;
    }
};


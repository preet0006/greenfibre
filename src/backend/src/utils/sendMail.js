import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendMail = async (to, subject, message, attachments = []) => {
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
};

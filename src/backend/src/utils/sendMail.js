import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendMail = async (to, subject, message, attachments = []) => {
    const userEmail = process.env.USER_EMAIL?.trim();
    const userPass = process.env.USER_PASS?.replace(/\s+/g, ""); // Google app passwords are 16 alphanumeric characters without spaces

    if (!userEmail || !userPass) {
        throw new Error("Email credentials missing: USER_EMAIL or USER_PASS not set in .env");
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: userEmail,
            pass: userPass,
        },
    });

    await transporter.sendMail({
        from: `"GreenFibre" <${userEmail}>`,
        to,
        subject,
        html: message,
        attachments,
    });
};

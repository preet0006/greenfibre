import { Contact } from "../models/contact.model.js";
import { User } from "../models/user.model.js";
import { sendMail } from "../utils/sendMail.js";
import { baseEmailTemplate } from "../utils/emailTemplate.js";

// =============================
// SUBMIT CONTACT FORM (Public)
// =============================
export const submitContact = async (req, res) => {
    try {
        const { name, phone, email, message } = req.body;
        const normalizedName = String(name || "").trim();
        const normalizedEmail = String(email || "")
            .trim()
            .toLowerCase();
        const normalizedMessage = String(message || "").trim();
        const normalizedPhone = String(phone || "").replace(/\D/g, "");
        const timestamp = req.body?.timestamp ? new Date(req.body.timestamp) : new Date();
        const submittedAt = Number.isNaN(timestamp.getTime()) ? new Date() : timestamp;
        const userId = req.user?._id || null;

        if (
            !normalizedName ||
            !normalizedPhone ||
            !normalizedEmail ||
            !normalizedMessage
        ) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
        const phoneOk = /^[6-9]\d{9}$/.test(normalizedPhone);
        if (!emailOk) {
            return res.status(400).json({
                message: "Please enter a valid email address",
            });
        }

        if (!phoneOk) {
            return res.status(400).json({
                message: "Please enter a valid 10-digit phone number",
            });
        }

        const contact = await Contact.create({
            name: normalizedName,
            phone: normalizedPhone,
            email: normalizedEmail,
            message: normalizedMessage,
            user: userId,
            submittedAt,
        });

        if (userId) {
            try {
                const user = await User.findById(userId).select("phone");
                if (user && !user.phone) {
                    user.phone = normalizedPhone;
                    await user.save();
                }
            } catch (error) {
                console.error("Failed to update user phone from contact:", error);
            }
        }

        const escapeHtml = (value = "") =>
            String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");

        const safeName = escapeHtml(normalizedName);
        const safeEmail = escapeHtml(normalizedEmail);
        const safePhone = escapeHtml(normalizedPhone);
        const safeMessage = escapeHtml(normalizedMessage).replace(/\n/g, "<br/>");

        const subject = "New Contact Inquiry - GreenFibre";

        // Optional: notify admin
        const emailBody = baseEmailTemplate({
            title: "New Contact Inquiry",
            subtitle: "GreenFibre",
            body: `
        <p><b>Name:</b> ${safeName}</p>
        <p><b>Email:</b> ${safeEmail}</p>
        <p><b>Phone:</b> ${safePhone}</p>
        <p><b>Message:</b></p>
        <p>${safeMessage}</p>
      `,
        });

        await sendMail(process.env.USER_EMAIL, subject, emailBody);

        return res.status(201).json({
            success: true,
            message: "Your message has been submitted successfully.",
        });
    } catch (error) {
        console.error("Contact error:", error);
        return res.status(500).json({
            message: "Error submitting contact form",
        });
    }
};

// =============================
// GET ALL CONTACTS (Admin)
// =============================
export const getAllContacts = async (req, res) => {
    try {
        const { status } = req.query;

        let filter = {};
        if (status) filter.status = status;

        const contacts = await Contact.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: contacts.length,
            contacts,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching contacts",
        });
    }
};

// =============================
// TOGGLE CONTACT STATUS
// =============================
export const toggleContactStatus = async (req, res) => {
    try {
        const { contactId } = req.params;

        const contact = await Contact.findById(contactId);

        if (!contact) {
            return res.status(404).json({
                message: "Contact not found",
            });
        }

        contact.status = contact.status === "new" ? "resolved" : "new";

        await contact.save();

        return res.status(200).json({
            success: true,
            message: "Status updated",
            status: contact.status,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error updating status",
        });
    }
};

// =============================
// DELETE CONTACT (Admin)
// =============================
export const deleteContact = async (req, res) => {
    try {
        const { contactId } = req.params;

        const contact = await Contact.findById(contactId);

        if (!contact) {
            return res.status(404).json({
                message: "Contact not found",
            });
        }

        await Contact.findByIdAndDelete(contactId);

        return res.status(200).json({
            success: true,
            message: "Contact deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error deleting contact",
        });
    }
};

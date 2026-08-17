import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            default: "contact",
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        phone: {
            type: String,
            required: true,
            match: [/^\d{10}$/, "Enter valid 10 digit phone number"],
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },

        status: {
            type: String,
            enum: ["new", "resolved"],
            default: "new",
        },
    },
    { timestamps: true }
);

contactSchema.index({ type: 1 });
contactSchema.index({ status: 1 });

export const Contact = mongoose.model("Contact", contactSchema);

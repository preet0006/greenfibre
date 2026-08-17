import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        addressType: {
            type: String,
            enum: ["billing", "shipping"],
            required: true,
            default: "shipping",
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        companyName: {
            type: String,
            trim: true,
        },

        streetAddress: {
            type: String,
            required: true,
            trim: true,
        },

        landmark: {
            type: String,
            trim: true,
        },

        city: {
            type: String,
            required: true,
            trim: true,
        },

        state: {
            type: String,
            required: true,
            trim: true,
        },

        pincode: {
            type: String,
            required: true,
            match: [/^\d{6}$/, "Invalid pincode"],
        },

        phone: {
            type: String,
            required: true,
            match: [/^\d{10}$/, "Invalid phone number"],
        },

        // Optional — fall back to account email when omitted
        email: {
            type: String,
            lowercase: true,
            trim: true,
            default: "",
        },

        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const Address = mongoose.model("Address", addressSchema);

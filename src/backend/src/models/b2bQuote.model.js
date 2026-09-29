import mongoose from "mongoose";

const b2bQuoteItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        productName: String,
        colorName: String,
        colorHex: String,
        requestedQuantity: {
            type: Number,
            required: true,
            min: 1,
        },
        targetPricePerUnit: {
            type: Number,
            default: null,
        },
        offeredPricePerUnit: {
            type: Number,
            default: null,
        },
    },
    { _id: false }
);

const b2bQuoteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        quoteNumber: {
            type: String,
            unique: true,
            index: true,
        },
        companyName: {
            type: String,
            required: true,
            trim: true,
        },
        contactPerson: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
        },
        gstin: {
            type: String,
            uppercase: true,
            trim: true,
        },
        deliveryPincode: {
            type: String,
            trim: true,
        },
        items: [b2bQuoteItemSchema],
        customRequirements: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["submitted", "reviewing", "quoted", "accepted", "rejected", "expired"],
            default: "submitted",
            index: true,
        },
        adminNote: {
            type: String,
            default: "",
        },
        totalOfferedAmount: {
            type: Number,
            default: null,
        },
        validUntil: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Auto generate Quote Number (e.g. GF-Q-2026-XXXX)
b2bQuoteSchema.pre("save", function () {
    if (!this.quoteNumber) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        this.quoteNumber = `GF-Q-${Date.now().toString().slice(-6)}-${rand}`;
    }
});

export const B2BQuote = mongoose.model("B2BQuote", b2bQuoteSchema);

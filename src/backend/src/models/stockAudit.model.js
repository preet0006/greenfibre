import mongoose from "mongoose";

const stockAuditSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        sku: {
            type: String,
            default: "",
            index: true,
        },
        productName: {
            type: String,
            default: "",
        },
        action: {
            type: String,
            enum: [
                "CHANNEL_STOCK_UPDATE",
                "STOCK_ALLOCATION_MIGRATION",
                "ORDER_DEDUCTION",
                "ORDER_RESTORE",
                "ADMIN_MANUAL_EDIT",
            ],
            default: "CHANNEL_STOCK_UPDATE",
            index: true,
        },
        mode: {
            type: String,
            enum: ["set", "adjust", "migrate", "order"],
            default: "set",
        },
        oldB2BStock: {
            type: Number,
            default: 0,
        },
        oldB2CStock: {
            type: Number,
            default: 0,
        },
        newB2BStock: {
            type: Number,
            default: 0,
        },
        newB2CStock: {
            type: Number,
            default: 0,
        },
        physicalStock: {
            type: Number,
            default: 0,
        },
        performedBy: {
            userId: { type: String, default: "system" },
            email: { type: String, default: "system" },
            role: { type: String, default: "admin" },
        },
        reason: {
            type: String,
            default: "",
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

stockAuditSchema.index({ createdAt: -1 });

export const StockAuditLog = mongoose.model("StockAuditLog", stockAuditSchema);

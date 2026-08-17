import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true,
        },

        discountValue: {
            type: Number,
            required: true,
        },

        minOrderAmount: {
            type: Number,
            default: 0,
        },

        maxDiscountAmount: {
            type: Number,
        },

        expiryDate: {
            type: Date,
            required: true,
        },

        usageLimit: {
            type: Number, // total usage allowed
            default: 0, // 0 means unlimited
        },

        usedCount: {
            type: Number,
            default: 0,
        },

        perUserLimit: {
            type: Number,
            default: 1,
        },

        usedBy: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                count: {
                    type: Number,
                    default: 1,
                },
            },
        ],

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export const Coupon = mongoose.model("Coupon", couponSchema);

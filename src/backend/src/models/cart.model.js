import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        colorIndex: {
            type: Number,
            required: true,
            min: 0,
        },

        colorName: {
            type: String,
            required: true,
        },

        colorHex: {
            type: String,
            default: "",
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },

        price: {
            type: Number, // snapshot of discounted price at time of adding
            required: true,
        },
    },
    { _id: false }
);

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        items: [cartItemSchema],

        totalAmount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);

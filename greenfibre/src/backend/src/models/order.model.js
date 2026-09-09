import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },

        name: String,
        image: String,

        // Color variant info
        colorIndex: {
            type: Number,
            required: true,
        },
        colorName: String,
        colorHex: String,

        quantity: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const addressSnapshotSchema = new mongoose.Schema(
    {
        fullName: String,
        companyName: String,
        streetAddress: String,
        landmark: String,
        city: String,
        state: String,
        pincode: String,
        phone: String,
        email: String,
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        items: [orderItemSchema],

        shippingAddress: {
            type: addressSnapshotSchema,
            required: true,
        },

        totalAmount: {
            type: Number,
            required: true,
        },

        discountAmount: {
            type: Number,
            default: 0,
        },

        finalAmount: {
            type: Number,
            required: true,
        },

        couponCode: String,

        // Payment - Easebuzz
        paymentMethod: {
            type: String,
            default: "Easebuzz",
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
        },

        orderStatus: {
    type: String,
    enum: [
        "pending",
        "placed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "payment_failed",
    ],
    default: "pending",
},

        // Easebuzz payment details
        easebuzzOrderId: String, // Unique order ID for Easebuzz
        transactionId: String, // Easebuzz transaction ID
        paymentResponse: Object, // Full Easebuzz response

        // Razorpay payment details
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String,

        invoiceUrl: String,

        // Shipping - NimbusPost
        shippingDetails: {
            courierName: String,
            trackingNumber: String, // AWB number from NimbusPost
            trackingUrl: String,
            nimbusOrderId: String, // NimbusPost order ID
            estimatedDelivery: Date,
            shippedAt: Date,
            deliveredAt: Date,
        },

        // Status history
        statusHistory: [
            {
                status: String,
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                note: String,
            },
        ],

        // Cancellation
        cancellationReason: String,
        cancelledAt: Date,
    },
    { timestamps: true }
);

// Add index for faster queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ easebuzzOrderId: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ orderStatus: 1 });

export const Order = mongoose.model("Order", orderSchema);

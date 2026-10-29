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
        shippedQuantity: {
            type: Number,
            default: 0,
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

        // Human-friendly unique order number (e.g. GF-2026-000123)
        orderNumber: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
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
                "undelivered",
                "qc_failed",
                "lost",
                "rto_initiated",
                "rto_in_transit",
                "rto_delivered",
                "return_out_for_pickup",
                "return_picked_up",
                "return_in_transit",
                "return_delivered",
                "cancelled",
                "failed",
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

        // Shipping
        shippingDetails: {
            type: {
                courierName: String,
                trackingNumber: String,       // AWB number (kept for backwards compat)
                awbCode: String,              // Explicit AWB code from Shiprocket
                trackingUrl: String,
                nimbusOrderId: String,        // Legacy: NimbusPost order ID (kept for backwards compat)
                shiprocketOrderId: String,    // Shiprocket sr_order_id
                shiprocketShipmentId: String, // Shiprocket shipment_id
                estimatedDelivery: Date,
                shippedAt: Date,
                deliveredAt: Date,
                labelUrl: String,             // Shiprocket label PDF URL
                manifestUrl: String,          // Shiprocket manifest PDF URL
                lastCourierStatus: String,    // Raw incoming courier status string
                lastCourierTimestamp: String, // Incoming courier timestamp for deduplication
                lastCourierRaw: Object,       // Full unmapped courier scans/payload
            },
            default: () => ({}),
        },

        // Operational conflict flag (e.g. out-of-stock race condition at payment)
        hasStockConflict: {
            type: Boolean,
            default: false,
        },
        stockConflictNotes: [String],

        // Idempotency flags for payment fulfillment
        stockDeducted: {
            type: Boolean,
            default: false,
        },
        stockRestored: {
            type: Boolean,
            default: false,
        },
        orderChannel: {
            type: String,
            enum: ["b2c", "b2b", "mobile"],
            default: "b2c",
            index: true,
        },
        couponApplied: {
            type: Boolean,
            default: false,
        },
        invoiceClaimedAt: {
            type: Date,
            default: null,
        },
        dispatchClaimedAt: {
            type: Date,
            default: null,
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

        // ── Reward Points ──────────────────────────────────────────────────
        // Points deducted from user balance at order creation (REDEEM ledger entry)
        rewardPointsRedeemed: {
            type: Number,
            default: 0,
        },
        // \u20b9 discount applied from reward redemption (points × point_value)
        rewardDiscount: {
            type: Number,
            default: 0,
        },
        // Points credited to user after successful payment (EARN ledger entry)
        rewardPointsEarned: {
            type: Number,
            default: 0,
        },
        // Snapshot of the config rates at order-creation time
        // Prevents later config changes from altering this order's earn/redeem logic
        rewardConfigSnapshot: {
            earn_percent: { type: Number },
            point_value: { type: Number },
            max_redeem_percent: { type: Number },
            direct_percent: { type: Number },
            coupon_percent: { type: Number },
        },
    },
    { timestamps: true }
);

// Add index for faster queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ easebuzzOrderId: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ orderStatus: 1 });

export const Order = mongoose.model("Order", orderSchema);

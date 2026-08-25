import express from "express";
import {
    createOrder,
    verifyPaymentGateway,
    verifyPayment,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    getSingleOrder,
} from "../controllers/order.controller.js";
import {
    authMiddleware,
    adminAuthMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// ── Order creation ────────────────────────────────────────────
router.post("/create", authMiddleware, createOrder);

// ── Payment verification ──────────────────────────────────────
// Gateway callback: Easebuzz POSTs here after payment (surl / furl).
// Always browser-redirects to /orders/success or /orders/failed.
router.post("/verify", verifyPaymentGateway);

// Safety: if user refreshes the /verify page or gateway uses GET on cancel
router.get("/verify", (req, res) => {
    const frontendBase =
        process.env.FRONTEND_URL ||
        process.env.CLIENT_ORIGIN ||
        "http://localhost:3000";
    return res.redirect(`${frontendBase}/orders/failed?reason=cancelled`);
});

// AJAX client: frontend calls this after an in-page payment flow (JSON response).
router.post("/payment/verify", verifyPayment);

// ── Order queries ─────────────────────────────────────────────
router.get("/my-orders", authMiddleware, getMyOrders);
router.get("/admin", adminAuthMiddleware, getAllOrders);
router.get("/:orderId", authMiddleware, getSingleOrder);
router.patch("/status/:orderId", adminAuthMiddleware, updateOrderStatus);

export default router;


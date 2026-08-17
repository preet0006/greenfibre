import express from "express";
import {
    createOrder,
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

router.post("/create", authMiddleware, createOrder);
router.post("/verify", verifyPayment);
router.get("/my-orders", authMiddleware, getMyOrders);
router.get("/admin", adminAuthMiddleware, getAllOrders);
router.get("/:orderId", authMiddleware, getSingleOrder);
router.patch("/status/:orderId", adminAuthMiddleware, updateOrderStatus);

export default router;

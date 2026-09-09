import express from "express";
import {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    getAllCarts,
    mergeCart,
} from "../controllers/cart.controller.js";
import {
    authMiddleware,
    adminAuthMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/all", adminAuthMiddleware, getAllCarts);
router.get("/", authMiddleware, getCart);
router.post("/add", authMiddleware, addToCart);
router.post("/merge", authMiddleware, mergeCart);
router.patch("/update", authMiddleware, updateCartItem);
router.delete("/remove/:productId", authMiddleware, removeCartItem);
router.delete("/clear", authMiddleware, clearCart);

export default router;

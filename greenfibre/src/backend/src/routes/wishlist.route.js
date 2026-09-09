import express from "express";
import {
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    toggleWishlist,
} from "../controllers/wishlist.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getWishlist);

router.post("/add", authMiddleware, addToWishlist);

router.delete("/remove/:productId", authMiddleware, removeFromWishlist);

// Recommended modern approach
router.post("/toggle", authMiddleware, toggleWishlist);

export default router;

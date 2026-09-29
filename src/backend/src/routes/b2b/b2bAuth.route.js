import express from "express";
import {
    registerB2BUser,
    loginB2BUser,
    getB2BProfile,
    updateB2BProfile,
    refreshB2BToken,
} from "../../controllers/b2b/b2bAuth.controller.js";
import {
    forgotB2CPassword,
    resetB2CPassword,
} from "../../controllers/b2c/b2cAuth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// ==========================================
// PUBLIC B2B ENTERPRISE AUTH ROUTES
// ==========================================
router.post("/register", registerB2BUser);
router.post("/login", loginB2BUser);
router.post("/refresh-token", refreshB2BToken);
router.post("/auth/refresh", refreshB2BToken);
router.post("/forgot-password", forgotB2CPassword);
router.post("/reset-password", resetB2CPassword);

// ==========================================
// PROTECTED B2B USER PROFILE ROUTES
// ==========================================
router.get("/me", authMiddleware, getB2BProfile);
router.get("/profile", authMiddleware, getB2BProfile);
router.put("/profile", authMiddleware, updateB2BProfile);

export default router;

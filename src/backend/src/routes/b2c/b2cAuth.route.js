import express from "express";
import {
    registerB2CUser,
    verifyB2COtp,
    resendB2COtp,
    loginB2CUser,
    logoutB2CUser,
    getB2CUserProfile,
    updateB2CUserProfile,
    deleteB2CUserProfile,
    forgotB2CPassword,
    resetB2CPassword,
    updateB2CPassword,
    refreshB2CToken,
} from "../../controllers/b2c/b2cAuth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

// ==========================================
// PUBLIC B2C AUTH ROUTES
// ==========================================
router.post("/register", registerB2CUser);
router.post("/verify-otp", verifyB2COtp);
router.post("/resend-otp", resendB2COtp);
router.post("/login", loginB2CUser);
router.post("/forgot-password", forgotB2CPassword);
router.post("/reset-password", resetB2CPassword);
router.post("/refresh-token", refreshB2CToken);
router.post("/auth/refresh", refreshB2CToken);

// ==========================================
// PROTECTED B2C USER ROUTES
// ==========================================
router.post("/logout", authMiddleware, logoutB2CUser);
router.get("/me", authMiddleware, getB2CUserProfile);
router.get("/profile", authMiddleware, getB2CUserProfile);
router.put(
    "/update-profile",
    authMiddleware,
    upload.single("profile_image"),
    updateB2CUserProfile
);
router.put("/update-password", authMiddleware, updateB2CPassword);
router.delete("/delete-account", authMiddleware, deleteB2CUserProfile);

export default router;

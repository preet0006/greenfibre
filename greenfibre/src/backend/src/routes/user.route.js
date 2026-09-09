import express from "express";
import {
    registerUser,
    verifyOtp,
    loginUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
    resendOtp,
    forgotPassword,
    resetPassword,
    updatePassword,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes (logged-in users)
router.post("/logout", authMiddleware, logoutUser);
router.get("/me", authMiddleware, getUserProfile);
router.put(
    "/update-profile",
    authMiddleware,
    upload.single("profile_image"),
    updateUserProfile
);
router.put("/update-password", authMiddleware, updatePassword);
router.delete("/delete-account", authMiddleware, deleteUserProfile);

export default router;

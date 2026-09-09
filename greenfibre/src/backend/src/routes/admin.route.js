import express from "express";
import {
    loginAdmin,
    forgotPassword,
    resetPassword,
    listUsers,
    deleteUserByAdmin,
    createAdminByAdmin,
    getUserProfile,
    logoutAdmin,
    updateUserProfile,
    updatePassword,
} from "../controllers/user.controller.js";
import { adminAuthMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Admin protected routes
router.use(adminAuthMiddleware);
router.get("/me", getUserProfile);
router.put(
    "/update-profile",
    upload.single("profile_image"),
    updateUserProfile
);
router.post("/logout", logoutAdmin);
router.get("/users", listUsers);
router.put("/update-password", updatePassword);
router.post("/create-admin", createAdminByAdmin);
router.delete("/delete-user", deleteUserByAdmin);

export default router;

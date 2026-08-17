import express from "express";
import {
    createBanner,
    getBanners,
    toggleBannerStatus,
    deleteBanner,
    swapBannerOrder,
} from "../controllers/banner.controller.js";
import { adminAuthMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/", getBanners);

router.post(
    "/create",
    adminAuthMiddleware,
    upload.single("media"),
    createBanner
);
router.patch(
    "/toggle-status/:bannerId",
    adminAuthMiddleware,
    toggleBannerStatus
);
router.post("/swap-order/", adminAuthMiddleware, swapBannerOrder);
router.delete("/delete/:bannerId", adminAuthMiddleware, deleteBanner);

export default router;

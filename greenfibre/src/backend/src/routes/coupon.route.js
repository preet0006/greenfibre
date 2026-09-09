import express from "express";
import {
    createCoupon,
    validateCoupon,
    toggleCouponStatus,
    deleteCoupon,
    getAllCoupons,
    getCoupons,
} from "../controllers/coupon.controller.js";
import {
    authMiddleware,
    adminAuthMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getCoupons);
router.get("/all", adminAuthMiddleware, getAllCoupons);
router.post("/validate", authMiddleware, validateCoupon);
router.post("/create", adminAuthMiddleware, createCoupon);
router.patch(
    "/toggle-status/:couponId",
    adminAuthMiddleware,
    toggleCouponStatus
);
router.delete("/delete/:couponId", adminAuthMiddleware, deleteCoupon);

export default router;

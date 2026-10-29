/**
 * rewards.route.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Mounted at:
 *   /api/rewards         — customer endpoints
 *   /api/admin/rewards   — admin endpoints (handled in admin.route.js via re-export)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware, adminAuthMiddleware } from "../middlewares/auth.middleware.js";
import {
    getMyRewardsSummary,
    redeemPreview,
    getFirstOrderCoupon,
    adminGetConfig,
    adminUpdateConfig,
    adminGetLedger,
    adminAdjust,
    adminNegativeBalanceUsers,
} from "../controllers/rewards.controller.js";

const router = express.Router();

// Rate limiter for redeem-preview (prevent scanning attacks)
const previewLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many redemption preview requests. Please slow down." },
});

// ── Customer routes ───────────────────────────────────────────────────────────
router.get("/summary",              authMiddleware, getMyRewardsSummary);
router.post("/redeem-preview",      authMiddleware, previewLimiter, redeemPreview);
router.get("/first-order-coupon",   authMiddleware, getFirstOrderCoupon);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get("/admin/config",                     adminAuthMiddleware, adminGetConfig);
router.get("/config",                           adminAuthMiddleware, adminGetConfig);

router.put("/admin/config",                     adminAuthMiddleware, adminUpdateConfig);
router.put("/config",                           adminAuthMiddleware, adminUpdateConfig);

router.get("/admin/ledger",                     adminAuthMiddleware, adminGetLedger);
router.get("/ledger",                           adminAuthMiddleware, adminGetLedger);

router.post("/admin/adjust",                    adminAuthMiddleware, adminAdjust);
router.post("/adjust",                          adminAuthMiddleware, adminAdjust);

router.get("/admin/users/negative-balance",     adminAuthMiddleware, adminNegativeBalanceUsers);
router.get("/users/negative-balance",           adminAuthMiddleware, adminNegativeBalanceUsers);

export default router;

import express from "express";
import {
    handleShiprocketWebhook,
    getServiceability,
    getTrackingByAWB,
} from "../controllers/shiprocket.controller.js";
import { adminAuthMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ── Webhook — called by Shiprocket (no auth header from their side) ────────
// URL must NOT contain: shiprocket, kartrocket, sr, kr
router.post("/delivery-update", handleShiprocketWebhook);

// ── Admin-only API proxies ─────────────────────────────────────────────────
router.get("/serviceability", adminAuthMiddleware, getServiceability);
router.get("/track/:awb", adminAuthMiddleware, getTrackingByAWB);

export default router;

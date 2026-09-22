import express from "express";
import {
    handleShiprocketWebhook,
    getServiceability,
    getTrackingByAWB,
    dispatchOrder,
    assignAWB,
    schedulePickup,
    getShipmentForOrder,
    cancelOrder,
    generateShippingLabel,
} from "../controllers/shiprocket.controller.js";
import { adminAuthMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ── Webhook — called by Shiprocket (no auth header from their side) ────────
// IMPORTANT: URL must NOT contain: shiprocket, kartrocket, sr, kr
router.post("/delivery-update", handleShiprocketWebhook);

// ── Admin-only: Read endpoints ─────────────────────────────────────────────
router.get("/serviceability", adminAuthMiddleware, getServiceability);
router.get("/track/:awb", adminAuthMiddleware, getTrackingByAWB);
router.get("/shipment/:orderId", adminAuthMiddleware, getShipmentForOrder);

// ── Admin-only: Action endpoints ───────────────────────────────────────────
// POST /api/shipping/dispatch/:orderId  — Full dispatch: create SR order + AWB + pickup
router.post("/dispatch/:orderId", adminAuthMiddleware, dispatchOrder);

// POST /api/shipping/awb/:orderId  — Assign AWB only (order must already exist in SR)
router.post("/awb/:orderId", adminAuthMiddleware, assignAWB);

// POST /api/shipping/pickup/:orderId  — Schedule pickup (order must have AWB)
router.post("/pickup/:orderId", adminAuthMiddleware, schedulePickup);

// POST /api/shipping/label/:orderId  — Generate shipping label PDF
router.post("/label/:orderId", adminAuthMiddleware, generateShippingLabel);

// DELETE /api/shipping/cancel/:orderId  — Cancel SR order + update DB
router.delete("/cancel/:orderId", adminAuthMiddleware, cancelOrder);

export default router;

import express from "express";
import { adminAuthMiddleware } from "../middlewares/auth.middleware.js";
import { getDashboardStats } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/stats", adminAuthMiddleware, getDashboardStats);

export default router;

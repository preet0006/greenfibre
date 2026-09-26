import { Router } from "express";
import { getMobileHomepage } from "../controllers/mobile.controller.js";

const router = Router();

// GET /api/mobile/homepage
// → banners + categories + giftProducts + bestSellers + newArrivals (one shot)
router.get("/homepage", getMobileHomepage);

export default router;

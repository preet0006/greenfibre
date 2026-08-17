import express from "express";
import {
    getPageSettings,
    updatePageSettings,
} from "../controllers/pageSettings.controller.js";
import { adminAuthMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getPageSettings);
router.put("/", adminAuthMiddleware, updatePageSettings);

export default router;

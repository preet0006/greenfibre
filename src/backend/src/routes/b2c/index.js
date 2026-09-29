import express from "express";
import b2cAuthRoutes from "./b2cAuth.route.js";

const router = express.Router();

// B2C Customer Auth & Account Management
router.use("/", b2cAuthRoutes);

export default router;

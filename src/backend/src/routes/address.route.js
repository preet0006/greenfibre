import express from "express";
import {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    getDefaultAddress,
} from "../controllers/address.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/add", addAddress);
router.get("/", getAddresses);
router.get("/default", getDefaultAddress);
router.put("/update/:addressId", updateAddress);
router.delete("/delete/:addressId", deleteAddress);

export default router;

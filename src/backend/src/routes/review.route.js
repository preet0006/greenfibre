import express from "express";
import {
    createReview,
    getProductReviews,
    approveReview,
    deleteReview,
    allReviews,
} from "../controllers/review.controller.js";
import {
    authMiddleware,
    adminAuthMiddleware,
} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/", (req, res) => allReviews(req, res, { approvedOnly: true }));
router.get("/all", adminAuthMiddleware, allReviews);
router.get("/:productId", getProductReviews);
router.post("/create", authMiddleware, upload.array("images", 5), createReview);
router.patch("/approve/:reviewId", adminAuthMiddleware, approveReview);
router.delete("/delete/:reviewId", adminAuthMiddleware, deleteReview);

export default router;

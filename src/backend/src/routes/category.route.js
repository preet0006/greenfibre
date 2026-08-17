import express from "express";
import {
    createCategory,
    getAllCategories,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
} from "../controllers/category.controller.js";
import { adminAuthMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:slug", getCategoryBySlug);

router.use(adminAuthMiddleware);
router.post("/", upload.single("image"), createCategory);
router.put("/:id", upload.single("image"), updateCategory);
router.delete("/:id", deleteCategory);
router.patch("/:id/toggle", toggleCategoryStatus);

export default router;

import express from "express";
import {
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getProducts,
    getSingleProduct,
    updateStock,
    searchProducts,
    getRelatedProducts,
    addColorVariant,
    removeColorVariant,
} from "../controllers/product.controller.js";
import { adminAuthMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/related/:slug", getRelatedProducts);
router.get("/:slug", getSingleProduct);

router.post("/create", adminAuthMiddleware, upload.any(), createProduct);
router.put("/update/:productId", adminAuthMiddleware, upload.any(), updateProduct);
router.patch("/update-stock/:productId", adminAuthMiddleware, updateStock);
router.post(
    "/add-color/:productId",
    adminAuthMiddleware,
    upload.array("images", 10),
    addColorVariant
);
router.delete(
    "/remove-color/:productId/:colorIndex",
    adminAuthMiddleware,
    removeColorVariant
);
router.delete("/delete/:productId", adminAuthMiddleware, deleteProduct);
router.patch(
    "/toggle-status/:productId",
    adminAuthMiddleware,
    toggleProductStatus
);

export default router;

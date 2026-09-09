import express from "express";
import {
    createGalleryItems,
    getGallery,
    toggleGalleryStatus,
    deleteGalleryItem,
    updateGalleryOrder,
} from "../controllers/gallery.controller.js";
import { adminAuthMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/", getGallery);
router.post(
    "/create",
    adminAuthMiddleware,
    upload.array("images", 20),
    createGalleryItems
);
router.patch(
    "/toggle-status/:galleryId",
    adminAuthMiddleware,
    toggleGalleryStatus
);
router.patch(
    "/update-order/:galleryId",
    adminAuthMiddleware,
    updateGalleryOrder
);
router.delete("/delete/:galleryId", adminAuthMiddleware, deleteGalleryItem);

export default router;

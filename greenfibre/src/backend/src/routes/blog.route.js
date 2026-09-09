import express from "express";
import {
    createBlog,
    deleteBlog,
    getAllBlogs,
    getAllBlogsAdmin,
    getSingleBlog,
    togglePublishStatus,
    updateBlog,
} from "../controllers/blog.controller.js";
import { adminAuthMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/", getAllBlogs);
router.get("/admin", adminAuthMiddleware, getAllBlogsAdmin);
router.get("/:slug", getSingleBlog);

router.post(
    "/create",
    adminAuthMiddleware,
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "images", maxCount: 10 },
    ]),
    createBlog
);
router.put(
    "/update/:blogId",
    adminAuthMiddleware,
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "images", maxCount: 10 },
    ]),
    updateBlog
);
router.delete("/delete/:blogId", adminAuthMiddleware, deleteBlog);
router.patch(
    "/toggle-status/:blogId",
    adminAuthMiddleware,
    togglePublishStatus
);

export default router;

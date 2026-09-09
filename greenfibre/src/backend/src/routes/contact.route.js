import express from "express";
import {
    submitContact,
    getAllContacts,
    toggleContactStatus,
    deleteContact,
} from "../controllers/contact.controller.js";
import {
    adminAuthMiddleware,
    optionalAuthMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/contact", optionalAuthMiddleware, submitContact);
router.get("/", adminAuthMiddleware, getAllContacts);
router.patch(
    "/toggle-status/:contactId",
    adminAuthMiddleware,
    toggleContactStatus
);
router.delete("/delete/:contactId", adminAuthMiddleware, deleteContact);

export default router;

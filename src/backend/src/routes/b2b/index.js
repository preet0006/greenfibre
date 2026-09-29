import express from "express";
import b2bAuthRoutes from "./b2bAuth.route.js";
import {
    getB2BProducts,
    getB2BProductDetails,
    calculateB2BQuote,
    getB2BCart,
    addToB2BCart,
    updateB2BCartItem,
    removeB2BCartItem,
    requestB2BQuote,
    getUserB2BQuotes,
    adminGetB2BApplications,
    adminVerifyB2BUser,
    adminUpdateProductB2BTiers,
    adminGetB2BQuotes,
    adminRespondToB2BQuote,
    adminGetDashboardProducts,
    adminGetDashboardProductById,
    adminUpdateDashboardProduct,
    adminCreateDashboardProduct,
    adminDeleteDashboardProduct,
} from "../../controllers/b2b.controller.js";
import {
    authMiddleware,
    optionalAuthMiddleware,
    adminAuthMiddleware,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

// ==========================================
// 1. B2B AUTH & USER MANAGEMENT (from routes/b2b/b2bAuth.route.js)
// ==========================================
router.use("/", b2bAuthRoutes);

// ==========================================
// 2. B2B PRODUCTS & TIER PRICING CALCULATOR
// ==========================================
router.get("/products", optionalAuthMiddleware, getB2BProducts);
router.get("/products/:identifier", optionalAuthMiddleware, getB2BProductDetails);
router.post("/calculate-quote", optionalAuthMiddleware, calculateB2BQuote);

// ==========================================
// 3. B2B CART MANAGEMENT
// ==========================================
router.get("/cart", authMiddleware, getB2BCart);
router.post("/cart/add", authMiddleware, addToB2BCart);
router.put("/cart/update", authMiddleware, updateB2BCartItem);
router.delete("/cart/remove", authMiddleware, removeB2BCartItem);

// ==========================================
// 4. REQUEST FOR QUOTE (RFQ)
// ==========================================
router.post("/quote/request", authMiddleware, requestB2BQuote);
router.get("/quote/my-quotes", authMiddleware, getUserB2BQuotes);

// ==========================================
// 5. ADMIN B2B & B2C DASHBOARD MANAGEMENT
// ==========================================
router.get("/admin/applications", adminAuthMiddleware, adminGetB2BApplications);
router.put("/admin/verify-user/:userId", adminAuthMiddleware, adminVerifyB2BUser);
router.put("/admin/products/:productId/tiers", adminAuthMiddleware, adminUpdateProductB2BTiers);
router.get("/admin/quotes", adminAuthMiddleware, adminGetB2BQuotes);
router.put("/admin/quotes/:quoteId/respond", adminAuthMiddleware, adminRespondToB2BQuote);

// Unified Dashboard Products API (Full CRUD)
router.get("/admin/dashboard/products", adminAuthMiddleware, adminGetDashboardProducts);
router.get("/admin/dashboard/products/:productId", adminAuthMiddleware, adminGetDashboardProductById);
router.put("/admin/dashboard/products/:productId", adminAuthMiddleware, adminUpdateDashboardProduct);
router.post("/admin/dashboard/products", adminAuthMiddleware, adminCreateDashboardProduct);
router.delete("/admin/dashboard/products/:productId", adminAuthMiddleware, adminDeleteDashboardProduct);

export default router;

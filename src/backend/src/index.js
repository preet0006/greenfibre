import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./db/connectDB.js";

import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import contactRoutes from "./routes/contact.route.js";
import blogRoutes from "./routes/blog.route.js";
import galleryRoutes from "./routes/gallery.route.js";
import addressRoutes from "./routes/address.route.js";
import productRoutes from "./routes/product.route.js";
import wishlistRoutes from "./routes/wishlist.route.js";
import bannerRoutes from "./routes/banner.route.js";
import couponRoutes from "./routes/coupon.route.js";
import reviewRoutes from "./routes/review.route.js";
import cartRoutes from "./routes/cart.route.js";
import orderRoutes from "./routes/order.route.js";
import pageSettingsRoutes from "./routes/pageSettings.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import categoryRoutes from "./routes/category.route.js";

dotenv.config({
    path: "./.env",
});

const app = express();
const port = process.env.PORT || 5500;

app.set("trust proxy", 1);

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

const allowedOrigins = [
    process.env.CLIENT_ORIGIN,
    process.env.ADMIN_ORIGIN,
    "http://localhost:3000",
    "http://localhost:3001",
    "https://greenfibre.org",
    "https://www.greenfibre.org",
    "https://admin.greenfibre.org",
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, Postman, curl, server-to-server)
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log("CORS blocked origin:", origin);
                callback(new Error(`CORS not allowed for origin: ${origin}`));
            }
        },
        credentials: true,
    })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "2mb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again later." },
});

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many contact submissions. Please try again later.",
    },
});

const paymentVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many payment verification attempts." },
});

app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/users/verify-otp", authLimiter);
app.use("/api/users/resend-otp", authLimiter);
app.use("/api/users/forgot-password", authLimiter);
app.use("/api/users/reset-password", authLimiter);
app.use("/api/admin/login", authLimiter);
app.use("/api/admin/forgot-password", authLimiter);
app.use("/api/admin/reset-password", authLimiter);
app.use("/api/contact", contactLimiter);
app.use("/api/order/verify", paymentVerifyLimiter);

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/product", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/page-settings", pageSettingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categories", categoryRoutes);

app.get("/api/health", (_req, res) => {
    res.status(200).json({ success: true, message: "OK" });
});

app.use((err, _req, res, _next) => {
    if (err?.message?.startsWith("CORS not allowed")) {
        return res.status(403).json({ message: err.message });
    }
    console.error("Unhandled error:", err);
    return res.status(500).json({ message: "Internal server error" });
});

connectDB()
    .then(() => {
        // Bind to localhost — nginx proxies externally
        app.listen(port, "127.0.0.1", () => {
            console.log(`Server is listening at: http://127.0.0.1:${port}`);
        });
    })
    .catch((err) => {
        console.error(`DB connection error: ${err}`);
    });

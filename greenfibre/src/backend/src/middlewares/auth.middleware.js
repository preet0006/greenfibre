import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const loadUserFromCookieToken = async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    return user;
};

const extractToken = (req, cookieName = "token") => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7).trim();
    }
    return req.cookies?.[cookieName] || req.cookies?.token;
};

// Storefront / customer auth — uses `token` cookie or Bearer header
export const authMiddleware = async (req, res, next) => {
    try {
        const token = extractToken(req, "token");

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized. Please login.",
            });
        }

        const user = await loadUserFromCookieToken(token);
        if (!user) {
            return res.status(401).json({
                message: "User not found. Unauthorized.",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};

// Optional customer auth for public endpoints that can be enhanced when logged in.
export const optionalAuthMiddleware = async (req, _res, next) => {
    try {
        const token = extractToken(req, "token");
        if (!token) {
            return next();
        }

        const user = await loadUserFromCookieToken(token);
        if (user) {
            req.user = user;
        }
    } catch (error) {
        // Ignore auth errors and continue as guest for optional routes.
        console.error("Optional auth middleware error:", error?.message || error);
    }

    return next();
};

// Role check only (assumes req.user already set)
export const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin access only",
        });
    }
    next();
};

/**
 * Admin panel auth — prefers `admin_token` so a storefront customer
 * session on the shared `.greenfibre.org` cookie domain cannot block admin APIs.
 */
export const adminAuthMiddleware = async (req, res, next) => {
    try {
        const token = extractToken(req, "admin_token");

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized. Please login.",
            });
        }

        const user = await loadUserFromCookieToken(token);
        if (!user) {
            return res.status(401).json({
                message: "User not found. Unauthorized.",
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Admin access only",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Admin auth middleware error:", error);
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};

import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const loadUserFromCookieToken = async (token) => {
    if (!token || token === "undefined" || token === "null") return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) return null;
    const user = await User.findById(decoded.id).select("-password");
    return user;
};

const extractToken = (req, cookieName = "token") => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const t = authHeader.slice(7).trim();
        if (t && t !== "undefined" && t !== "null") return t;
    }
    const cookieVal = req.cookies?.[cookieName] || req.cookies?.token;
    if (cookieVal && cookieVal !== "undefined" && cookieVal !== "null") {
        return cookieVal;
    }
    return null;
};

// Storefront / customer auth — uses `token` cookie or Bearer header
export const authMiddleware = async (req, res, next) => {
    try {
        const token = extractToken(req, "token");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login.",
            });
        }

        const user = await loadUserFromCookieToken(token);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found. Unauthorized.",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please login again.",
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
/**
 * Constant-time string comparison that fails closed if either input is empty,
 * whitespace-only, missing, non-string, or malformed.
 */
function safeSecretCompare(provided, expected) {
    if (typeof provided !== "string" || typeof expected !== "string") {
        return false;
    }
    const cleanProvided = provided.trim();
    const cleanExpected = expected.trim();
    if (!cleanProvided || !cleanExpected) {
        return false;
    }
    const bufProvided = Buffer.from(cleanProvided, "utf8");
    const bufExpected = Buffer.from(cleanExpected, "utf8");
    if (bufProvided.length !== bufExpected.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufProvided, bufExpected);
}

export const adminAuthMiddleware = async (req, res, next) => {
    try {
        const rawServiceName = req.headers["x-internal-service"];
        const rawServiceKey = req.headers["x-internal-service-key"];
        const serviceName = typeof rawServiceName === "string" ? rawServiceName.trim() : "";
        const serviceKey = typeof rawServiceKey === "string" ? rawServiceKey.trim() : "";
        const configuredSecret = typeof process.env.INTERNAL_SERVICE_SECRET === "string"
            ? process.env.INTERNAL_SERVICE_SECRET.trim()
            : "";

        // 1. If ANY internal service header is presented, enforce strict fail-closed verification
        if (rawServiceName !== undefined || rawServiceKey !== undefined) {
            // Fail closed: require non-empty configured secret, non-empty supplied key, exact service name, and constant-time match
            if (
                serviceName === "greenfibre-dashboard" &&
                configuredSecret &&
                serviceKey &&
                safeSecretCompare(serviceKey, configuredSecret)
            ) {
                // Verified server-to-server request from trusted dashboard gateway
                const forwardedUserId = req.headers["x-authenticated-user-id"];
                const forwardedUserRole = req.headers["x-authenticated-user-role"];
                const forwardedUserEmail = req.headers["x-authenticated-user-email"];

                // Verify user role privileges if forwarded from dashboard gateway
                const normalizedRole = String(forwardedUserRole || "admin").trim().toLowerCase();
                if (normalizedRole !== "admin" && normalizedRole !== "manager" && normalizedRole !== "super_admin") {
                    return res.status(403).json({
                        success: false,
                        message: "Forbidden: forwarded user does not have shipping administration privileges.",
                    });
                }

                req.user = {
                    _id: String(forwardedUserId || "dashboard-internal-service").trim(),
                    id: String(forwardedUserId || "dashboard-internal-service").trim(),
                    role: normalizedRole,
                    email: String(forwardedUserEmail || "dashboard-service@greenfibre.internal").trim(),
                    isServiceAuth: true,
                };
                return next();
            }

            // Reject missing, blank, whitespace-only, malformed, or invalid service credentials (FAIL CLOSED)
            return res.status(401).json({
                success: false,
                message: "Unauthorized: invalid, missing, or unauthorized internal service credentials.",
            });
        }

        const token = extractToken(req, "admin_token");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login.",
            });
        }

        const user = await loadUserFromCookieToken(token);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found. Unauthorized.",
            });
        }

        if (user.role !== "admin" && user.role !== "manager" && user.role !== "super_admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access only",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please login again.",
        });
    }
};


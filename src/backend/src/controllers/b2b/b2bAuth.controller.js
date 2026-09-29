import { User } from "../../models/user.model.js";
import {
    authCookieOptions,
    USER_TOKEN_COOKIE,
} from "../../utils/cookieAuth.js";
import jwt from "jsonwebtoken";

// ============================================================================
// B2B USER RESPONSE FORMATTER
// ============================================================================
export const formatB2BUserResponse = (user) => {
    const isVerified = Boolean(
        user.isB2BVerified ||
        user.role === "b2b_verified" ||
        user.b2bProfile?.verificationStatus === "verified"
    );

    const effectiveRole = user.role && user.role !== "user"
        ? user.role
        : isVerified ? "b2b_verified" : "b2b_buyer";

    const company = user.companyName || user.b2bProfile?.companyName || "";
    const gstin = user.gstin || user.b2bProfile?.gstin || "";
    const bType = user.businessType || user.b2bProfile?.businessType || "Corporate Gifting & HR";

    return {
        id: user._id.toString(),
        fullName: user.fullName || user.full_name,
        full_name: user.full_name,
        companyName: company,
        email: user.email,
        phone: user.phone || "",
        businessType: bType,
        gstin: gstin,
        role: effectiveRole,
        isB2BVerified: isVerified,
        accountType: "B2B",
        b2bProfile: user.b2bProfile || {
            companyName: company,
            gstin: gstin,
            businessType: bType,
            verificationStatus: isVerified ? "verified" : "pending",
        },
        billingAddress: user.billingAddress || {},
        createdAt: user.createdAt,
    };
};

// ============================================================================
// 1. REGISTER B2B ENTERPRISE ACCOUNT (Corporate Sign Up)
// ============================================================================
export const registerB2BUser = async (req, res) => {
    try {
        const {
            fullName,
            full_name,
            companyName,
            email,
            phone,
            businessType,
            gstin,
            password,
            billingAddress,
            rememberMe,
        } = req.body;

        const name = (fullName || full_name || "").trim();
        const company = (companyName || "").trim();
        const rawEmail = (email || "").trim();

        if (!name || !company || !rawEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, company name, email and password are required",
            });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const normalizedEmail = rawEmail.toLowerCase();
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
        if (!emailOk) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this work email already exists",
            });
        }

        const user = await User.create({
            full_name: name,
            companyName: company,
            email: normalizedEmail,
            password,
            phone: phone ? String(phone).trim() : "",
            businessType: businessType || "Corporate Gifting & HR",
            gstin: gstin ? String(gstin).toUpperCase().trim() : "",
            role: "b2b_buyer",
            accountType: "B2B",
            isVerified: true, // Enterprise accounts active immediately
            isB2BVerified: false,
            billingAddress: billingAddress || {},
            b2bProfile: {
                companyName: company,
                gstin: gstin ? String(gstin).toUpperCase().trim() : "",
                businessType: businessType || "Corporate Gifting & HR",
                verificationStatus: "pending",
                appliedAt: new Date(),
            },
        });

        // Token Expiration: at least 24 hours (default 7 days, 30 days if rememberMe)
        const tokenExpiry = rememberMe ? "30d" : "7d";
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                isB2BVerified: user.isB2BVerified,
                accountType: "B2B",
            },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        res.cookie(USER_TOKEN_COOKIE, token, {
            ...authCookieOptions,
            maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({
            success: true,
            message: "Enterprise account created successfully",
            token,
            user: formatB2BUserResponse(user),
        });
    } catch (error) {
        console.error("registerB2BUser error:", error);
        return res.status(500).json({
            success: false,
            message: `Error creating B2B account: ${error.message}`,
        });
    }
};

// ============================================================================
// 2. SIGN IN B2B ENTERPRISE ACCOUNT (Corporate Sign In)
// ============================================================================
export const loginB2BUser = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isMatch = user.matchPassword
            ? await user.matchPassword(password)
            : await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Auto mark as active if not yet verified
        if (!user.isVerified) {
            user.isVerified = true;
            await user.save();
        }

        // Token Expiration: at least 24 hours (default 7 days, 30 days if rememberMe)
        const tokenExpiry = rememberMe ? "30d" : "7d";
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role || "b2b_buyer",
                isB2BVerified: Boolean(user.isB2BVerified || user.role === "b2b_verified" || user.b2bProfile?.verificationStatus === "verified"),
                accountType: user.accountType || "B2B",
            },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        res.cookie(USER_TOKEN_COOKIE, token, {
            ...authCookieOptions,
            maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Sign in successful",
            token,
            user: formatB2BUserResponse(user),
        });
    } catch (error) {
        console.error("loginB2BUser error:", error);
        return res.status(500).json({
            success: false,
            message: "Error during B2B login",
        });
    }
};

// ============================================================================
// 3. GET CURRENT B2B PROFILE (GET /api/b2b/me)
// ============================================================================
export const getB2BProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            user: formatB2BUserResponse(user),
        });
    } catch (error) {
        console.error("getB2BProfile error:", error);
        return res.status(500).json({ success: false, message: "Error fetching profile" });
    }
};

// ============================================================================
// 4. AUTO-REFRESH B2B TOKEN (POST /api/b2b/refresh-token)
// ============================================================================
export const refreshB2BToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        let existingToken = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            existingToken = authHeader.slice(7).trim();
        } else if (req.cookies?.[USER_TOKEN_COOKIE]) {
            existingToken = req.cookies[USER_TOKEN_COOKIE];
        } else if (req.body?.token || req.body?.refreshToken) {
            existingToken = req.body.token || req.body.refreshToken;
        }

        if (!existingToken) {
            return res.status(401).json({
                success: false,
                message: "No active token provided for refresh",
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(existingToken, process.env.JWT_SECRET);
        } catch (err) {
            decoded = jwt.decode(existingToken);
            if (!decoded || !decoded.id) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired token. Please login again.",
                });
            }
        }

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found",
            });
        }

        const newToken = jwt.sign(
            {
                id: user._id,
                role: user.role || "b2b_buyer",
                isB2BVerified: Boolean(user.isB2BVerified || user.role === "b2b_verified" || user.b2bProfile?.verificationStatus === "verified"),
                accountType: user.accountType || "B2B",
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie(USER_TOKEN_COOKIE, newToken, authCookieOptions);

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            token: newToken,
            user: formatB2BUserResponse(user),
        });
    } catch (error) {
        console.error("refreshB2BToken error:", error);
        return res.status(500).json({
            success: false,
            message: "Error refreshing token",
        });
    }
};

// ============================================================================
// 5. UPDATE B2B BUSINESS PROFILE
// ============================================================================
export const updateB2BProfile = async (req, res) => {
    try {
        const {
            companyName,
            gstin,
            panNumber,
            businessType,
            phone,
            tradeLicenseDoc,
            gstCertificateDoc,
            billingAddress,
        } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (phone) user.phone = String(phone).trim();
        if (billingAddress) user.billingAddress = { ...user.billingAddress, ...billingAddress };
        if (!user.b2bProfile) user.b2bProfile = {};

        if (companyName) {
            user.companyName = companyName.trim();
            user.b2bProfile.companyName = companyName.trim();
        }
        if (gstin) {
            user.gstin = gstin.toUpperCase().trim();
            user.b2bProfile.gstin = gstin.toUpperCase().trim();
        }
        if (panNumber) user.b2bProfile.panNumber = panNumber.toUpperCase().trim();
        if (businessType) {
            user.businessType = businessType;
            user.b2bProfile.businessType = businessType;
        }
        if (tradeLicenseDoc) user.b2bProfile.tradeLicenseDoc = tradeLicenseDoc;
        if (gstCertificateDoc) user.b2bProfile.gstCertificateDoc = gstCertificateDoc;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "B2B business profile updated successfully.",
            user: formatB2BUserResponse(user),
        });
    } catch (error) {
        console.error("updateB2BProfile error:", error);
        return res.status(500).json({
            success: false,
            message: `Error updating B2B profile: ${error.message}`,
        });
    }
};

import { OTP } from "../models/otp.model.js";
import { User } from "../models/user.model.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { getImgproxyUrl } from "../utils/imgproxy.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendMail } from "../utils/sendMail.js";
import { baseEmailTemplate } from "../utils/emailTemplate.js";
import {
    authCookieOptions,
    clearAuthCookieOptions,
    USER_TOKEN_COOKIE,
    ADMIN_TOKEN_COOKIE,
} from "../utils/cookieAuth.js";
import jwt from "jsonwebtoken";

// Helper to format B2C and B2B user profiles distinctly
export const formatUserResponse = (user) => {
    const isB2B = Boolean(
        user.accountType === "B2B" ||
        user.role === "b2b_buyer" ||
        user.role === "b2b_verified" ||
        user.companyName ||
        user.b2bProfile?.companyName
    );

    // 1. B2C Retail Customer Profile
    if (!isB2B) {
        return {
            id: user._id.toString(),
            full_name: user.full_name,
            fullName: user.full_name,
            email: user.email,
            phone: user.phone || "",
            role: user.role || "user",
            accountType: "B2C",
            isVerified: Boolean(user.isVerified),
            profile_image: user.profile_image || null,
            createdAt: user.createdAt,
        };
    }

    // 2. B2B Enterprise Wholesale Customer Profile
    const isB2BVerified = Boolean(
        user.isB2BVerified ||
        user.role === "b2b_verified" ||
        user.b2bProfile?.verificationStatus === "verified"
    );

    const effectiveRole = user.role && user.role !== "user"
        ? user.role
        : isB2BVerified ? "b2b_verified" : "b2b_buyer";

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
        isB2BVerified: isB2BVerified,
        accountType: "B2B",
        b2bProfile: user.b2bProfile || {
            companyName: company,
            gstin: gstin,
            businessType: bType,
            verificationStatus: isB2BVerified ? "verified" : "pending",
        },
        billingAddress: user.billingAddress || {},
        createdAt: user.createdAt,
    };
};


// =============================
// REGISTER USER CONTROLLER (B2B Enterprise & Standard Retail)
// =============================
export const registerUser = async (req, res) => {
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
        const rawEmail = (email || "").trim();
        const company = (companyName || "").trim();

        // Check if B2B enterprise registration
        const isB2B = Boolean(
            company ||
            businessType ||
            gstin ||
            req.body.role === "b2b_buyer" ||
            req.body.accountType === "B2B" ||
            fullName // Field name from B2B form spec
        );

        if (isB2B) {
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

            // Minimum 24h token validity (default 7d, 30d if rememberMe)
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
                user: formatUserResponse(user),
            });
        }

        // Standard Retail / B2C Flow
        if (!name || !rawEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, email and password are required",
            });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const normalizedEmail = rawEmail.toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User is already registered with this email",
            });
        }

        const user = await User.create({
            full_name: name,
            email: normalizedEmail,
            password,
            phone: phone || undefined,
            role: "user",
            accountType: "B2C",
        });

        // Generate OTP
        const { otp, expiry } = generateOtp();
        await OTP.create({
            userId: user._id,
            otp: otp.toString(),
            purpose: "email_verification",
            expiresAt: expiry,
            attempts: 0,
        });

        // Send verification mail
        await sendMail(
            normalizedEmail,
            "Verify Your Email - Greenfibre",
            baseEmailTemplate({
                title: "Verify Your Email",
                subtitle: "Welcome to Greenfibre",
                body: `
      <p>Hi <b>${name}</b>,</p>
      <p>Welcome to <b>Greenfibre</b> — your destination for eco-friendly products.</p>
      <p>Please use the verification code below to activate your account.</p>
    `,
                highlight: otp,
                footerNote: `
      <p style="font-size:13px;">
        This code is valid for <b>5 minutes</b>. Do not share it with anyone.
      </p>
    `,
            })
        );

        return res.status(200).json({
            success: true,
            message: "User registered successfully. Please verify your email.",
        });
    } catch (error) {
        console.error("registerUser", error);
        if (error?.name === "ValidationError") {
            const first = Object.values(error.errors || {})[0];
            return res.status(400).json({
                success: false,
                message: first?.message || "Invalid registration data",
            });
        }
        return res
            .status(500)
            .json({ success: false, message: `Error during registration: ${error.message}` });
    }
};

// =============================
// VERIFY OTP CONTROLLER
// =============================
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(400).json({ message: "User not found" });

        if (user.isVerified) {
            return res.status(400).json({
                message: "Email is already verified. Please sign in.",
                code: "ALREADY_VERIFIED",
            });
        }

        const record = await OTP.findOne({
            userId: user._id,
            purpose: "email_verification",
        });

        if (!record) {
            return res.status(400).json({
                message: "No OTP found. Please request a new code.",
                code: "OTP_MISSING",
            });
        }

        if (record.expiresAt < new Date()) {
            await OTP.deleteMany({
                userId: user._id,
                purpose: "email_verification",
            });
            return res.status(400).json({
                message: "OTP expired. Please request a new code.",
                code: "OTP_EXPIRED",
            });
        }

        if (record.attempts >= (record.maxAttempts || 5)) {
            await OTP.deleteMany({
                userId: user._id,
                purpose: "email_verification",
            });
            return res.status(400).json({
                message:
                    "Maximum OTP attempts reached. Please request a new code.",
                code: "OTP_MAX_ATTEMPTS",
            });
        }

        const isMatch = await record.compareOtp(String(otp).trim());
        if (!isMatch) {
            record.attempts = (record.attempts || 0) + 1;
            await record.save();
            const remaining =
                (record.maxAttempts || 5) - record.attempts;
            return res.status(400).json({
                message:
                    remaining > 0
                        ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
                        : "Maximum OTP attempts reached. Please request a new code.",
                code: "OTP_INVALID",
                attemptsRemaining: Math.max(0, remaining),
            });
        }

        user.isVerified = true;
        await user.save();

        await OTP.deleteMany({
            userId: user._id,
            purpose: "email_verification",
        });

        // Generate Token (minimum 24h validity, default 7d)
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                isB2BVerified: user.isB2BVerified,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie(USER_TOKEN_COOKIE, token, authCookieOptions);

        return res.status(200).json({
            success: true,
            message: "Email verified successfully, logged in.",
            token,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.log("verifyOTP", error);
        res.status(500).json({
            message: "Error while verify OTP",
        });
    }
};

// =============================
// LOGOUT USER CONTROLLER
// =============================
export const logoutUser = async (req, res) => {
    res.clearCookie(USER_TOKEN_COOKIE, clearAuthCookieOptions);
    res.json({
        success: true,
        message: "Logged Out Successfully",
    });
};

export const logoutAdmin = async (req, res) => {
    res.clearCookie(ADMIN_TOKEN_COOKIE, clearAuthCookieOptions);
    // Also clear legacy shared cookie if present
    res.clearCookie(USER_TOKEN_COOKIE, clearAuthCookieOptions);
    res.json({
        success: true,
        message: "Logged Out Successfully",
    });
};

// =============================
// LOGIN USER CONTROLLER (B2B & B2C)
// =============================
export const loginUser = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // Check for missing fields
        if (!email?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required",
            });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select(
            "+password"
        );
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Compare password (supporting both matchPassword & comparePassword)
        const isMatch = user.matchPassword
            ? await user.matchPassword(password)
            : await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // B2B enterprise users or accounts with company profile are automatically activated
        if (!user.isVerified) {
            if (user.accountType === "B2B" || user.companyName || user.role === "b2b_buyer" || user.role === "b2b_verified") {
                user.isVerified = true;
                await user.save();
            } else {
                return res.status(403).json({
                    success: false,
                    message: "Please verify your email before logging in.",
                    code: "EMAIL_NOT_VERIFIED",
                    email: user.email,
                });
            }
        }

        // Token lifetime: at least 24 hours (default 7d = 168h, 30d if rememberMe)
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

        // Set token in HTTP-only cookie
        res.cookie(USER_TOKEN_COOKIE, token, {
            ...authCookieOptions,
            maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Sign in successful",
            token,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error("Error while login", error);
        return res.status(500).json({
            success: false,
            message: "Error while logging in",
        });
    }
};

// =============================
// AUTO-REFRESH TOKEN CONTROLLER
// Keeps sessions active indefinitely for active users
// =============================
export const refreshToken = async (req, res) => {
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
            // Allow refresh for expired tokens within safe 30-day grace window
            decoded = jwt.decode(existingToken);
            if (!decoded || !decoded.id) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired session. Please login again.",
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

        // Issue renewed token for at least 24h (7 days default)
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
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error("refreshToken error:", error);
        return res.status(500).json({
            success: false,
            message: "Error refreshing token",
        });
    }
};


// =============================
// LOGIN ADMIN CONTROLLER
// =============================
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and Password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
            "+password"
        );
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Admin access only. This account is not an admin.",
            });
        }

        if (!user.isVerified) {
            return res.status(400).json({
                message: "Please verify your email before logging in",
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.cookie(ADMIN_TOKEN_COOKIE, token, authCookieOptions);

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            user: {
                id: user._id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                profile_image: user.profile_image || null,
            },
        });
    } catch (error) {
        console.error("Error while admin login", error);
        return res.status(500).json({
            message: "Error while logging in",
        });
    }
};

// =============================
// GET USER PROFILE CONTROLLER
// =============================
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            user: formatUserResponse(user),
        });
    } catch (error) {
        console.error("Error while gettingProfile", error);
        return res
            .status(500)
            .json({ success: false, message: "Error while fetching profile" || error.message });
    }
};


// =============================
// UPDATE USER PROFILE CONTROLLER
// =============================

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { full_name, phone } = req.body;

        let updatedData = {
            full_name,
            phone,
        };

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Handle profile image

        if (req.file) {
            if (user.profile_image) {
                await deleteFromCloudinary(user.profile_image);
            }

            // upload new image
            const uploadUrl = await uploadOnCloudinary(
                req.file.path,
                "profile"
            );

            if (uploadUrl) {
                updatedData.profile_image = uploadUrl;
            }
        }

        // update user in db
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
            new: true,
            runValidators: true,
        }).select("-password");

        // Transform response with optimized profile image
        const userResponse = updatedUser.toObject();

        if (userResponse.profile_image) {
            userResponse.profile_image = {
                original: updatedUser.profile_image,
                large: updatedUser.profile_image,
                thumbnail: updatedUser.profile_image,
            };
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: userResponse,
        });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({
            message: "Server error while updating profile" || error.message,
        });
    }
};

// =============================
// DELETE USER PROFILE CONTROLLER
// =============================

export const deleteUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User Not Found" });

        // Delete profile image
        if (user.profile_image) {
            await deleteFromCloudinary(user.profile_image);
        }

        //Delete the user itself
        await User.findByIdAndDelete(userId);

        // clear cookie
        res.clearCookie(USER_TOKEN_COOKIE, clearAuthCookieOptions);

        return res.status(200).json({
            success: true,
            message: "Account Deleted Successfully",
        });
    } catch (error) {
        console.error("Delete account error:", error);
        return res.status(500).json({
            message: "Server error while deleting account." || error.message,
        });
    }
};

// =============================
// RESEND OTP CONTROLLER
// =============================
export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isVerified)
            return res
                .status(400)
                .json({ message: "User is already verified" });

        // Delete old OTPs
        await OTP.deleteMany({
            userId: user._id,
            purpose: "email_verification",
        });

        // Generate new OTP
        const { otp, expiry } = generateOtp();
        await OTP.create({
            userId: user._id,
            otp: otp.toString(),
            purpose: "email_verification",
            expiresAt: expiry,
            attempts: 0,
        });

        // Send Email
        await sendMail(
            email,
            "Your New Verification Code – Greenfibre",
            baseEmailTemplate({
                title: "New Verification Code",
                subtitle: "Account Verification",
                body: `
      <p>You requested a new verification code for your Greenfibre account.</p>
      <p>Please use the code below to continue.</p>
    `,
                highlight: otp,
                footerNote: `
      <p style="font-size:13px;">
        This code is valid for <b>5 minutes</b>. If you didn't request this, you can safely ignore this email.
      </p>
    `,
            })
        );

        return res.status(200).json({
            success: true,
            message: "OTP resent successfully. Please check your email.",
        });
    } catch (error) {
        console.error("resendOtp", error);
        return res.status(500).json({
            message: "Error while resending OTP" || error.message,
        });
    }
};

// =============================
// FORGOT PASSWORD CONTROLLER
// =============================
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: "Email is required" });

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        // Always return 200 to avoid leaking whether the account exists,
        // and to avoid browsers logging a "404 Not Found" as a missing route.
        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    "If an account exists for this email, a password reset OTP has been sent.",
            });
        }

        // Delete old OTPs for password reset
        await OTP.deleteMany({ userId: user._id, purpose: "password_reset" });

        // Generate new OTP
        const { otp, expiry } = generateOtp();
        await OTP.create({
            userId: user._id,
            otp: otp.toString(),
            purpose: "password_reset",
            expiresAt: expiry,
        });

        // Send reset OTP email
        await sendMail(
            normalizedEmail,
            "Reset Your Password – Greenfibre",
            baseEmailTemplate({
                title: "Password Reset Request",
                subtitle: "Account Security",
                body: `
      <p>We received a request to reset your Greenfibre account password.</p>
      <p>Use the code below to proceed securely.</p>
    `,
                highlight: otp,
                footerNote: `
      <p style="font-size:13px;">
        This code will expire in <b>5 minutes</b>. If this wasn't you, ignore this email.
      </p>
    `,
            })
        );

        return res.status(200).json({
            success: true,
            message: "Password reset OTP sent successfully to your email.",
        });
    } catch (error) {
        console.error("forgotPassword", error);
        return res.status(500).json({
            message: "Error while sending reset OTP" || error.message,
        });
    }
};

// =============================
// RESET PASSWORD CONTROLLER (supports JWT Reset Token or OTP)
// =============================
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, password, token, newPassword } = req.body;
        const targetPassword = newPassword || password;

        if (!targetPassword) {
            return res.status(400).json({
                success: false,
                message: "New password is required",
            });
        }

        if (typeof targetPassword !== "string" || targetPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        // Case 1: Reset using JWT Token
        if (token) {
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired password reset token",
                });
            }

            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User account not found",
                });
            }

            user.password = targetPassword;
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Password reset successfully.",
            });
        }

        // Case 2: Reset using Email + OTP
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP or reset token are required",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email",
            });
        }

        const record = await OTP.findOne({
            userId: user._id,
            purpose: "password_reset",
        });

        if (!record) return res.status(400).json({ success: false, message: "No OTP found" });
        if (record.expiresAt < new Date())
            return res.status(400).json({ success: false, message: "OTP expired" });

        const isMatch = await record.compareOtp(otp);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid OTP" });

        // Hash and update password
        user.password = targetPassword;
        await user.save();

        // Delete all password_reset OTPs
        await OTP.deleteMany({
            userId: user._id,
            purpose: "password_reset",
        });

        // Send confirmation mail
        await sendMail(
            user.email,
            "Password Updated – Greenfibre",
            baseEmailTemplate({
                title: "Password Updated Successfully",
                subtitle: "Security Confirmation",
                body: `
      <p>Your password has been successfully updated.</p>
      <p>If this action wasn't performed by you, please contact support immediately.</p>
    `,
                footerNote: `
      <div style="margin-top:16px;font-size:13px;">
        Never share your login credentials with anyone.
      </div>
    `,
            })
        );

        return res.status(200).json({
            success: true,
            message: "Password reset successfully.",
        });
    } catch (error) {
        console.error("resetPassword", error);
        return res.status(500).json({
            success: false,
            message: "Error while resetting password: " + (error.message || error),
        });
    }
};


// =============================
// UPDATE PASSWORD (Authenticated User)
// =============================
export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword)
            return res.status(400).json({
                message: "Both current and new passwords are required",
            });

        const user = await User.findById(req.user._id).select("+password");
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch)
            return res
                .status(400)
                .json({ message: "Current password is incorrect" });

        user.password = newPassword;
        await user.save();

        await sendMail(
            user.email,
            "Password Changed Successfully – Greenfibre",
            baseEmailTemplate({
                title: "Password Updated",
                subtitle: "Security Confirmation",
                body: `
      <p>Your password has been updated successfully.</p>
      <p>If this was not you, please contact support immediately.</p>
    `,
                footerNote: `
      <div style="margin-top:16px;padding:12px;border-radius:8px;font-size:13px;">
        Keep your account secure. Never share your password.
      </div>
    `,
            })
        );

        return res.status(200).json({
            success: true,
            message: "Password updated successfully.",
        });
    } catch (error) {
        console.error("updatePassword", error);
        return res.status(500).json({
            message: "Error while updating password" || error.message,
        });
    }
};

// =============================
// (Admin) LIST ALL USER
// =============================

export const listUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users found." });
        }

        // Transform users with optimized profile images
        const usersWithPublicUrls = users.map((user) => {
            const userObj = user.toObject();

           if (userObj.profile_image) {
               userObj.profile_image = {
                   original: user.profile_image,
                   thumbnail: user.profile_image,
               };
           }

            return userObj;
        });

        return res.status(200).json({
            success: true,
            count: usersWithPublicUrls.length,
            users: usersWithPublicUrls,
        });
    } catch (error) {
        console.error("list user", error);
        return res
            .status(500)
            .json({ message: "Error while fetching users" || error.message });
    }
};

// =============================
// (Admin) Delete USER
// =============================

export const deleteUserByAdmin = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user._id.toString() === req.user?._id.toString()) {
            return res
                .status(400)
                .json({ message: "You cannot delete your own account" });
        }

        // delete user profile image
        if (user.profile_image) {
            await deleteFromCloudinary(user.profile_image);
        }

        // delete user itself
        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: "User and all related information deleted successfully",
        });
    } catch (error) {
        console.error("delete user by admin", error);
        return res.status(500).json({
            message: "Error while deleting the user" || error.message,
        });
    }
};

// =============================
// (Admin) CREATE ADMIN
// =============================
export const createAdminByAdmin = async (req, res) => {
    try {
        const { full_name, email } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({
                message: "Full name and email are required",
            });
        }

        // Ensure requester is admin
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Only admins can create another admin",
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists with this email",
            });
        }

        // Generate random password (8 chars)
        const password = Math.random().toString(36).slice(-8);

        // Create admin
        const admin = await User.create({
            full_name,
            email,
            password,
            role: "admin",
            isVerified: true, // internal admin → auto verified
        });

        // Send credentials via email
        await sendMail(
            email,
            "Admin Access Granted – Greenfibre",
            baseEmailTemplate({
                title: "Admin Account Created",
                subtitle: "Greenfibre Admin Panel",
                body: `
      <p>You have been granted <b>Admin access</b> to Greenfibre.</p>
      <p>Use the credentials below to log in.</p>
    `,
                highlight: `
      Email: ${email}<br/>
      Password: ${password}
    `,
                footerNote: `
      <p style="font-size:13px;">
        Please change your password immediately after logging in.
      </p>
    `,
            })
        );

        return res.status(200).json({
            success: true,
            message: "Admin created successfully and credentials emailed",
            admin: {
                id: admin._id,
                full_name: admin.full_name,
                email: admin.email,
            },
        });
    } catch (error) {
        console.error("createAdminByAdmin", error);
        return res.status(500).json({
            message: "Error while creating admin" || error.message,
        });
    }
};

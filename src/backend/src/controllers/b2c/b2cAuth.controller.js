import { OTP } from "../../models/otp.model.js";
import { User } from "../../models/user.model.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../../utils/cloudinary.js";
import { generateOtp } from "../../utils/generateOtp.js";
import { sendMail } from "../../utils/sendMail.js";
import { baseEmailTemplate } from "../../utils/emailTemplate.js";
import {
    authCookieOptions,
    clearAuthCookieOptions,
    USER_TOKEN_COOKIE,
    ADMIN_TOKEN_COOKIE,
} from "../../utils/cookieAuth.js";
import jwt from "jsonwebtoken";

// ============================================================================
// B2C USER RESPONSE FORMATTER
// ============================================================================
export const formatB2CUserResponse = (user) => {
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
};

// ============================================================================
// 1. REGISTER B2C CONSUMER (With 6-digit Email OTP Verification)
// ============================================================================
export const registerB2CUser = async (req, res) => {
    try {
        const { full_name, fullName, email, phone, password } = req.body;
        const name = (full_name || fullName || "").trim();
        const rawEmail = (email || "").trim();

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
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
        if (!emailOk) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        if (phone && !/^\d{10}$/.test(String(phone).trim())) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 10-digit phone number",
            });
        }

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
            phone: phone ? String(phone).trim() : undefined,
            role: "user",
            accountType: "B2C",
            isVerified: false, // Must verify via OTP
        });

        // Generate 6-digit OTP
        const { otp, expiry } = generateOtp();
        await OTP.create({
            userId: user._id,
            otp: otp.toString(),
            purpose: "email_verification",
            expiresAt: expiry,
            attempts: 0,
        });

        // Send verification email (handled gracefully if SMTP is down)
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
        console.error("registerB2CUser error:", error);
        if (error?.name === "ValidationError") {
            const first = Object.values(error.errors || {})[0];
            return res.status(400).json({
                success: false,
                message: first?.message || "Invalid registration data",
            });
        }
        return res.status(500).json({
            success: false,
            message: `Error during registration: ${error.message}`,
        });
    }
};

// ============================================================================
// 2. VERIFY B2C EMAIL OTP
// ============================================================================
export const verifyB2COtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required",
            });
        }

        const user = await User.findOne({ email: String(email).toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
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
                success: false,
                message: "No OTP found. Please request a new code.",
                code: "OTP_MISSING",
            });
        }

        if (record.expiresAt < new Date()) {
            await OTP.deleteMany({ userId: user._id, purpose: "email_verification" });
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new code.",
                code: "OTP_EXPIRED",
            });
        }

        if (record.attempts >= (record.maxAttempts || 5)) {
            await OTP.deleteMany({ userId: user._id, purpose: "email_verification" });
            return res.status(400).json({
                success: false,
                message: "Maximum OTP attempts reached. Please request a new code.",
                code: "OTP_MAX_ATTEMPTS",
            });
        }

        const isMatch = await record.compareOtp(String(otp).trim());
        if (!isMatch) {
            record.attempts = (record.attempts || 0) + 1;
            await record.save();
            const remaining = (record.maxAttempts || 5) - record.attempts;
            return res.status(400).json({
                success: false,
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

        await OTP.deleteMany({ userId: user._id, purpose: "email_verification" });

        const token = jwt.sign(
            { id: user._id, role: user.role, accountType: "B2C" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie(USER_TOKEN_COOKIE, token, authCookieOptions);

        return res.status(200).json({
            success: true,
            message: "Email verified successfully, logged in.",
            token,
            user: formatB2CUserResponse(user),
        });
    } catch (error) {
        console.error("verifyB2COtp error:", error);
        return res.status(500).json({
            success: false,
            message: "Error while verifying OTP",
        });
    }
};

// ============================================================================
// 3. RESEND B2C EMAIL OTP
// ============================================================================
export const resendB2COtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const user = await User.findOne({ email: String(email).toLowerCase().trim() });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.isVerified) {
            return res.status(400).json({ success: false, message: "User is already verified" });
        }

        await OTP.deleteMany({ userId: user._id, purpose: "email_verification" });

        const { otp, expiry } = generateOtp();
        await OTP.create({
            userId: user._id,
            otp: otp.toString(),
            purpose: "email_verification",
            expiresAt: expiry,
            attempts: 0,
        });

        await sendMail(
            user.email,
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
        This code is valid for <b>5 minutes</b>.
      </p>
    `,
            })
        );

        return res.status(200).json({
            success: true,
            message: "OTP resent successfully. Please check your email.",
        });
    } catch (error) {
        console.error("resendB2COtp error:", error);
        return res.status(500).json({
            success: false,
            message: "Error while resending OTP",
        });
    }
};

// ============================================================================
// 4. SIGN IN B2C CONSUMER (Checks Email OTP Verification)
// ============================================================================
export const loginB2CUser = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required",
            });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
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

        // B2C accounts must be email-verified
        if (!user.isVerified && user.accountType !== "B2B" && !user.companyName) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in.",
                code: "EMAIL_NOT_VERIFIED",
                email: user.email,
            });
        }

        const tokenExpiry = rememberMe ? "30d" : "7d";
        const token = jwt.sign(
            { id: user._id, role: user.role || "user", accountType: "B2C" },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        res.cookie(USER_TOKEN_COOKIE, token, {
            ...authCookieOptions,
            maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            user: formatB2CUserResponse(user),
        });
    } catch (error) {
        console.error("loginB2CUser error:", error);
        return res.status(500).json({
            success: false,
            message: "Error while logging in",
        });
    }
};

// ============================================================================
// 5. GET B2C USER PROFILE
// ============================================================================
export const getB2CUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            user: formatB2CUserResponse(user),
        });
    } catch (error) {
        console.error("getB2CUserProfile error:", error);
        return res.status(500).json({
            success: false,
            message: "Error while fetching profile",
        });
    }
};

// ============================================================================
// 6. UPDATE B2C USER PROFILE
// ============================================================================
export const updateB2CUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { full_name, fullName, phone } = req.body;
        const name = full_name || fullName;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (name) user.full_name = name.trim();
        if (phone) user.phone = String(phone).trim();

        if (req.file) {
            if (user.profile_image) {
                await deleteFromCloudinary(user.profile_image);
            }
            const uploadUrl = await uploadOnCloudinary(req.file.path, "profile");
            if (uploadUrl) user.profile_image = uploadUrl;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: formatB2CUserResponse(user),
        });
    } catch (error) {
        console.error("updateB2CUserProfile error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while updating profile",
        });
    }
};

// ============================================================================
// 7. B2C FORGOT & RESET PASSWORD
// ============================================================================
export const forgotB2CPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email is required" });

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If an account exists for this email, a password reset OTP has been sent.",
            });
        }

        await OTP.deleteMany({ userId: user._id, purpose: "password_reset" });

        const { otp, expiry } = generateOtp();
        await OTP.create({
            userId: user._id,
            otp: otp.toString(),
            purpose: "password_reset",
            expiresAt: expiry,
        });

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
        This code will expire in <b>5 minutes</b>.
      </p>
    `,
            })
        );

        return res.status(200).json({
            success: true,
            message: "Password reset OTP sent successfully to your email.",
        });
    } catch (error) {
        console.error("forgotB2CPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Error while sending reset OTP",
        });
    }
};

export const resetB2CPassword = async (req, res) => {
    try {
        const { email, otp, password, token, newPassword } = req.body;
        const targetPassword = newPassword || password;

        if (!targetPassword) {
            return res.status(400).json({ success: false, message: "New password is required" });
        }

        if (typeof targetPassword !== "string" || targetPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        // Token-based reset
        if (token) {
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
            }

            const user = await User.findById(decoded.id);
            if (!user) return res.status(404).json({ success: false, message: "User account not found" });

            user.password = targetPassword;
            await user.save();

            return res.status(200).json({ success: true, message: "Password reset successfully." });
        }

        // OTP-based reset
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP or reset token are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ success: false, message: "User not found with this email" });

        const record = await OTP.findOne({ userId: user._id, purpose: "password_reset" });
        if (!record) return res.status(400).json({ success: false, message: "No OTP found" });
        if (record.expiresAt < new Date()) return res.status(400).json({ success: false, message: "OTP expired" });

        const isMatch = await record.compareOtp(otp);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid OTP" });

        user.password = targetPassword;
        await user.save();

        await OTP.deleteMany({ userId: user._id, purpose: "password_reset" });

        return res.status(200).json({ success: true, message: "Password reset successfully." });
    } catch (error) {
        console.error("resetB2CPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Error while resetting password",
        });
    }
};

// ============================================================================
// 8. B2C UPDATE PASSWORD (Logged-in)
// ============================================================================
export const updateB2CPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Both current and new passwords are required" });
        }

        const user = await User.findById(req.user._id).select("+password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        console.error("updateB2CPassword error:", error);
        return res.status(500).json({ success: false, message: "Error while updating password" });
    }
};

// ============================================================================
// 9. B2C LOGOUT & DELETE ACCOUNT
// ============================================================================
export const logoutB2CUser = async (req, res) => {
    res.clearCookie(USER_TOKEN_COOKIE, clearAuthCookieOptions);
    return res.status(200).json({ success: true, message: "Logged Out Successfully" });
};

export const deleteB2CUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User Not Found" });

        if (user.profile_image) await deleteFromCloudinary(user.profile_image);
        await User.findByIdAndDelete(userId);

        res.clearCookie(USER_TOKEN_COOKIE, clearAuthCookieOptions);
        return res.status(200).json({ success: true, message: "Account Deleted Successfully" });
    } catch (error) {
        console.error("deleteB2CUserProfile error:", error);
        return res.status(500).json({ success: false, message: "Server error while deleting account" });
    }
};

// ============================================================================
// 10. REFRESH B2C TOKEN
// ============================================================================
export const refreshB2CToken = async (req, res) => {
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
            return res.status(401).json({ success: false, message: "No active token provided" });
        }

        let decoded;
        try {
            decoded = jwt.verify(existingToken, process.env.JWT_SECRET);
        } catch (err) {
            decoded = jwt.decode(existingToken);
            if (!decoded || !decoded.id) {
                return res.status(401).json({ success: false, message: "Invalid or expired session" });
            }
        }

        const user = await User.findById(decoded.id).select("-password");
        if (!user) return res.status(401).json({ success: false, message: "User account not found" });

        const newToken = jwt.sign(
            { id: user._id, role: user.role || "user", accountType: "B2C" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie(USER_TOKEN_COOKIE, newToken, authCookieOptions);

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            token: newToken,
            user: formatB2CUserResponse(user),
        });
    } catch (error) {
        console.error("refreshB2CToken error:", error);
        return res.status(500).json({ success: false, message: "Error refreshing token" });
    }
};

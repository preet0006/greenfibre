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

// =============================
// REGISTER USER CONTROLLER
// =============================
export const registerUser = async (req, res) => {
    try {
        const { full_name, email, phone, password } = req.body;

        if (!full_name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                message: "Full name, email and password are required",
            });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
        if (!emailOk) {
            return res.status(400).json({
                message: "Please enter a valid email address",
            });
        }

        if (phone && !/^\d{10}$/.test(String(phone))) {
            return res.status(400).json({
                message: "Please enter a valid 10-digit phone number",
            });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser)
            return res.status(400).json({
                message: "User is already registered with this email",
            });

        const user = await User.create({
            full_name: full_name.trim(),
            email: normalizedEmail,
            password,
            phone: phone || undefined,
            role: "user",
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

        // Send mail
        await sendMail(
            normalizedEmail,
            "Verify Your Email - Greenfibre",
            baseEmailTemplate({
                title: "Verify Your Email",
                subtitle: "Welcome to Greenfibre",
                body: `
      <p>Hi <b>${full_name.trim()}</b>,</p>
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
                message: first?.message || "Invalid registration data",
            });
        }
        return res
            .status(500)
            .json({ message: "Error while register" });
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

        // Generate Token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie(USER_TOKEN_COOKIE, token, authCookieOptions);

        const response = {
            success: true,
            message: "Email verified successfully, logged in.",
            token,
            user: {
                id: user._id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                profile_image: user.profile_image || null,
            },
        };

        res.status(200).json(response);
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
// LOGIN USER CONTROLLER
// =============================

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for missing fields
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and Password are required" });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select(
            "+password"
        );
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check for user isVerified
        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in.",
                code: "EMAIL_NOT_VERIFIED",
                email: user.email,
            });
        }

        // Check for password
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

        // Set token in HTTP-only cookie
        res.cookie(USER_TOKEN_COOKIE, token, authCookieOptions);

        // Build base response with optimized profile image
        const response = {
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
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error while login", error);
        return res.status(500).json({
            message: "Error while logging in",
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
            return res.status(404).json({ message: "User not found" });
        }

        // Transform user object with optimized profile image
        const userObj = user.toObject();

        if (userObj.profile_image) {
            userObj.profile_image = {
                original: user.profile_image,
                large: user.profile_image,
                thumbnail: user.profile_image,
            };
        }

        return res.status(200).json({
            success: true,
            user: userObj,
        });
    } catch (error) {
        console.error("Error while gettingProfile", error);
        return res
            .status(500)
            .json({ message: "Error while fetching profile" || error.message });
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
// RESET PASSWORD CONTROLLER (using OTP)
// =============================
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            return res
                .status(400)
                .json({ message: "Email, OTP and New Password are required" });
        }

        const user = await User.findOne({ email });
        if (!user)
            return res
                .status(404)
                .json({ message: "User not found with this email" });

        const record = await OTP.findOne({
            userId: user._id,
            purpose: "password_reset",
        });

        if (!record) return res.status(400).json({ message: "No OTP found" });
        if (record.expiresAt < new Date())
            return res.status(400).json({ message: "OTP expired" });

        const isMatch = await record.compareOtp(otp);
        if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

        // Hash and update password
        user.password = password;
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
            message: "Error while resetting password" || error.message,
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

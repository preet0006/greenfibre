import mongoose from "mongoose";
import { Coupon } from "../models/coupon.model.js";

// =============================
// CREATE COUPON (Admin)
// =============================
export const createCoupon = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            expiryDate,
            usageLimit,
            perUserLimit,
        } = req.body;

        if (!code || !discountType || discountValue === undefined) {
            return res.status(400).json({
                message: "code, discountType and discountValue are required",
            });
        }

        const existing = await Coupon.findOne({ code: code.toUpperCase() });

        if (existing) {
            return res.status(400).json({
                message: "Coupon already exists",
            });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            expiryDate,
            usageLimit,
            perUserLimit,
        });

        return res.status(201).json({
            success: true,
            coupon,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error creating coupon",
        });
    }
};

export const getCoupons = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({
                success: true,
                coupons: [],
            });
        }

        const coupons = await Coupon.find({ isActive: true })
            .select("-usedBy -__v")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            coupons,
        });
    } catch (error) {
        console.error("getCoupons error:", error.message);
        return res.status(200).json({
            success: true,
            coupons: [],
        });
    }
};

// =============================
// VALIDATE COUPON
// =============================
export const validateCoupon = async (req, res) => {
    try {
        const userId = req.user._id;
        const { code, cartTotal } = req.body;

        if (!code || cartTotal === undefined || cartTotal === null) {
            return res.status(400).json({
                message: "code and cartTotal are required",
            });
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true,
        });

        if (!coupon) {
            return res.status(400).json({
                message: "Invalid coupon code",
            });
        }

        if (coupon.expiryDate < new Date()) {
            return res.status(400).json({
                message: "Coupon expired",
            });
        }

        if (coupon.minOrderAmount > cartTotal) {
            return res.status(400).json({
                message: `Minimum order amount is ₹${coupon.minOrderAmount}`,
            });
        }

        if (coupon.usageLimit !== 0 && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                message: "Coupon usage limit exceeded",
            });
        }

        const userUsage = coupon.usedBy.find(
            (u) => u.user.toString() === userId.toString()
        );

        if (userUsage && userUsage.count >= coupon.perUserLimit) {
            return res.status(400).json({
                message: "You have already used this coupon",
            });
        }

        let discountAmount = 0;

        if (coupon.discountType === "percentage") {
            discountAmount = (cartTotal * coupon.discountValue) / 100;

            if (coupon.maxDiscountAmount) {
                discountAmount = Math.min(
                    discountAmount,
                    coupon.maxDiscountAmount
                );
            }
        } else {
            discountAmount = Math.min(coupon.discountValue, cartTotal);
        }

        return res.status(200).json({
            success: true,
            discountAmount,
            finalAmount: Math.max(0, cartTotal - discountAmount),
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error validating coupon",
        });
    }
};

export const applyCouponUsage = async (couponCode, userId) => {
    const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
    });

    if (!coupon) return;

    coupon.usedCount += 1;

    const userUsage = coupon.usedBy.find(
        (u) => u.user.toString() === userId.toString()
    );

    if (userUsage) {
        userUsage.count += 1;
    } else {
        coupon.usedBy.push({
            user: userId,
            count: 1,
        });
    }

    await coupon.save();
};

export const toggleCouponStatus = async (req, res) => {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
        return res.status(404).json({
            message: "Coupon not found",
        });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.status(200).json({
        success: true,
        isActive: coupon.isActive,
    });
};

// =============================
// DELETE COUPON (Admin)
// =============================
export const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;

        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return res.status(404).json({
                message: "Coupon not found",
            });
        }

        await Coupon.findByIdAndDelete(couponId);

        return res.status(200).json({
            success: true,
            message: "Coupon deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error deleting coupon",
        });
    }
};

// =============================
// GET ALL COUPONS (Admin)
// =============================
export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            coupons,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching coupons",
        });
    }
};

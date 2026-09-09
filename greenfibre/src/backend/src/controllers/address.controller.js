import { Address } from "../models/address.model.js";

const sanitizeAddressPayload = (data = {}, user = {}) => {
    const phone = String(data.phone || "").replace(/\D/g, "");
    const pincode = String(data.pincode || "").replace(/\D/g, "");
    const emailRaw = String(data.email || "").trim().toLowerCase();
    const email = emailRaw || user.email || "";

    return {
        addressType:
            data.addressType === "billing" || data.addressType === "shipping"
                ? data.addressType
                : "shipping",
        fullName: String(data.fullName || "").trim(),
        companyName: String(data.companyName || "").trim(),
        streetAddress: String(data.streetAddress || "").trim(),
        landmark: String(data.landmark || "").trim(),
        city: String(data.city || "").trim(),
        state: String(data.state || "").trim(),
        pincode,
        phone,
        email,
        isDefault: Boolean(data.isDefault),
    };
};

const validateAddressPayload = (payload) => {
    const errors = [];
    if (!payload.fullName) errors.push("Full name is required");
    if (!payload.streetAddress) errors.push("Street address is required");
    if (!payload.city) errors.push("City is required");
    if (!payload.state) errors.push("State is required");
    if (!/^\d{6}$/.test(payload.pincode)) errors.push("Valid 6-digit pincode is required");
    if (!/^\d{10}$/.test(payload.phone)) errors.push("Valid 10-digit phone is required");
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        errors.push("Valid email is required");
    }
    return errors;
};

// =============================
// ADD ADDRESS
// =============================
export const addAddress = async (req, res) => {
    try {
        const payload = sanitizeAddressPayload(req.body, req.user);
        const errors = validateAddressPayload(payload);

        if (errors.length) {
            return res.status(400).json({
                message: errors[0],
                errors,
            });
        }

        // If setting default, unset others of same type
        if (payload.isDefault) {
            await Address.updateMany(
                {
                    user: req.user._id,
                    addressType: payload.addressType,
                },
                { isDefault: false }
            );
        }

        // First address of this type becomes default automatically
        const existingCount = await Address.countDocuments({
            user: req.user._id,
            addressType: payload.addressType,
        });
        if (existingCount === 0) {
            payload.isDefault = true;
        }

        const address = await Address.create({
            ...payload,
            user: req.user._id,
        });

        res.status(201).json({
            success: true,
            message: "Address added successfully",
            address,
        });
    } catch (error) {
        console.error("addAddress", error);
        if (error?.name === "ValidationError") {
            const first = Object.values(error.errors || {})[0];
            return res.status(400).json({
                message: first?.message || "Invalid address data",
            });
        }
        res.status(500).json({
            message: "Error while adding address",
        });
    }
};

// =============================
// GET ADDRESSES
// =============================
export const getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({
            user: req.user._id,
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: addresses.length,
            addresses,
        });
    } catch (error) {
        console.error("getAddresses", error);
        res.status(500).json({
            message: "Error while fetching addresses",
        });
    }
};

// =============================
// UPDATE ADDRESS
// =============================
export const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const payload = sanitizeAddressPayload(req.body, req.user);
        const errors = validateAddressPayload(payload);

        if (errors.length) {
            return res.status(400).json({
                message: errors[0],
                errors,
            });
        }

        const address = await Address.findOne({
            _id: addressId,
            user: req.user._id,
        });

        if (!address) {
            return res.status(404).json({
                message: "Address not found",
            });
        }

        // Handle default switch
        if (payload.isDefault) {
            await Address.updateMany(
                {
                    user: req.user._id,
                    addressType: payload.addressType || address.addressType,
                },
                { isDefault: false }
            );
        }

        const updatedAddress = await Address.findByIdAndUpdate(
            addressId,
            payload,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            address: updatedAddress,
        });
    } catch (error) {
        console.error("updateAddress", error);
        if (error?.name === "ValidationError") {
            const first = Object.values(error.errors || {})[0];
            return res.status(400).json({
                message: first?.message || "Invalid address data",
            });
        }
        res.status(500).json({
            message: "Error while updating address",
        });
    }
};

// =============================
// DELETE ADDRESS
// =============================
export const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const address = await Address.findOneAndDelete({
            _id: addressId,
            user: req.user._id,
        });

        if (!address) {
            return res.status(404).json({
                message: "Address not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Address deleted successfully",
        });
    } catch (error) {
        console.error("deleteAddress", error);
        res.status(500).json({
            message: "Error while deleting address",
        });
    }
};

// =============================
// GET DEFAULT ADDRESS
// =============================
export const getDefaultAddress = async (req, res) => {
    try {
        const addressType = req.query?.addressType || "shipping";

        const address = await Address.findOne({
            user: req.user._id,
            addressType,
            isDefault: true,
        });

        res.status(200).json({
            success: true,
            address,
        });
    } catch (error) {
        console.error("getDefaultAddress", error);
        res.status(500).json({
            message: "Error while fetching default address",
        });
    }
};

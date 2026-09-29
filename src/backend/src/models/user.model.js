import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        full_name: {
            type: String,
            required: [true, "Contact name is required"],
            trim: true,
        },
        companyName: {
            type: String,
            trim: true,
            default: "",
        },
        email: {
            type: String,
            required: [true, "Work email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
        },
        phone: {
            type: String,
            trim: true,
            default: "",
        },
        businessType: {
            type: String,
            enum: [
                "Corporate Gifting & HR",
                "Hotel & Hospitality",
                "Cafes & Restaurants",
                "Retail Distributor / Reseller",
                "Eco Living Brand",
                "Other Enterprise",
                "Retailer",
                "Wholesaler",
                "Distributor",
                "Manufacturer",
                "Corporate",
                "Exporter",
                "Other",
            ],
            default: "Corporate Gifting & HR",
        },
        gstin: {
            type: String,
            uppercase: true,
            trim: true,
            default: "",
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
            select: false, // Do not return password by default in queries
        },
        role: {
            type: String,
            enum: ["user", "b2b_buyer", "b2b_verified", "admin"],
            default: "user",
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isB2BVerified: {
            type: Boolean,
            default: false,
        },
        accountType: {
            type: String,
            enum: ["B2C", "B2B"],
            default: "B2C",
            index: true,
        },
        profile_image: {
            type: String,
        },
        billingAddress: {
            street: { type: String, default: "" },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            pincode: { type: String, default: "" },
            country: { type: String, default: "India" },
        },
        b2bProfile: {
            companyName: {
                type: String,
                trim: true,
                default: "",
            },
            gstin: {
                type: String,
                uppercase: true,
                trim: true,
                default: "",
            },
            panNumber: {
                type: String,
                uppercase: true,
                trim: true,
                default: "",
            },
            businessType: {
                type: String,
                default: "Corporate Gifting & HR",
            },
            verificationStatus: {
                type: String,
                enum: ["pending", "verified", "rejected"],
                default: "pending",
                index: true,
            },
            verificationNotes: {
                type: String,
                default: "",
            },
            creditLimit: {
                type: Number,
                default: 0,
            },
            creditTermsDays: {
                type: Number,
                default: 0,
            },
            tradeLicenseDoc: {
                type: String,
            },
            gstCertificateDoc: {
                type: String,
            },
            appliedAt: {
                type: Date,
                default: Date.now,
            },
            verifiedAt: {
                type: Date,
            },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for fullName <-> full_name bi-directional mapping
userSchema.virtual("fullName")
    .get(function () {
        return this.full_name;
    })
    .set(function (name) {
        this.full_name = name;
    });

// Pre-validate hook to populate full_name from fullName if passed
userSchema.pre("validate", function (next) {
    if (this.fullName && !this.full_name) {
        this.full_name = this.fullName;
    }
    if (this.full_name && !this.fullName) {
        this.fullName = this.full_name;
    }
    if (typeof next === "function") next();
});

// Pre-save hook to synchronize top-level and b2bProfile fields
userSchema.pre("save", function (next) {
    if (this.companyName) {
        if (!this.b2bProfile) this.b2bProfile = {};
        this.b2bProfile.companyName = this.companyName;
    }
    if (this.gstin) {
        if (!this.b2bProfile) this.b2bProfile = {};
        this.b2bProfile.gstin = this.gstin;
    }
    if (this.businessType) {
        if (!this.b2bProfile) this.b2bProfile = {};
        this.b2bProfile.businessType = this.businessType;
    }
    if (this.role === "b2b_verified" || this.b2bProfile?.verificationStatus === "verified") {
        this.isB2BVerified = true;
    }
    if (typeof next === "function") next();
});

// Password hashing before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        if (typeof next === "function") return next();
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    if (typeof next === "function") next();
});

// Compare password methods
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema);


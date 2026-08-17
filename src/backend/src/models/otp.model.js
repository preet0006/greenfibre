import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MAX_OTP_ATTEMPTS = 5;

const otpSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        otp: {
            type: String,
            required: true,
        },
        purpose: {
            type: String,
            enum: ["email_verification", "password_reset"],
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        maxAttempts: {
            type: Number,
            default: MAX_OTP_ATTEMPTS,
        },
    },
    { timestamps: true }
);

otpSchema.pre("save", async function () {
    if (!this.isModified("otp")) return;
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
});

otpSchema.methods.compareOtp = async function (enteredOtp) {
    return bcrypt.compare(enteredOtp, this.otp);
};

export const OTP = mongoose.model("OTP", otpSchema);
export { MAX_OTP_ATTEMPTS };

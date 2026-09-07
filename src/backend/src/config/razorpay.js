import Razorpay from "razorpay";

export const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID;
export const getRazorpayKeySecret = () => process.env.RAZORPAY_KEY_SECRET;

export const getRazorpayInstance = () => {
    const key_id = getRazorpayKeyId();
    const key_secret = getRazorpayKeySecret();

    if (!key_id || !key_secret) {
        throw new Error("Razorpay credentials (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing.");
    }

    return new Razorpay({
        key_id,
        key_secret,
    });
};

import { getSrBase } from "./shiprocket.js";

/**
 * Validates startup environment configuration for Razorpay and Shiprocket.
 *
 * Rules:
 *  1. Logs active modes (test/live) without secret values.
 *  2. If SHIPROCKET_ENABLED is not "true", skip Shiprocket mode checks.
 *  3. If SHIPROCKET_ENABLED=true and SHIPROCKET_BASE_URL is missing, fail at startup with a clear message.
 *  4. Refuses startup if Razorpay and Shiprocket environments are mixed in EITHER direction
 *     (test Razorpay + live Shiprocket, or live Razorpay + sandbox Shiprocket) in every environment.
 */
export function validateStartupModes() {
    const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
    let rzpMode = "unknown";
    if (keyId.startsWith("rzp_test_")) {
        rzpMode = "test";
    } else if (keyId.startsWith("rzp_live_")) {
        rzpMode = "live";
    }

    const shiprocketEnabled = process.env.SHIPROCKET_ENABLED === "true";

    if (!shiprocketEnabled) {
        console.log(`🔒 [STARTUP ENV CHECK] Razorpay Mode: ${rzpMode.toUpperCase()} | Shiprocket: DISABLED (SHIPROCKET_ENABLED is not "true")`);
        return;
    }

    // SHIPROCKET_ENABLED === "true" requires explicit SHIPROCKET_BASE_URL
    const rawSrBase = (process.env.SHIPROCKET_BASE_URL || "").trim();
    if (!rawSrBase) {
        console.error(
            "🚨 FATAL [ENVIRONMENT CONFIG]: SHIPROCKET_ENABLED=true but SHIPROCKET_BASE_URL is missing. " +
            "Please set SHIPROCKET_BASE_URL explicitly in environment variables."
        );
        process.exit(1);
    }

    let srBase = "";
    let srMode = "unknown";
    try {
        srBase = getSrBase();
        if (srBase.includes("sandbox")) {
            srMode = "sandbox";
        } else if (srBase.includes("apiv2.shiprocket.in") || srBase.includes("shiprocket.in")) {
            srMode = "live";
        } else {
            srMode = "custom";
        }
    } catch (err) {
        console.error(`🚨 FATAL [ENVIRONMENT CONFIG]: ${err.message}`);
        process.exit(1);
    }

    console.log(`🔒 [STARTUP ENV CHECK] Razorpay Mode: ${rzpMode.toUpperCase()} | Shiprocket Mode: ${srMode.toUpperCase()}`);
    console.log(`🌐 [STARTUP ENV CHECK] Shiprocket Base URL: ${srBase}`);

    // Log active combination
    if (rzpMode === "test" && srMode === "live") {
        console.log(`ℹ️ [STARTUP ENV CHECK] Razorpay TEST mode with Shiprocket LIVE PRODUCTION mode is enabled as configured.`);
        return;
    }

    // In strict production, refuse live payments with sandbox shipping
    if (process.env.NODE_ENV === "production" && rzpMode === "live" && srMode === "sandbox") {
        console.error(
            `🚨 FATAL: Production cannot pair Live Razorpay with Sandbox Shiprocket.`
        );
        process.exit(1);
    }
}


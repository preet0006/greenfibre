/**
 * orderStatusMachine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central state machine for Green Fibre orders.
 * Shared by:
 *  1. Shiprocket delivery webhook (/api/shipping/delivery-update)
 *  2. Admin status update (/api/order/status/:orderId)
 *  3. Customer sanitization filters
 *
 * Rules:
 *  - Forward-only progression: pending/placed -> processing -> shipped -> delivered.
 *  - Forward jumps that skip steps are permitted:
 *      processing -> delivered
 *      processing -> rto_initiated / rto_in_transit / rto_delivered
 *      shipped -> rto_in_transit / rto_delivered
 *      etc.
 *  - Terminal states: 'delivered', 'rto_delivered', 'return_delivered', 'cancelled', 'failed', 'payment_failed'.
 *    Courier webhooks can NEVER transition out of terminal states.
 *  - Locked states: 'lost' and 'qc_failed'. Courier webhooks cannot move out of them.
 *    Only an admin with an explicit overrideReason string can change locked or terminal states.
 *  - 'undelivered' (NDR) can return to 'shipped' (delivery re-attempt), 'delivered', or 'rto_*'.
 *  - Backward/regressive moves are ignored without creating a history entry.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const ORDER_STATUSES = [
    "pending",
    "placed",
    "processing",
    "shipped",
    "delivered",
    "undelivered",
    "qc_failed",
    "lost",
    "rto_initiated",
    "rto_in_transit",
    "rto_delivered",
    "return_out_for_pickup",
    "return_picked_up",
    "return_in_transit",
    "return_delivered",
    "cancelled",
    "failed",
    "payment_failed",
];

export const TERMINAL_STATUSES = new Set([
    "delivered",
    "rto_delivered",
    "return_delivered",
    "cancelled",
    "failed",
    "payment_failed",
]);

export const LOCKED_STATUSES = new Set([
    "lost",
    "qc_failed",
]);

// Forward-only allowed transitions from a given status
const FORWARD_TRANSITIONS = {
    pending: [
        "placed",
        "processing",
        "shipped",
        "delivered",
        "undelivered",
        "rto_initiated",
        "rto_in_transit",
        "rto_delivered",
        "cancelled",
        "failed",
        "payment_failed",
        "lost",
        "qc_failed",
    ],
    placed: [
        "processing",
        "shipped",
        "delivered",
        "undelivered",
        "rto_initiated",
        "rto_in_transit",
        "rto_delivered",
        "cancelled",
        "failed",
        "payment_failed",
        "lost",
        "qc_failed",
    ],
    processing: [
        "shipped",
        "delivered",
        "undelivered",
        "rto_initiated",
        "rto_in_transit",
        "rto_delivered",
        "cancelled",
        "failed",
        "lost",
        "qc_failed",
    ],
    shipped: [
        "shipped", // scans & tracking milestones
        "delivered",
        "undelivered",
        "rto_initiated",
        "rto_in_transit",
        "rto_delivered",
        "lost",
        "cancelled",
        "failed",
    ],
    undelivered: [
        "shipped", // re-attempt out for delivery / in transit
        "delivered",
        "undelivered", // subsequent NDR scans
        "rto_initiated",
        "rto_in_transit",
        "rto_delivered",
        "lost",
        "cancelled",
        "failed",
    ],
    rto_initiated: [
        "rto_initiated",
        "rto_in_transit",
        "rto_delivered",
        "lost",
    ],
    rto_in_transit: [
        "rto_in_transit",
        "rto_delivered",
        "lost",
    ],
    rto_delivered: [], // terminal
    return_out_for_pickup: [
        "return_out_for_pickup",
        "return_picked_up",
        "return_in_transit",
        "return_delivered",
        "lost",
        "cancelled",
    ],
    return_picked_up: [
        "return_picked_up",
        "return_in_transit",
        "return_delivered",
        "lost",
    ],
    return_in_transit: [
        "return_in_transit",
        "return_delivered",
        "lost",
    ],
    return_delivered: [], // terminal
    delivered: [],        // terminal for courier/delivery
    qc_failed: [],        // locked: requires admin override
    lost: [],             // locked: requires admin override
    cancelled: [],        // terminal
    failed: [],           // terminal
    payment_failed: [],   // terminal
};

/**
 * Returns list of allowed "from" statuses that can legally transition to targetStatus.
 * Used for atomic findOneAndUpdate filters in courier webhooks.
 *
 * @param {string} targetStatus
 * @param {boolean} [isAdmin=false]
 * @returns {string[]}
 */
export function getAllowedFromStatuses(targetStatus, isAdmin = false) {
    if (!targetStatus || !ORDER_STATUSES.includes(targetStatus)) return [];
    if (isAdmin) {
        return [...ORDER_STATUSES];
    }
    const fromStatuses = [];
    for (const [fromStatus, allowedTargets] of Object.entries(FORWARD_TRANSITIONS)) {
        if (allowedTargets.includes(targetStatus)) {
            fromStatuses.push(fromStatus);
        }
    }
    return fromStatuses;
}

/**
 * Validate whether a status transition is permitted.
 *
 * @param {string} currentStatus - Current orderStatus
 * @param {string} targetStatus - Proposed new orderStatus
 * @param {Object} options
 * @param {boolean} [options.isAdmin=false] - Whether caller is an authenticated admin
 * @param {string} [options.overrideReason=""] - Admin explanation for manual override
 * @param {string} [options.adminId=null] - Admin user ID for audit log
 * @returns {{ allowed: boolean, reason?: string, isDuplicate?: boolean, isTerminal?: boolean, requiresOverride?: boolean, auditNote?: string }}
 */
export function canTransition(currentStatus, targetStatus, options = {}) {
    const { isAdmin = false, overrideReason = "", adminId = null } = options;

    if (!targetStatus || !ORDER_STATUSES.includes(targetStatus)) {
        return {
            allowed: false,
            reason: `Invalid target status "${targetStatus}". Must be one of: ${ORDER_STATUSES.join(", ")}`,
        };
    }

    // Identical status: allow for status updates / note appending (e.g. in-transit scans)
    // UNLESS the order is in a terminal state (terminal states cannot receive further updates)
    if (currentStatus === targetStatus) {
        if (TERMINAL_STATUSES.has(currentStatus)) {
            return {
                allowed: false,
                isTerminal: true,
                reason: `Order is already in terminal state "${currentStatus}". Subsequent events are ignored.`,
            };
        }
        return { allowed: true, isDuplicate: true };
    }

    // Terminal states can NEVER be changed by automated courier webhooks
    if (TERMINAL_STATUSES.has(currentStatus)) {
        if (isAdmin && overrideReason?.trim()) {
            return {
                allowed: true,
                auditNote: `[Admin Override] Status changed from terminal "${currentStatus}" to "${targetStatus}" by admin ${adminId || "unknown"}: ${overrideReason.trim()}`,
            };
        }
        return {
            allowed: false,
            isTerminal: true,
            requiresOverride: true,
            reason: `Order is in terminal state "${currentStatus}". Status cannot be changed without an admin override reason.`,
        };
    }

    // 'lost' is locked for courier updates; admin can override with reason
    if (currentStatus === "lost") {
        if (isAdmin && overrideReason?.trim()) {
            return {
                allowed: true,
                auditNote: `[Admin Override] Status changed from "lost" to "${targetStatus}" by admin ${adminId || "unknown"}: ${overrideReason.trim()}`,
            };
        }
        return {
            allowed: false,
            requiresOverride: true,
            reason: `Order is marked as "lost". Status cannot be changed without an admin override reason.`,
        };
    }

    // 'qc_failed' is locked for courier updates; admin can override
    if (currentStatus === "qc_failed") {
        if (isAdmin && overrideReason?.trim()) {
            return {
                allowed: true,
                auditNote: `[Admin Override] Status changed from "qc_failed" to "${targetStatus}" by admin ${adminId || "unknown"}: ${overrideReason.trim()}`,
            };
        }
        return {
            allowed: false,
            requiresOverride: true,
            reason: `Order has QC failure. Status cannot be changed without an admin override reason.`,
        };
    }

    // Check forward transitions list
    const allowedTargets = FORWARD_TRANSITIONS[currentStatus] || [];
    if (allowedTargets.includes(targetStatus)) {
        return { allowed: true };
    }

    // If admin provides an explicit override reason, allow out-of-band transitions with audit note
    if (isAdmin && overrideReason?.trim()) {
        return {
            allowed: true,
            auditNote: `[Admin Override] Status changed from "${currentStatus}" to "${targetStatus}" by admin ${adminId || "unknown"}: ${overrideReason.trim()}`,
        };
    }

    return {
        allowed: false,
        requiresOverride: isAdmin,
        reason: `Transition from "${currentStatus}" to "${targetStatus}" is not permitted (backward or unauthorized move).`,
    };
}

// ── Shiprocket Status Mapping ────────────────────────────────────────────────
// Full mapping of all 17 Shiprocket sandbox statuses + live courier statuses
const SR_STATUS_MAP = {
    // 1. Placed / Booked
    "new": "placed",
    "booked": "placed",
    "order confirmed": "placed",

    // 2. Processing / Pickup
    "pickup scheduled": "processing",
    "pickup generated": "processing",
    "pickup queued": "processing",
    "pickup error": "processing",
    "pickup rescheduled": "processing",
    "out for pickup": "processing",
    "manifest generated": "processing",
    "processing": "processing",

    // 3. Shipped / In Transit / Out for Delivery
    "picked up": "shipped",
    "in transit": "shipped",
    "shipped": "shipped",
    "reached at destination hub": "shipped",
    "reached at origin hub": "shipped",
    "out for delivery": "shipped",
    "misrouted": "shipped",
    "delayed": "shipped",

    // 4. Undelivered / NDR (Attempt failed)
    "delivery failed": "undelivered",
    "undelivered": "undelivered",
    "rto ndr": "undelivered",
    "ndr": "undelivered",

    // 5. Delivered
    "delivered": "delivered",
    "complete": "delivered",
    "completed": "delivered",

    // 6. QC Failed
    "qc failed": "qc_failed",
    "qc error": "qc_failed",

    // 7. Lost / Damaged
    "lost": "lost",
    "damaged": "lost",
    "destroyed": "lost",

    // 8. RTO (Return to Origin)
    "rto initiated": "rto_initiated",
    "rto in transit": "rto_in_transit",
    "rto delivered": "rto_delivered",
    "rto acknowledged": "rto_delivered",
    "returned to origin": "rto_delivered",

    // 9. Customer Returns
    "return initiated": "return_out_for_pickup",
    "return pickup scheduled": "return_out_for_pickup",
    "return out for pickup": "return_out_for_pickup",
    "return picked up": "return_picked_up",
    "return in transit": "return_in_transit",
    "return delivered": "return_delivered",

    // 10. Cancellation
    "cancelled": "cancelled",
    "canceled": "cancelled",
};

/**
 * Normalize an incoming Shiprocket status string to a valid Green Fibre orderStatus.
 * Supports spaces, underscores, and hyphens (e.g. IN_TRANSIT, IN-TRANSIT, IN TRANSIT).
 * Returns null if the status is unknown.
 *
 * @param {string} srStatus
 * @returns {string|null}
 */
export function mapShiprocketStatus(srStatus) {
    if (!srStatus || typeof srStatus !== "string") return null;
    const clean = srStatus.toLowerCase().trim().replace(/[_\-]+/g, " ");
    return SR_STATUS_MAP[clean] || SR_STATUS_MAP[srStatus.toLowerCase().trim()] || null;
}

/**
 * Escapes regex special characters in a string.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
    if (!str || typeof str !== "string") return "";
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check if a status note is considered internal (audit, ops error, payment check).
 *
 * @param {string} note
 * @returns {boolean}
 */
export function isInternalNote(note) {
    if (!note || typeof note !== "string") return false;
    const trimmed = note.trim();
    if (trimmed.startsWith("[Admin Override]")) return true;

    // Warning / security symbols
    const warningSymbols = ["⚠️", "🚨", "🛑", "🔒", "!", "⛔", "🚩", "❌"];
    if (warningSymbols.some((sym) => trimmed.startsWith(sym))) return true;

    const lower = trimmed.toLowerCase();
    const internalKeywords = [
        "needs review",
        "stock conflict",
        "payment validation",
        "duplicate payment",
        "shiprocket processing error",
        "automatic shiprocket order reservation failed",
    ];

    return internalKeywords.some((kw) => lower.includes(kw));
}

/**
 * Strips internal notes from statusHistory for customer-facing APIs.
 * Preserves public milestones but omits audit notes / internal warning text.
 *
 * @param {Array} history
 * @returns {Array}
 */
export function sanitizeStatusHistoryForCustomer(history = []) {
    if (!Array.isArray(history)) return [];

    return history.map((entry) => {
        const raw = typeof entry?.toObject === "function" ? entry.toObject() : { ...entry };
        if (!raw || !raw.note) return raw;

        if (isInternalNote(raw.note)) {
            const { note, ...sanitized } = raw;
            return sanitized;
        }
        return raw;
    });
}

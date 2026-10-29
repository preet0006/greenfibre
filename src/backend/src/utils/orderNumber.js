import { Counter } from "../models/counter.model.js";

/**
 * Generate an atomic, sequentially increasing order number.
 * Example format: GF-2026-000123
 *
 * Safe against race conditions and concurrent requests because
 * findByIdAndUpdate with $inc is atomic in MongoDB.
 *
 * @param {string} prefix - Custom prefix (default: 'GF')
 * @returns {Promise<string>} e.g. "GF-2026-000041"
 */
export async function getNextOrderNumber(prefix = "GF") {
    const year = new Date().getFullYear();
    const counterId = `orderNumber_${year}`;

    const counter = await Counter.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } },
        { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
    );

    const paddedSeq = String(counter.seq).padStart(6, "0");
    return `${prefix}-${year}-${paddedSeq}`;
}

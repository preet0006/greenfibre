/**
 * Pricing Engine for B2B & B2C E-commerce
 * Handles tiered wholesale slabs, MOQ validation, pack sizing, and tax calculations.
 */

/**
 * Calculates the exact unit price, applied tier slab, next tier upsell target,
 * and tax breakdown for a product given a requested quantity.
 *
 * @param {Object} product - Product Mongoose document or plain object
 * @param {number} quantity - Desired quantity (integer >= 1)
 * @param {Object} options - Options { isB2BVerified: boolean }
 * @returns {Object} Calculated pricing payload
 */
export const calculateProductPricing = (product, quantity = 1, options = {}) => {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const isB2BVerified = options.isB2BVerified ?? true;

    // B2C / Retail baseline
    const retailOriginal = Number(product.originalPrice) || 0;
    const retailPrice = Number(product.discountedPrice) || retailOriginal;

    const b2bConfig = product.b2bPricing || {};
    const isB2BEnabled = Boolean(b2bConfig.isEnabled || product.b2bPrice);

    // If B2B is not active for this product or buyer is standard retail:
    if (!isB2BEnabled || !isB2BVerified) {
        const subtotal = retailPrice * qty;
        const retailTotal = retailOriginal * qty;
        return {
            pricingMode: "B2C",
            unitPrice: retailPrice,
            subtotal,
            retailUnitPrice: retailOriginal,
            totalRetailPrice: retailTotal,
            totalSavings: Math.max(0, retailTotal - subtotal),
            savingsPercent: retailOriginal > 0 ? Math.round(((retailOriginal - retailPrice) / retailOriginal) * 100) : 0,
            appliedTier: null,
            nextTier: null,
            moq: 1,
            stepQuantity: 1,
            isValidMoq: true,
            isValidStep: true,
            tax: calculateTaxBreakdown(product, subtotal),
        };
    }

    // B2B Rules
    const moq = Math.max(1, Number(b2bConfig.moq) || 1);
    const stepQuantity = Math.max(1, Number(b2bConfig.stepQuantity) || 1);
    const fallbackB2BPrice = Number(b2bConfig.basePrice) || Number(product.b2bPrice) || retailPrice;

    // Validate MOQ & Step
    const isValidMoq = qty >= moq;
    const isValidStep = (qty - moq) % stepQuantity === 0;

    // Tier Evaluation
    const rawTiers = Array.isArray(b2bConfig.tiers) ? [...b2bConfig.tiers] : [];
    // Sort tiers by minQty ascending
    const sortedTiers = rawTiers
        .filter((t) => typeof t.unitPrice === "number" && t.unitPrice > 0 && typeof t.minQty === "number")
        .sort((a, b) => a.minQty - b.minQty);

    let unitPrice = fallbackB2BPrice;
    let appliedTier = null;
    let nextTier = null;

    if (sortedTiers.length > 0) {
        // Find matching tier
        for (let i = 0; i < sortedTiers.length; i++) {
            const tier = sortedTiers[i];
            const max = tier.maxQty !== null && tier.maxQty !== undefined ? Number(tier.maxQty) : Infinity;
            if (qty >= tier.minQty && qty <= max) {
                unitPrice = Number(tier.unitPrice);
                appliedTier = {
                    minQty: tier.minQty,
                    maxQty: tier.maxQty ?? null,
                    unitPrice: Number(tier.unitPrice),
                    discountPercentage: tier.discountPercentage || 0,
                };

                // Find next tier for upselling
                if (i + 1 < sortedTiers.length) {
                    const upcoming = sortedTiers[i + 1];
                    nextTier = {
                        minQty: upcoming.minQty,
                        unitPrice: Number(upcoming.unitPrice),
                        unitsNeeded: Math.max(0, upcoming.minQty - qty),
                        potentialSavingsPerUnit: Math.max(0, unitPrice - Number(upcoming.unitPrice)),
                    };
                }
                break;
            }
        }

        // If quantity is below lowest tier minQty
        if (!appliedTier && qty < sortedTiers[0].minQty) {
            unitPrice = fallbackB2BPrice;
            const upcoming = sortedTiers[0];
            nextTier = {
                minQty: upcoming.minQty,
                unitPrice: Number(upcoming.unitPrice),
                unitsNeeded: Math.max(0, upcoming.minQty - qty),
                potentialSavingsPerUnit: Math.max(0, unitPrice - Number(upcoming.unitPrice)),
            };
        }

        // If quantity is above highest tier with defined maxQty
        if (!appliedTier && sortedTiers.length > 0 && qty > (sortedTiers[sortedTiers.length - 1].maxQty || Infinity)) {
            const highestTier = sortedTiers[sortedTiers.length - 1];
            unitPrice = Number(highestTier.unitPrice);
            appliedTier = {
                minQty: highestTier.minQty,
                maxQty: highestTier.maxQty ?? null,
                unitPrice: Number(highestTier.unitPrice),
                discountPercentage: highestTier.discountPercentage || 0,
            };
        }
    }

    const subtotal = Math.round(unitPrice * qty * 100) / 100;
    const retailTotal = Math.round(retailOriginal * qty * 100) / 100;
    const totalSavings = Math.max(0, retailTotal - subtotal);
    const savingsPercent = retailOriginal > 0 ? Math.round(((retailOriginal - unitPrice) / retailOriginal) * 100) : 0;

    return {
        pricingMode: "B2B",
        unitPrice,
        subtotal,
        retailUnitPrice: retailOriginal,
        totalRetailPrice: retailTotal,
        totalSavings,
        savingsPercent,
        appliedTier,
        nextTier,
        moq,
        stepQuantity,
        isValidMoq,
        isValidStep,
        validationError: !isValidMoq
            ? `Minimum order quantity is ${moq} units.`
            : !isValidStep
            ? `Quantity must be ordered in multiples of ${stepQuantity} (above MOQ ${moq}).`
            : null,
        tax: calculateTaxBreakdown(product, subtotal),
    };
};

/**
 * Calculates GST / Tax Breakdown
 */
export const calculateTaxBreakdown = (product, subtotal = 0) => {
    const taxConfig = product.tax || {};
    const gstRate = typeof taxConfig.gstRate === "number" ? taxConfig.gstRate : 18;
    const isTaxInclusive = taxConfig.isTaxInclusive ?? true;
    const hsnCode = taxConfig.hsnCode || "";

    let netAmount = 0;
    let taxAmount = 0;
    let grossAmount = 0;

    if (isTaxInclusive) {
        grossAmount = subtotal;
        netAmount = Math.round((subtotal / (1 + gstRate / 100)) * 100) / 100;
        taxAmount = Math.round((grossAmount - netAmount) * 100) / 100;
    } else {
        netAmount = subtotal;
        taxAmount = Math.round(((subtotal * gstRate) / 100) * 100) / 100;
        grossAmount = Math.round((netAmount + taxAmount) * 100) / 100;
    }

    // Split tax into CGST + SGST (9% + 9%) or IGST (18%)
    const halfTax = Math.round((taxAmount / 2) * 100) / 100;

    return {
        hsnCode,
        gstRate,
        isTaxInclusive,
        netAmount,
        taxAmount,
        grossAmount,
        cgst: halfTax,
        sgst: halfTax,
        igst: taxAmount,
    };
};

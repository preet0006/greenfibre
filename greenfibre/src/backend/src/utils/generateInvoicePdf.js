import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { uploadPdfToCloudinary } from "./cloudinary.js";

// ── Brand colors ───────────────────────────────────────────────
const BRAND = {
    primary: "#15803d", // green-700
    accent: "#16a34a", // green-600
    dark: "#14532d", // green-900
    text: "#1f2937", // gray-800
    muted: "#6b7280", // gray-500
    light: "#dcfce7", // green-100
    border: "#e5e7eb", // gray-200
    white: "#ffffff",
    success: "#16a34a",
};

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const generateInvoicePdf = async (order) => {
    const invoiceDir = path.join("public", "invoices");
    if (!fs.existsSync(invoiceDir))
        fs.mkdirSync(invoiceDir, { recursive: true });

    const fileName = `invoice-${order._id.toString()}.pdf`;
    const filePath = path.join(invoiceDir, fileName);

    const doc = new PDFDocument({
        margin: 0,
        size: "A4",
        info: {
            Title: `Invoice – ${order.easebuzzOrderId || order._id.toString()}`,
            Author: process.env.COMPANY_NAME || "Green Fibre",
            Subject: "Tax Invoice",
        },
    });

    doc.pipe(fs.createWriteStream(filePath));

    const W = 595.28; // A4 width in points
    const H = 841.89; // A4 height in points
    const MARGIN = 40;
    const CONTENT_W = W - MARGIN * 2;

    // ══════════════════════════════════════════════════════
    // 1. HEADER BAND (full-width green strip)
    // ══════════════════════════════════════════════════════
    doc.rect(0, 0, W, 120).fill(BRAND.primary);

    // Company name — white bold
    doc.fillColor(BRAND.white)
        .font("Helvetica-Bold")
        .fontSize(26)
        .text(process.env.COMPANY_NAME || "GREEN FIBRE", MARGIN, 28, {
            width: 280,
        });

    // Tagline
    doc.fillColor("rgba(255,255,255,0.65)")
        .font("Helvetica")
        .fontSize(9)
        .text("SUSTAINABILITY, SIMPLIFIED", MARGIN, 58, {
            characterSpacing: 2,
        });

    // "TAX INVOICE" label — right side
    doc.fillColor(BRAND.white)
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("TAX INVOICE", MARGIN, 32, { width: CONTENT_W, align: "right" });

    // Invoice number + date — right side, smaller
    const invDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
    doc.fillColor("rgba(255,255,255,0.8)")
        .font("Helvetica")
        .fontSize(9)
        .text(
            `Invoice No: ${order.easebuzzOrderId || order._id?.toString().slice(-10).toUpperCase()}`,
            MARGIN,
            60,
            { width: CONTENT_W, align: "right" }
        )
        .text(`Date: ${invDate}`, MARGIN, 72, {
            width: CONTENT_W,
            align: "right",
        });

    // Thin accent bar at bottom of header
    doc.rect(0, 118, W, 3).fill(BRAND.accent);

    // ══════════════════════════════════════════════════════
    // 2. COMPANY & BILLING INFO — two-column
    // ══════════════════════════════════════════════════════
    const infoTop = 136;

    // ── Left: Company details ──
    doc.fillColor(BRAND.primary)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("SOLD BY", MARGIN, infoTop, { characterSpacing: 1.5 });

    doc.fillColor(BRAND.text)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(process.env.COMPANY_NAME || "Green Fibre", MARGIN, infoTop + 14);

    doc.fillColor(BRAND.muted)
        .font("Helvetica")
        .fontSize(8.5)
        .text(process.env.COMPANY_ADDRESS || "India", MARGIN, infoTop + 28, {
            width: 220,
        })
        .text(
            `Phone: ${process.env.COMPANY_PHONE || "—"}`,
            MARGIN,
            infoTop + 50
        )
        .text(
            `Email: ${process.env.COMPANY_EMAIL || "—"}`,
            MARGIN,
            infoTop + 62
        )
        .text(`GSTIN: ${process.env.COMPANY_GST || "—"}`, MARGIN, infoTop + 74);

    // ── Right: Billing / Shipping ──
    const rightX = W / 2 + 10;
    doc.fillColor(BRAND.primary)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("BILL TO / SHIP TO", rightX, infoTop, { characterSpacing: 1.5 });

    doc.fillColor(BRAND.text)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(order.shippingAddress?.fullName || "—", rightX, infoTop + 14, {
            width: 230,
        });

    const addr = [
        order.shippingAddress?.streetAddress,
        order.shippingAddress?.landmark,
        [order.shippingAddress?.city, order.shippingAddress?.state]
            .filter(Boolean)
            .join(", "),
        order.shippingAddress?.pincode
            ? `PIN: ${order.shippingAddress.pincode}`
            : null,
    ]
        .filter(Boolean)
        .join("\n");

    doc.fillColor(BRAND.muted)
        .font("Helvetica")
        .fontSize(8.5)
        .text(addr, rightX, infoTop + 28, { width: 220 });

    let addrBottom = doc.y;

    if (order.shippingAddress?.phone) {
        doc.text(
            `Phone: ${order.shippingAddress.phone}`,
            rightX,
            addrBottom + 4,
            { width: 220 }
        );
        addrBottom = doc.y;
    }
    if (order.shippingAddress?.email) {
        doc.text(
            `Email: ${order.shippingAddress.email}`,
            rightX,
            addrBottom + 4,
            { width: 220 }
        );
        addrBottom = doc.y;
    }

    // ── Divider ──
    const dividerY = Math.max(infoTop + 100, addrBottom + 20);
    doc.moveTo(MARGIN, dividerY)
        .lineTo(W - MARGIN, dividerY)
        .strokeColor(BRAND.border)
        .lineWidth(0.5)
        .stroke();

    // ══════════════════════════════════════════════════════
    // 3. PAYMENT & ORDER INFO ROW
    // ══════════════════════════════════════════════════════
    const metaY = dividerY + 12;
    const metaCols = [
        {
            label: "Order ID",
            value:
                order.easebuzzOrderId ||
                order._id?.toString().slice(-10).toUpperCase(),
        },
        { label: "Payment Method", value: order.paymentMethod || "Easebuzz" },
        {
            label: "Payment Status",
            value: (order.paymentStatus || "pending").toUpperCase(),
        },
        {
            label: "Order Status",
            value: (order.orderStatus || "placed").toUpperCase(),
        },
    ];
    const metaColW = CONTENT_W / metaCols.length;

    metaCols.forEach((col, i) => {
        const cx = MARGIN + i * metaColW;
        doc.fillColor(BRAND.muted)
            .font("Helvetica")
            .fontSize(7.5)
            .text(col.label, cx, metaY, {
                width: metaColW - 8,
                characterSpacing: 0.8,
            });
        doc.fillColor(BRAND.text)
            .font("Helvetica-Bold")
            .fontSize(9)
            .text(col.value, cx, metaY + 11, { width: metaColW - 8 });
    });

    // ── Coupon row if applicable ──
    let couponRowOffset = 0;
    if (order.couponCode) {
        const couponY = metaY + 30;
        doc.fillColor(BRAND.muted)
            .font("Helvetica")
            .fontSize(7.5)
            .text("Coupon Applied", MARGIN, couponY, { characterSpacing: 0.8 });
        doc.fillColor(BRAND.success)
            .font("Helvetica-Bold")
            .fontSize(9)
            .text(order.couponCode, MARGIN, couponY + 11);
        couponRowOffset = 32;
    }

    // ══════════════════════════════════════════════════════
    // 4. ITEMS TABLE
    // ══════════════════════════════════════════════════════
    const tableTop = metaY + 46 + couponRowOffset;

    // Table header background
    doc.rect(MARGIN, tableTop, CONTENT_W, 22).fill(BRAND.primary);

    const COLS = {
        sno: { x: MARGIN + 8, w: 28, align: "left" },
        name: { x: MARGIN + 44, w: 180, align: "left" },
        color: { x: MARGIN + 232, w: 70, align: "left" },
        qty: { x: MARGIN + 310, w: 40, align: "center" },
        price: { x: MARGIN + 358, w: 70, align: "right" },
        total: { x: MARGIN + 436, w: 77, align: "right" },
    };

    // Header labels
    doc.fillColor(BRAND.white).font("Helvetica-Bold").fontSize(8.5);
    doc.text("S.No", COLS.sno.x, tableTop + 7, {
        width: COLS.sno.w,
        align: COLS.sno.align,
    });
    doc.text("Item", COLS.name.x, tableTop + 7, {
        width: COLS.name.w,
        align: COLS.name.align,
    });
    doc.text("Color", COLS.color.x, tableTop + 7, {
        width: COLS.color.w,
        align: COLS.color.align,
    });
    doc.text("Qty", COLS.qty.x, tableTop + 7, {
        width: COLS.qty.w,
        align: COLS.qty.align,
    });
    doc.text("Price", COLS.price.x, tableTop + 7, {
        width: COLS.price.w,
        align: COLS.price.align,
    });
    doc.text("Amount", COLS.total.x, tableTop + 7, {
        width: COLS.total.w,
        align: COLS.total.align,
    });

    // Rows
    let rowY = tableTop + 22;

    order.items.forEach((item, idx) => {
        const isEven = idx % 2 === 0;
        const rowH = 24;

        // Alternating row bg
        if (isEven) {
            doc.rect(MARGIN, rowY, CONTENT_W, rowH).fill(BRAND.light);
        } else {
            doc.rect(MARGIN, rowY, CONTENT_W, rowH).fill(BRAND.white);
        }

        const rowAmount = item.price * item.quantity;

        doc.fillColor(BRAND.muted)
            .font("Helvetica")
            .fontSize(8.5)
            .text(String(idx + 1), COLS.sno.x, rowY + 7, {
                width: COLS.sno.w,
                align: "left",
            });

        doc.fillColor(BRAND.text)
            .font("Helvetica")
            .fontSize(8.5)
            .text(item.name || "—", COLS.name.x, rowY + 7, {
                width: COLS.name.w,
                align: "left",
                lineBreak: false,
            });

        // Color name with color swatch
        if (item.colorName) {
            // Color swatch
            if (item.colorHex) {
                doc.rect(COLS.color.x, rowY + 8, 10, 10)
                    .fillAndStroke(item.colorHex, "#ccc")
                    .lineWidth(0.5);
            }
            doc.fillColor(BRAND.text)
                .font("Helvetica")
                .fontSize(7.5)
                .text(
                    item.colorName,
                    COLS.color.x + (item.colorHex ? 14 : 0),
                    rowY + 7,
                    {
                        width: COLS.color.w - (item.colorHex ? 14 : 0),
                        align: "left",
                        lineBreak: false,
                    }
                );
        } else {
            doc.fillColor(BRAND.muted)
                .font("Helvetica")
                .fontSize(7.5)
                .text("—", COLS.color.x, rowY + 7, {
                    width: COLS.color.w,
                    align: "left",
                });
        }

        doc.fillColor(BRAND.text)
            .font("Helvetica")
            .fontSize(8.5)
            .text(String(item.quantity), COLS.qty.x, rowY + 7, {
                width: COLS.qty.w,
                align: "center",
            });

        doc.fillColor(BRAND.text)
            .font("Helvetica")
            .fontSize(8.5)
            .text(fmt(item.price), COLS.price.x, rowY + 7, {
                width: COLS.price.w,
                align: "right",
            });

        doc.fillColor(BRAND.text)
            .font("Helvetica-Bold")
            .fontSize(8.5)
            .text(fmt(rowAmount), COLS.total.x, rowY + 7, {
                width: COLS.total.w,
                align: "right",
            });

        rowY += rowH;
    });

    // Bottom border of table
    doc.rect(MARGIN, rowY, CONTENT_W, 1).fill(BRAND.border);
    rowY += 1;

    // ══════════════════════════════════════════════════════
    // 5. TOTALS BLOCK
    // ══════════════════════════════════════════════════════
    const totalsX = MARGIN + CONTENT_W - 230;
    const totalsW = 230;
    let totY = rowY + 14;

    const drawTotalRow = (
        label,
        value,
        bold = false,
        color = BRAND.text,
        bgColor = null
    ) => {
        if (bgColor) {
            doc.rect(totalsX - 10, totY - 4, totalsW + 10, 20).fill(bgColor);
        }
        doc.fillColor(bold ? BRAND.text : BRAND.muted)
            .font(bold ? "Helvetica-Bold" : "Helvetica")
            .fontSize(bold ? 10 : 9)
            .text(label, totalsX, totY, { width: 120 });
        doc.fillColor(color)
            .font(bold ? "Helvetica-Bold" : "Helvetica")
            .fontSize(bold ? 10 : 9)
            .text(value, totalsX + 120, totY, {
                width: totalsW - 120,
                align: "right",
            });
        totY += 20;
    };

    drawTotalRow("Subtotal", fmt(order.totalAmount));

    if (order.discountAmount > 0) {
        drawTotalRow(
            `Discount${order.couponCode ? ` (${order.couponCode})` : ""}`,
            `– ${fmt(order.discountAmount)}`,
            false,
            BRAND.success
        );
    }

    // Grand total box
    doc.rect(totalsX - 10, totY - 4, totalsW + 10, 24).fill(BRAND.primary);
    doc.fillColor(BRAND.white)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("TOTAL PAYABLE", totalsX, totY, { width: 120 })
        .text(fmt(order.finalAmount), totalsX + 120, totY, {
            width: totalsW - 120,
            align: "right",
        });

    totY += 30;

    // Amount in words (simple)
    const amountWords = numberToWords(Math.round(order.finalAmount));
    doc.fillColor(BRAND.muted)
        .font("Helvetica-Oblique")
        .fontSize(8)
        .text(`Amount in words: ${amountWords} Only`, totalsX - 10, totY, {
            width: totalsW + 10,
        });

    // ══════════════════════════════════════════════════════
    // 6. TRANSACTION ID & SHIPPING INFO
    // ══════════════════════════════════════════════════════
    const leftInfoY = rowY + 14;

    if (order.transactionId) {
        doc.fillColor(BRAND.muted)
            .font("Helvetica")
            .fontSize(8)
            .text("Transaction ID", MARGIN, leftInfoY)
            .font("Helvetica-Bold")
            .fillColor(BRAND.text)
            .text(order.transactionId, MARGIN, leftInfoY + 12, { width: 250 });
    }

    if (order.shippingDetails?.trackingNumber) {
        const trackY = order.transactionId ? leftInfoY + 32 : leftInfoY;
        doc.fillColor(BRAND.muted)
            .font("Helvetica")
            .fontSize(8)
            .text("Tracking Details", MARGIN, trackY);

        const trackingInfo = [
            order.shippingDetails.courierName
                ? `Courier: ${order.shippingDetails.courierName}`
                : null,
            order.shippingDetails.trackingNumber
                ? `AWB: ${order.shippingDetails.trackingNumber}`
                : null,
        ]
            .filter(Boolean)
            .join(" | ");

        doc.font("Helvetica-Bold")
            .fillColor(BRAND.text)
            .fontSize(8)
            .text(trackingInfo, MARGIN, trackY + 12, { width: 250 });
    }

    // ══════════════════════════════════════════════════════
    // 7. FOOTER BAND
    // ══════════════════════════════════════════════════════
    const footerY = H - 80;

    // Thin green bar above footer
    doc.rect(0, footerY - 4, W, 2).fill(BRAND.accent);
    doc.rect(0, footerY - 1, W, 81).fill(BRAND.primary);

    // Declaration text
    doc.fillColor("rgba(255,255,255,0.7)")
        .font("Helvetica")
        .fontSize(7.5)
        .text(
            "This is a computer generated invoice and does not require a physical signature. " +
                "All prices are inclusive of applicable taxes. " +
                "For any queries, please contact us at " +
                (process.env.COMPANY_EMAIL || "support@greenfibre.com"),
            MARGIN,
            footerY + 8,
            { width: CONTENT_W, align: "center" }
        );

    // Authorized signatory (right)
    doc.fillColor(BRAND.white)
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text("Authorized Signatory", W - MARGIN - 140, footerY + 28, {
            width: 140,
            align: "center",
        });

    doc.fillColor("rgba(255,255,255,0.5)")
        .font("Helvetica")
        .fontSize(7)
        .text(
            `For ${process.env.COMPANY_NAME || "Green Fibre"}`,
            W - MARGIN - 140,
            footerY + 42,
            { width: 140, align: "center" }
        );

    // Copyright (center-left)
    doc.fillColor("rgba(255,255,255,0.4)")
        .font("Helvetica")
        .fontSize(7)
        .text(
            `© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || "Green Fibre"} · All rights reserved`,
            MARGIN,
            footerY + 42,
            { width: 260 }
        );

    // ══════════════════════════════════════════════════════
    // 8. WATERMARK (light) — only if unpaid
    // ══════════════════════════════════════════════════════
    if (order.paymentStatus !== "paid") {
        doc.save();
        doc.rotate(-45, { origin: [W / 2, H / 2] });
        doc.fillColor("rgba(200,0,0,0.08)")
            .font("Helvetica-Bold")
            .fontSize(90)
            .text("UNPAID", 0, H / 2 - 60, { width: W, align: "center" });
        doc.restore();
    }

    doc.end();

    // Wait for PDF to finish writing
    await new Promise((resolve, reject) => {
        doc.on("finish", resolve);
        doc.on("error", reject);
    });

    // Upload to MinIO but KEEP local file for email attachment
    try {
        const uploaded = await uploadPdfToCloudinary(
            filePath,
            `invoice-${order._id.toString()}`
        );

        return {
            localPath: filePath, // for email attachment
            invoiceUrl: uploaded.secure_url, // for database storage
        };
    } catch (error) {
        console.error("Error uploading invoice to Cloudinary:", error);

        return {
            localPath: filePath,
            invoiceUrl: null,
        };
    }
};

// ── Minimal number-to-words ────────────────────────────────────
function numberToWords(n) {
    if (n === 0) return "Zero Rupees";
    const ones = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
    ];
    const tens = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
    ];

    function convert(num) {
        if (num < 20) return ones[num];
        if (num < 100)
            return (
                tens[Math.floor(num / 10)] +
                (num % 10 ? " " + ones[num % 10] : "")
            );
        if (num < 1000)
            return (
                ones[Math.floor(num / 100)] +
                " Hundred" +
                (num % 100 ? " " + convert(num % 100) : "")
            );
        if (num < 100000)
            return (
                convert(Math.floor(num / 1000)) +
                " Thousand" +
                (num % 1000 ? " " + convert(num % 1000) : "")
            );
        if (num < 10000000)
            return (
                convert(Math.floor(num / 100000)) +
                " Lakh" +
                (num % 100000 ? " " + convert(num % 100000) : "")
            );
        return (
            convert(Math.floor(num / 10000000)) +
            " Crore" +
            (num % 10000000 ? " " + convert(num % 10000000) : "")
        );
    }

    return convert(n) + " Rupees";
}

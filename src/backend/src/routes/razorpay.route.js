import express from "express";
import {
    createRazorpayOrder,
    verifyRazorpayPayment,
} from "../controllers/razorpay.controller.js";
import { optionalAuthMiddleware } from "../middlewares/auth.middleware.js";
import { getRazorpayKeyId } from "../config/razorpay.js";

const router = express.Router();

// Direct specification endpoints:
// POST /api/create-order
router.post("/create-order", optionalAuthMiddleware, createRazorpayOrder);

// POST /api/verify-payment
router.post("/verify-payment", optionalAuthMiddleware, verifyRazorpayPayment);

// Standalone real test payment HTML interface for gateway verification (₹5.00 real transaction)
router.get("/test-payment", (req, res) => {
    const keyId = getRazorpayKeyId() || "rzp_live_TXVnl7XtdLZsws";
    res.removeHeader("Content-Security-Policy");
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GreenFibre — Live ₹5.00 UPI & Card Payment Verification</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f8fafc 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      max-width: 500px;
      width: 100%;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(16, 185, 129, 0.15), 0 10px 20px -5px rgba(0,0,0,0.04);
      padding: 36px;
      border: 1px solid #d1fae5;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #dcfce7;
      color: #15803d;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 14px;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 0 2px #bbf7d0;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
    }
    p.subtitle {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .amount-card {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      color: white;
      border-radius: 18px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
      box-shadow: 0 10px 20px -5px rgba(22, 163, 74, 0.3);
    }
    .amount-label {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.9;
      font-weight: 600;
    }
    .amount-value {
      font-size: 42px;
      font-weight: 900;
      margin: 6px 0;
      letter-spacing: -1px;
    }
    .amount-note {
      font-size: 12px;
      opacity: 0.85;
    }
    .info-list {
      background: #f8fafc;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }
    .info-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
    }
    .info-item:not(:last-child) {
      border-bottom: 1px dashed #e2e8f0;
    }
    .btn-pay {
      background: #0f172a;
      color: #ffffff;
      border: none;
      width: 100%;
      padding: 18px;
      border-radius: 16px;
      font-size: 17px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.2s;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3);
    }
    .btn-pay:hover {
      background: #1e293b;
      transform: translateY(-1px);
    }
    .btn-pay:active {
      transform: translateY(0);
    }
    .btn-pay:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .status-box {
      margin-top: 24px;
      padding: 20px;
      border-radius: 16px;
      display: none;
      line-height: 1.6;
      font-size: 14px;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .status-success {
      background: #ecfdf5;
      border: 2px solid #34d399;
      color: #065f46;
    }
    .status-error {
      background: #fef2f2;
      border: 1.5px solid #fecaca;
      color: #991b1b;
    }
    .key-badge {
      font-family: monospace;
      font-size: 11px;
      color: #64748b;
      text-align: center;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div style="text-align: center;">
      <div class="badge">
        <span class="badge-dot"></span>
        Razorpay Live Production Mode
      </div>
      <h1>Real Payment Verification</h1>
      <p class="subtitle">Complete a real ₹5.00 transaction via UPI or Card to verify bank settlement and live checkout flow.</p>
    </div>

    <div class="amount-card">
      <div class="amount-label">Transaction Amount</div>
      <div class="amount-value">₹5.00</div>
      <div class="amount-note">Money will be credited directly to your Razorpay account</div>
    </div>

    <div class="info-list">
      <div class="info-item">
        <span>⚡</span>
        <span><strong>UPI Available:</strong> Scan QR code or pay with PhonePe, GPay, Paytm</span>
      </div>
      <div class="info-item">
        <span>💳</span>
        <span><strong>Cards Available:</strong> Any real Debit/Credit card with bank OTP</span>
      </div>
      <div class="info-item">
        <span>🏦</span>
        <span><strong>Settlement:</strong> Viewable in Razorpay Dashboard under Payments</span>
      </div>
    </div>

    <button id="pay-btn" class="btn-pay" type="button">
      🚀 Pay ₹5.00 Real Transaction
    </button>

    <div id="status" class="status-box"></div>

    <div class="key-badge">
      Live Key: <strong>${keyId}</strong>
    </div>
  </div>

  <script>
    function loadRazorpaySdk() {
      return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    }

    async function startLivePayment() {
      const btn = document.getElementById("pay-btn");
      const box = document.getElementById("status");

      btn.disabled = true;
      btn.innerText = "⏳ Loading Checkout...";
      box.style.display = "none";

      try {
        const sdkLoaded = await loadRazorpaySdk();
        if (!sdkLoaded || !window.Razorpay) {
          throw new Error("Unable to load Razorpay SDK. Please check your network or ad-blocker.");
        }

        btn.innerText = "⏳ Creating Live Order...";

        const orderRes = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 500, // 500 paise = ₹5.00
            currency: "INR",
            receipt: "real_live_5rs_" + Date.now(),
            notes: {
              purpose: "Real ₹5.00 Gateway Live Verification",
              client: "GreenFibre"
            }
          })
        });

        const orderData = await orderRes.json();
        if (!orderData.success || !orderData.order_id) {
          throw new Error(orderData.message || "Failed to create live order on server");
        }

        btn.innerText = "Opening Live Razorpay Modal...";

        const options = {
          key: "${keyId}",
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Green Fibre",
          description: "Live Gateway Verification (₹5.00)",
          order_id: orderData.order_id,
          prefill: {
            name: "GreenFibre Customer",
            email: "support@greenfibre.org",
            contact: "9999999999"
          },
          theme: {
            color: "#16a34a"
          },
          modal: {
            confirm_close: true,
            ondismiss: function() {
              btn.disabled = false;
              btn.innerText = "🚀 Pay ₹5.00 Real Transaction";
            }
          },
          handler: async function(response) {
            btn.innerText = "⏳ Verifying Live Signature...";
            try {
              const verifyRes = await fetch("/api/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                box.className = "status-box status-success";
                box.style.display = "block";
                box.innerHTML = '🎉 <strong style="font-size: 16px;">Real Payment Successful & Verified!</strong><br><br>' +
                  '• <strong>Amount:</strong> ₹5.00 INR<br>' +
                  '• <strong>Payment ID:</strong> <code>' + response.razorpay_payment_id + '</code><br>' +
                  '• <strong>Order ID:</strong> <code>' + response.razorpay_order_id + '</code><br><br>' +
                  '💰 <strong>The money is successfully credited to your Razorpay account!</strong><br>' +
                  'Check your <a href="https://dashboard.razorpay.com/app/payments" target="_blank" style="color:#15803d; font-weight:700; text-decoration:underline;">Razorpay Dashboard &gt; Payments</a> to see the live transaction and settlement details.';
                btn.innerText = "✅ ₹5.00 Payment Completed!";
              } else {
                throw new Error(verifyData.message || "Signature verification failed");
              }
            } catch (vErr) {
              box.className = "status-box status-error";
              box.style.display = "block";
              box.innerHTML = '❌ <strong>Verification Error:</strong> ' + vErr.message;
              btn.disabled = false;
              btn.innerText = "Retry Payment";
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function(failRes) {
          btn.disabled = false;
          btn.innerText = "🚀 Pay ₹5.00 Real Transaction";
          box.className = "status-box status-error";
          box.style.display = "block";
          box.innerHTML = '❌ <strong>Payment Failed or Cancelled:</strong> ' + (failRes.error.description || "Transaction failed");
        });

        rzp.open();
      } catch (err) {
        btn.disabled = false;
        btn.innerText = "🚀 Pay ₹5.00 Real Transaction";
        box.className = "status-box status-error";
        box.style.display = "block";
        box.innerHTML = '❌ <strong>Error:</strong> ' + err.message;
      }
    }

    document.addEventListener("DOMContentLoaded", function() {
      const btn = document.getElementById("pay-btn");
      if (btn) {
        btn.addEventListener("click", startLivePayment);
      }
    });
  </script>
</body>
</html>`);
});

export default router;

import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

let fetchMyOrdersSeq = 0;

const useOrderStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  orders: [],
  myOrders: [],
  singleOrder: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  currentOrderId: null,
  paymentData: null,
  easebuzzUrl: null,
  loading: false,
  actionLoading: false,
  initialized: false,
  fetchError: null,

  // =========================
  // CREATE ORDER (User)
  // POST /api/order/create
  // =========================
  createOrder: async (orderData) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/order/create", orderData);

      set({
        paymentData: res.data.paymentData || null,
        easebuzzUrl: res.data.paymentUrl || res.data.easebuzzUrl || null,
        currentOrderId: res.data.order._id,
        actionLoading: false,
      });

      toast.success("Order created successfully");
      return res.data;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create order");
      set({ actionLoading: false });
      return null;
    }
  },

  // =========================
  // RAZORPAY - CREATE ORDER
  // POST /api/create-order
  // =========================
  createRazorpayOrder: async ({
    amount,
    currency = "INR",
    receipt,
    orderId,
    notes,
    shippingAddress,
    couponCode,
    pointsToRedeem,
    ...rest
  }) => {
    try {
      set({ actionLoading: true });
      const res = await api.post("/create-order", {
        amount,
        currency,
        receipt,
        orderId,
        notes,
        shippingAddress,
        couponCode,
        pointsToRedeem,
        ...rest,
      });
      set({ actionLoading: false });
      return res.data;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create Razorpay order");
      set({ actionLoading: false });
      return null;
    }
  },

  // =========================
  // RAZORPAY - VERIFY PAYMENT
  // POST /api/verify-payment
  // =========================
  verifyRazorpayPayment: async (paymentData) => {
    try {
      set({ actionLoading: true });
      const res = await api.post("/verify-payment", paymentData);
      set({ actionLoading: false });

      // 1. Pending confirmation (HTTP 202 or pending === true)
      if (res.status === 202 || res.data?.pending === true) {
        return {
          outcome: "PENDING",
          success: false,
          pending: true,
          message:
            res.data?.message || "Payment received, confirmation in progress",
          orderId: res.data?.orderId,
          data: res.data,
        };
      }

      // 2. Verified success (HTTP 200)
      if (res.data?.success) {
        return {
          outcome: "SUCCESS",
          success: true,
          orderId: res.data.orderId,
          pointsEarned: res.data.pointsEarned,
          newRewardBalance: res.data.newRewardBalance,
          data: res.data,
        };
      }

      // HTTP 200 with success: false (non-pending validation rejection)
      return {
        outcome: "HARD_FAILURE",
        success: false,
        hardFailure: true,
        message: res.data?.message || "Payment verification failed",
        data: res.data,
      };
    } catch (error) {
      set({ actionLoading: false });

      const isAxios = Boolean(error?.isAxiosError || error?.request);

      // Plain JS error (not an Axios network or HTTP error)
      if (!isAxios) {
        console.error("verifyRazorpayPayment unexpected JS error:", error);
        return {
          outcome: "CLIENT_ERROR",
          success: false,
          clientError: true,
          message: error?.message || "An unexpected error occurred",
          error,
        };
      }

      const status = error.response?.status;
      const data = error.response?.data;

      // Backend responded with 202 via an error interceptor/adapter
      if (status === 202 || data?.pending === true) {
        return {
          outcome: "PENDING",
          success: false,
          pending: true,
          message:
            data?.message || "Payment received, confirmation in progress",
          orderId: data?.orderId,
          data,
        };
      }

      // HARD FAILURE: only HTTP 400
      if (status === 400) {
        const msg = data?.message || "";
        const code = data?.code || (
          msg.includes("mismatch") ? "AMOUNT_MISMATCH" :
          msg.includes("validation failed") ? "PAYMENT_VALIDATION_FAILED" : null
        );
        const isSignatureError = msg.toLowerCase().includes("signature") || (!code && msg.toLowerCase().includes("invalid"));

        return {
          outcome: isSignatureError ? "SIGNATURE_FAILED" : (code ? "VALIDATION_FAILED" : "HARD_FAILURE"),
          success: false,
          hardFailure: true,
          isSignatureError,
          isValidationMismatch: Boolean(code),
          code,
          message: msg || "Payment verification failed",
          error,
        };
      }

      // UNKNOWN OUTCOME:
      // Network error (!error.response), timeout (ECONNABORTED, 408),
      // HTTP 5xx (500, 502, 503, 504), 429, 404, 401, 403, etc.
      return {
        outcome: "UNKNOWN_OUTCOME",
        success: false,
        unknownOutcome: true,
        status: status || null,
        message:
          "If money was deducted, do not pay again. Check My Orders or contact support.",
        error,
      };
    }
  },



  // =========================
  // VERIFY PAYMENT
  // POST /api/order/verify
  // =========================
  verifyPayment: async (paymentResponse) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/order/verify", paymentResponse);

      set({ actionLoading: false });

      if (res.data.success) {
        toast.success("Payment verified successfully");
        return {
          success: true,
          orderId: res.data.orderId,
          pointsEarned: res.data.pointsEarned,
          newRewardBalance: res.data.newRewardBalance,
          data: res.data,
        };
      } else {
        toast.error("Payment verification failed");
        return { success: false, orderId: res.data.orderId };
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Payment verification failed",
      );
      set({ actionLoading: false });
      return { success: false };
    }
  },

  // =========================
  // FETCH MY ORDERS (User)
  // GET /api/order/my-orders
  // =========================
  fetchMyOrders: async (params = {}, options = {}) => {
    const seq = ++fetchMyOrdersSeq;
    const { silent = false } = options;
    try {
      if (!silent) {
        set({ loading: true, fetchError: null });
      }

      const { page = 1, limit = 10, status } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
      });

      const res = await api.get(`/order/my-orders?${queryParams}`);

      // Stale-fetch guard: discard out-of-order response
      if (seq !== fetchMyOrdersSeq) {
        return false;
      }

      set({
        myOrders: res.data.orders || [],
        pagination: res.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
        loading: false,
        initialized: true,
      });

      return true;
    } catch (error) {
      if (seq !== fetchMyOrdersSeq) {
        return false;
      }
      const msg = error?.response?.data?.message || "Failed to fetch orders";
      if (!silent) {
        toast.error(msg);
        set({ loading: false, initialized: true, fetchError: msg });
      }
      return false;
    }
  },

  // =========================
  // FETCH ALL ORDERS (Admin)
  // GET /api/order/admin
  // =========================
  fetchAllOrders: async (params = {}) => {
    try {
      set({ loading: true });

      const { page = 1, limit = 20, status, search } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(search && { search }),
      });

      const res = await api.get(`/order/admin?${queryParams}`);

      set({
        orders: res.data.orders || [],
        pagination: res.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
        loading: false,
      });

      return true;
    } catch (error) {
      toast.error("Failed to fetch orders");
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // GET SINGLE ORDER
  // GET /api/order/:orderId
  // =========================
  getSingleOrder: async (orderId) => {
    try {
      set({ loading: true });

      const res = await api.get(`/order/${orderId}`);

      set({
        singleOrder: res.data.order,
        loading: false,
      });

      return res.data.order;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch order");
      set({ loading: false });
      return null;
    }
  },

  // =========================
  // UPDATE ORDER STATUS (Admin)
  // PATCH /api/order/status/:orderId
  // =========================
  updateOrderStatus: async (orderId, statusData) => {
    try {
      set({ actionLoading: true });

      const res = await api.patch(`/order/status/${orderId}`, statusData);

      const updated = res.data.order;

      // Update in orders list
      set({
        orders: get().orders.map((o) => (o._id === orderId ? updated : o)),
        myOrders: get().myOrders.map((o) => (o._id === orderId ? updated : o)),
        singleOrder:
          get().singleOrder?._id === orderId ? updated : get().singleOrder,
        actionLoading: false,
      });

      toast.success("Order status updated successfully");
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // VALIDATE COUPON
  // POST /api/coupons/validate
  // =========================
  validateCoupon: async (code, cartTotal) => {
    try {
      const res = await api.post("/coupons/validate", {
        code,
        cartTotal,
      });

      if (res.data.success) {
        toast.success("Coupon applied successfully!");
        return {
          success: true,
          discountAmount: res.data.discountAmount,
          finalAmount: res.data.finalAmount,
        };
      }
      return { success: false };
    } catch (error) {
      toast.error(error?.response?.data?.message || "Invalid coupon");
      return { success: false };
    }
  },

  // =========================
  // HELPERS
  // =========================

  // Reset orders cache (call on logout / user-switch to prevent data leaking between sessions)
  resetOrders: () => {
    set({
      myOrders: [],
      initialized: false,
      fetchError: null,
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    });
  },

  // Clear payment state after successful payment
  clearPaymentState: () => {
    set({
      currentOrderId: null,
      paymentData: null,
      easebuzzUrl: null,
    });
  },

  // Clear single order
  clearSingleOrder: () => {
    set({ singleOrder: null });
  },

  // Get order by ID from state
  getOrderById: (orderId) => {
    return (
      get().orders.find((o) => o._id === orderId) ||
      get().myOrders.find((o) => o._id === orderId) ||
      null
    );
  },

  // Get orders by status
  getOrdersByStatus: (status) => {
    return get().orders.filter((o) => o.orderStatus === status);
  },

  // Count orders by status
  getOrderCountByStatus: (status) => {
    return get().orders.filter((o) => o.orderStatus === status).length;
  },
}));

export default useOrderStore;
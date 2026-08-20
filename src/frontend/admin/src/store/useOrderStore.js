import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

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

  // =========================
  // CREATE ORDER (User)
  // POST /api/order/create
  // =========================
  createOrder: async (orderData) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/order/create", orderData);

      set({
        paymentData: res.data.paymentData,
        easebuzzUrl: res.data.easebuzzUrl,
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
        return { success: true, orderId: res.data.orderId };
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
  fetchMyOrders: async (params = {}) => {
    try {
      set({ loading: true });

      const { page = 1, limit = 10, status } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
      });

      const res = await api.get(`/order/my-orders?${queryParams}`);

      set({
        myOrders: res.data.orders || [],
        pagination: res.data.pagination || {
          page: 1,
          limit: 10,
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
     
      console.log(res.data.orders)
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
  // POST /api/coupon/validate
  // =========================
  validateCoupon: async (code, cartTotal) => {
    try {
      const res = await api.post("/coupon/validate", {
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
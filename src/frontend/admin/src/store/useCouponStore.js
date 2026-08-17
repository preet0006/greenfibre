import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const useCouponStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  coupons: [],
  loading: false,
  actionLoading: false,

  // =========================
  // FETCH ALL COUPONS (Admin)
  // GET /api/coupons/all
  // =========================
  fetchCoupons: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/coupons/all");

      set({
        coupons: res.data.coupons || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // CREATE COUPON (Admin)
  // POST /api/coupons/create
  // =========================
  createCoupon: async (formData) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/coupons/create", formData);

      set({
        coupons: [res.data.coupon, ...get().coupons],
        actionLoading: false,
      });

      toast.success("Coupon created successfully");
      return true;
    } catch (error) {
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // TOGGLE COUPON STATUS
  // PATCH /api/coupons/toggle-status/:couponId
  // =========================
  toggleCouponStatus: async (couponId) => {
    try {
      const res = await api.patch(`/coupons/toggle-status/${couponId}`);

      set({
        coupons: get().coupons.map((coupon) =>
          coupon._id === couponId
            ? { ...coupon, isActive: res.data.isActive }
            : coupon,
        ),
      });

      toast.success("Coupon status updated");
      return true;
    } catch (error) {
      return false;
    }
  },

  // =========================
  // DELETE COUPON (Admin)
  // DELETE /api/coupons/delete/:couponId
  // =========================
  deleteCoupon: async (couponId) => {
    try {
      await api.delete(`/coupons/delete/${couponId}`);

      set({
        coupons: get().coupons.filter((coupon) => coupon._id !== couponId),
      });

      toast.success("Coupon deleted successfully");
      return true;
    } catch (error) {
      return false;
    }
  },

  // =========================
  // VALIDATE COUPON (User Side)
  // POST /api/coupons/validate
  // =========================
  validateCoupon: async (data) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/coupons/validate", data);

      set({ actionLoading: false });

      return res.data; // contains discountAmount & finalAmount
    } catch (error) {
      set({ actionLoading: false });
      return null;
    }
  },
}));

export default useCouponStore;

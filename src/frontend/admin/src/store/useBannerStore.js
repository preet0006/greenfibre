import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const useBannerStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  banners: [],
  loading: false,
  actionLoading: false,

  // =========================
  // FETCH BANNERS (Public/Admin)
  // GET /api/banners
  // =========================
  fetchBanners: async (category = "") => {
    try {
      set({ loading: true });

      const res = await api.get("/banners", {
        params: category ? { category } : {},
      });

      set({
        banners: res.data.banners || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // CREATE BANNER (Admin)
  // POST /api/banners/create
  // =========================
  createBanner: async (formData) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/banners/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({
        banners: [...get().banners, res.data.banner],
        actionLoading: false,
      });

      toast.success("Banner created successfully");
      return true;
    } catch (error) {
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // TOGGLE BANNER STATUS
  // PATCH /api/banners/toggle-status/:bannerId
  // =========================
  toggleBannerStatus: async (bannerId) => {
    try {
      const res = await api.patch(`/banners/toggle-status/${bannerId}`);

      set({
        banners: get().banners.map((banner) =>
          banner._id === bannerId
            ? { ...banner, isActive: res.data.isActive }
            : banner,
        ),
      });

      toast.success("Banner status updated");
      return true;
    } catch (error) {
      return false;
    }
  },

  swapBannerOrder: async (sourceId, targetId) => {
    try {
      await api.post("/banners/swap-order", {
        sourceId,
        targetId,
      });

      // refresh list
      await get().fetchBanners();

      return true;
    } catch (error) {
      return false;
    }
  },

  // =========================
  // DELETE BANNER
  // DELETE /api/banners/delete/:bannerId
  // =========================
  deleteBanner: async (bannerId) => {
    try {
      await api.delete(`/banners/delete/${bannerId}`);

      set({
        banners: get().banners.filter((banner) => banner._id !== bannerId),
      });

      toast.success("Banner deleted successfully");
      return true;
    } catch (error) {
      return false;
    }
  },
}));

export default useBannerStore;

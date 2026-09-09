import { create } from "zustand";
import api from "@/lib/axios";

const useDashboardStore = create((set) => ({
  // =========================
  // STATE
  // =========================
  stats: null, // { revenue, orders, users, products }
  recentOrders: [],
  loading: false,

  // =========================
  // FETCH DASHBOARD STATS
  // GET /api/dashboard/stats
  // =========================
  fetchDashboardStats: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/dashboard/stats");

      set({
        stats: res.data.stats,
        recentOrders: res.data.recentOrders || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },
}));

export default useDashboardStore;

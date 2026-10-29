import { create } from "zustand";
import api from "@/lib/axios";

const useRewardStore = create((set, get) => ({
  balance: 0,
  history: [],
  config: {
    earn_percent: 2.5,
    direct_percent: 15.0,
    coupon_percent: 2.5,
    point_value: 1,
    max_redeem_percent: 2.5,
    min_order_value: 0,
    expiry_days: 0,
  },
  hasCompletedFirstOrder: false,
  firstOrderCoupon: null,
  loading: false,
  enabled: true,
  drawerOpen: false,
  animatingPoints: null,
  badgeRef: null,

  setBadgeRef: (ref) => set({ badgeRef: ref }),

  setDrawerOpen: (open) => set({ drawerOpen: open }),

  setBalance: (newBalance) => set({ balance: Number(newBalance) || 0 }),

  triggerCoinAnimation: (points) => {
    set({ animatingPoints: Number(points) || 0 });
  },

  clearCoinAnimation: () => {
    set({ animatingPoints: null });
  },

  fetchRewardsSummary: async () => {
    try {
      set({ loading: true });
      const res = await api.get("/rewards/summary");
      if (res.data?.enabled === false) {
        set({ enabled: false, loading: false });
        return null;
      }

      set({
        balance: res.data.balance || 0,
        history: res.data.history || [],
        config: res.data.config || get().config,
        hasCompletedFirstOrder: Boolean(res.data.hasCompletedFirstOrder),
        firstOrderCoupon: res.data.firstOrderCoupon || null,
        enabled: true,
        loading: false,
      });

      return res.data;
    } catch (error) {
      set({ loading: false });
      return null;
    }
  },

  previewRedemption: async (cartTotal, pointsToRedeem) => {
    try {
      const res = await api.post("/rewards/redeem-preview", {
        cartTotal,
        pointsToRedeem,
      });
      return res.data;
    } catch (error) {
      return {
        enabled: false,
        allowed: 0,
        discountAmount: 0,
        reason: error?.response?.data?.message || "Failed to calculate redemption",
      };
    }
  },
}));

export default useRewardStore;

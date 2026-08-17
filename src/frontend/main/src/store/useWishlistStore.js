import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const useWishlistStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  wishlist: [],
  loading: false,
  actionLoading: false,

  // =========================
  // FETCH WISHLIST
  // =========================
  fetchWishlist: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/wishlist");

      set({
        wishlist: res.data.products || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      toast.error("Failed to fetch wishlist");
      return false;
    }
  },

  // =========================
  // TOGGLE WISHLIST (MAIN)
  // =========================
  toggleWishlist: async (productId) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/wishlist/toggle", { productId });

      const { isWishlisted, message } = res.data;

      // =========================
      // OPTIMISTIC UI UPDATE
      // =========================
      if (isWishlisted) {
        // Add product (lightweight placeholder, will sync later)
        set({
          wishlist: [...get().wishlist, { _id: productId }],
        });
      } else {
        // Remove product
        set({
          wishlist: get().wishlist.filter((item) => item._id !== productId),
        });
      }

      set({ actionLoading: false });

      toast.success(message);
      return true;
    } catch (error) {
      set({ actionLoading: false });
      toast.error("Wishlist update failed");
      return false;
    }
  },

  // =========================
  // REMOVE (OPTIONAL)
  // =========================
  removeFromWishlist: async (productId) => {
    try {
      await api.delete(`/wishlist/remove/${productId}`);

      set({
        wishlist: get().wishlist.filter((item) => item._id !== productId),
      });

      toast.success("Removed from wishlist");
      return true;
    } catch (error) {
      toast.error("Remove failed");
      return false;
    }
  },

  // =========================
  // HELPER: CHECK IF WISHLISTED
  // =========================
  isWishlisted: (productId) => {
    return get().wishlist.some((item) => item._id === productId);
  },
}));

export default useWishlistStore;
import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const useCartStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  cart: null,
  items: [],
  allCarts: [],
  totalAmount: 0,
  loading: false,
  actionLoading: false,

  // =========================
  // FETCH CART
  // =========================
  fetchCart: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/cart");

      const cartData = res.data.cart;

      if (!cartData) {
        set({
          cart: null,
          items: [],
          totalAmount: 0,
          loading: false,
        });
        return true;
      }

      set({
        cart: cartData,
        items: cartData.items || [],
        totalAmount: cartData.totalAmount || 0,
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // ADD TO CART
  // =========================
  addToCart: async ({ productId, colorIndex, quantity }) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/cart/add", {
        productId,
        colorIndex,
        quantity,
      });

      const cartData = res.data.cart;

      set({
        cart: cartData,
        items: cartData.items,
        totalAmount: cartData.totalAmount,
        actionLoading: false,
      });

      toast.success("Added to cart");
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Add to cart failed");
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // UPDATE CART ITEM
  // =========================
  updateCartItem: async ({ productId, colorIndex, quantity }) => {
    try {
      set({ actionLoading: true });

      const res = await api.patch("/cart/update", {
        productId,
        colorIndex,
        quantity,
      });

      const cartData = res.data.cart;

      set({
        cart: cartData,
        items: cartData.items,
        totalAmount: cartData.totalAmount,
        actionLoading: false,
      });

      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed");
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // REMOVE CART ITEM
  // =========================
  removeCartItem: async (productId, colorIndex) => {
    try {
      set({ actionLoading: true });

      const res = await api.delete(
        `/cart/remove/${productId}?colorIndex=${colorIndex}`,
      );

      const cartData = res.data.cart;

      set({
        cart: cartData,
        items: cartData.items,
        totalAmount: cartData.totalAmount,
        actionLoading: false,
      });

      toast.success("Item removed");
      return true;
    } catch (error) {
      toast.error("Remove failed");
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // CLEAR CART
  // =========================
  clearCart: async () => {
    try {
      set({ actionLoading: true });

      await api.delete("/cart/clear");

      set({
        cart: null,
        items: [],
        totalAmount: 0,
        actionLoading: false,
      });

      toast.success("Cart cleared");
      return true;
    } catch (error) {
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // ADMIN - ALL CARTS
  // =========================
  fetchAllCarts: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/cart/all");

      set({
        allCarts: res.data.carts || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // HELPERS
  // =========================

  getCartCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getItemQuantity: (productId, colorIndex) => {
    const item = get().items.find(
      (i) => i.product._id === productId && i.colorIndex === colorIndex,
    );
    return item ? item.quantity : 0;
  },
}));

export default useCartStore;
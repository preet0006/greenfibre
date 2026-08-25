import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import useUserStore from "@/store/useUserStore";
import {
  buildGuestItem,
  calcGuestTotal,
  clearGuestCartStorage,
  loadGuestCart,
  saveGuestCart,
} from "@/lib/guestCart";

const isLoggedIn = () => Boolean(useUserStore.getState().user);

const useCartStore = create((set, get) => ({
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

      if (!isLoggedIn()) {
        const guest = loadGuestCart();
        set({
          cart: guest,
          items: guest.items,
          totalAmount: guest.totalAmount,
          loading: false,
        });
        return true;
      }

      const res = await api.get("/cart");
      const cartData = res.data?.cart || (res.data?.items ? res.data : null);

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
      // Fall back to guest cart on auth failure
      if (error?.response?.status === 401) {
        const guest = loadGuestCart();
        set({
          cart: guest,
          items: guest.items,
          totalAmount: guest.totalAmount,
          loading: false,
        });
        return true;
      }
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // ADD TO CART
  // =========================
  addToCart: async ({ productId, colorIndex = 0, quantity = 1, product }) => {
    try {
      set({ actionLoading: true });

      if (!isLoggedIn()) {
        const guest = loadGuestCart();
        const items = [...guest.items];
        const existing = items.find(
          (i) =>
            String(i.product?._id || i.productId) === String(productId) &&
            Number(i.colorIndex) === Number(colorIndex),
        );

        if (existing) {
          existing.quantity = (Number(existing.quantity) || 0) + Number(quantity);
        } else {
          if (!product) {
            // Fetch product snapshot for display
            const res = await api.get(`/product/${productId}`);
            product = res.data.product;
          }
          items.push(
            buildGuestItem({
              product,
              productId,
              colorIndex,
              quantity,
            }),
          );
        }

        const next = {
          items,
          totalAmount: calcGuestTotal(items),
        };
        saveGuestCart(next);
        set({
          cart: next,
          items: next.items,
          totalAmount: next.totalAmount,
          actionLoading: false,
        });
        toast.success("Added to cart");
        return true;
      }

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
      // If API says unauthorized, treat as guest
      if (error?.response?.status === 401) {
        set({ actionLoading: false });
        useUserStore.setState({ user: null });
        return get().addToCart({ productId, colorIndex, quantity, product });
      }
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

      if (!isLoggedIn()) {
        const guest = loadGuestCart();
        const items = guest.items
          .map((i) => {
            if (
              String(i.product?._id || i.productId) === String(productId) &&
              Number(i.colorIndex) === Number(colorIndex)
            ) {
              return { ...i, quantity: Number(quantity) };
            }
            return i;
          })
          .filter((i) => i.quantity > 0);

        const next = { items, totalAmount: calcGuestTotal(items) };
        saveGuestCart(next);
        set({
          cart: next,
          items: next.items,
          totalAmount: next.totalAmount,
          actionLoading: false,
        });
        return true;
      }

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

      if (!isLoggedIn()) {
        const guest = loadGuestCart();
        const items = guest.items.filter(
          (i) =>
            !(
              String(i.product?._id || i.productId) === String(productId) &&
              Number(i.colorIndex) === Number(colorIndex)
            ),
        );
        const next = { items, totalAmount: calcGuestTotal(items) };
        saveGuestCart(next);
        set({
          cart: next,
          items: next.items,
          totalAmount: next.totalAmount,
          actionLoading: false,
        });
        toast.success("Item removed");
        return true;
      }

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

      if (!isLoggedIn()) {
        clearGuestCartStorage();
        set({
          cart: null,
          items: [],
          totalAmount: 0,
          actionLoading: false,
        });
        toast.success("Cart cleared");
        return true;
      }

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

  resetLocalCart: () => {
    // On logout: show guest cart (if any), don't wipe guest storage
    const guest = loadGuestCart();
    set({
      cart: guest,
      items: guest.items,
      totalAmount: guest.totalAmount,
    });
  },

  // =========================
  // MERGE GUEST → USER CART
  // =========================
  mergeGuestCartOnLogin: async () => {
    const guest = loadGuestCart();
    if (!guest.items.length) {
      await get().fetchCart();
      return true;
    }

    try {
      const payload = guest.items.map((i) => ({
        productId: i.product?._id || i.productId,
        colorIndex: Number(i.colorIndex) || 0,
        quantity: Number(i.quantity) || 1,
      }));

      const res = await api.post("/cart/merge", { items: payload });
      const cartData = res.data.cart;

      clearGuestCartStorage();

      set({
        cart: cartData,
        items: cartData?.items || [],
        totalAmount: cartData?.totalAmount || 0,
      });

      if (payload.length) {
        toast.success("Your cart was restored");
      }
      return true;
    } catch (error) {
      console.error("Merge cart failed", error);
      // Fallback: add items one by one
      try {
        for (const item of guest.items) {
          await api.post("/cart/add", {
            productId: item.product?._id || item.productId,
            colorIndex: Number(item.colorIndex) || 0,
            quantity: Number(item.quantity) || 1,
          });
        }
        clearGuestCartStorage();
        await get().fetchCart();
        toast.success("Your cart was restored");
        return true;
      } catch (e) {
        console.error(e);
        await get().fetchCart();
        return false;
      }
    }
  },

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

  getCartCount: () => {
    return get().items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0,
    );
  },

  getItemQuantity: (productId, colorIndex) => {
    const item = get().items.find(
      (i) =>
        String(i.product?._id || i.productId) === String(productId) &&
        Number(i.colorIndex) === Number(colorIndex),
    );
    return item ? item.quantity : 0;
  },
}));

export default useCartStore;

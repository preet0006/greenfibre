import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const useProductStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  products: [],
  singleProduct: null,
  relatedProducts: [],
  loading: false,
  actionLoading: false,

  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  },

  filters: {
    category: "",
    subCategory: "",
    minPrice: "",
    maxPrice: "",
    isFeatured: "",
    inStock: "",
    sort: "-createdAt",
  },

  searchQuery: "",

  // =========================
  // FETCH PRODUCTS
  // =========================
  fetchProducts: async (params = {}) => {
    try {
      set({ loading: true });

      const query = {
        ...get().filters,
        ...params,
      };

      const res = await api.get("/product", { params: query });

      set({
        products: res.data.products || [],
        pagination: res.data.pagination,
        loading: false,
      });

      return true;
    } catch (error) {
      console.error("Fetch products error:", error);
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // FETCH SINGLE PRODUCT
  // =========================
  fetchSingleProduct: async (slug) => {
    try {
      set({ loading: true });

      const res = await api.get(`/product/${slug}`);

      set({
        singleProduct: res.data.product,
        loading: false,
      });

      return true;
    } catch (error) {
      console.error("Fetch single product error:", error);
      set({ loading: false });
      return false;
    }

  // =========================
  // FETCH RELATED PRODUCTS
  // =========================
  fetchRelatedProducts: async (slug) => {
    try
  }, {
      const res = await api.get(`/product/related/${slug}`);

      set({
        relatedProducts: res.data.products || [],
      });

      return true;
    } catch (error) {
      console.error("Fetch related error:", error);
      return false;
    }
  },

  // =========================
  // SEARCH PRODUCTS
  // =========================
  searchProducts: async (query, params = {}) => {
    try {
      set({ loading: true, searchQuery: query });

      const res = await api.get("/product/search", {
        params: { q: query, ...params },
      });

      set({
        products: res.data.products || [],
        pagination: res.data.pagination,
        loading: false,
      });

      return true;
    } catch (error) {
      console.error("Search error:", error);
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // CREATE PRODUCT (ADMIN)
  // =========================
  createProduct: async (formData) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/product/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({
        products: [res.data.product, ...get().products],
        actionLoading: false,
      });

      toast.success(res.data.message || "Product created");
      return true;
    } catch (error) {
      console.error("Create product error:", error);
      toast.error(error?.response?.data?.message || "Create failed");
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // UPDATE PRODUCT (ADMIN)
  // =========================
  updateProduct: async (productId, formData) => {
    try {
      set({ actionLoading: true });

      const res = await api.put(`/product/update/${productId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({
        products: get().products.map((p) =>
          p._id === productId ? res.data.product : p,
        ),
        singleProduct:
          get().singleProduct?._id === productId
            ? res.data.product
            : get().singleProduct,
        actionLoading: false,
      });

      toast.success(res.data.message || "Product updated");
      return true;
    } catch (error) {
      console.error("Update product error:", error);
      toast.error(error?.response?.data?.message || "Update failed");
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // DELETE PRODUCT (ADMIN)
  // =========================
  deleteProduct: async (productId) => {
    try {
      await api.delete(`/product/delete/${productId}`);

      set({
        products: get().products.filter((p) => p._id !== productId),
      });

      toast.success("Product deleted");
      return true;
    } catch (error) {
      console.error("Delete product error:", error);
      toast.error("Delete failed");
      return false;
    }
  },

  // =========================
  // TOGGLE STATUS
  // =========================
  toggleProductStatus: async (productId) => {
    try {
      const res = await api.patch(`/product/toggle-status/${productId}`);

      set({
        products: get().products.map((p) =>
          p._id === productId ? { ...p, isActive: res.data.isActive } : p,
        ),
      });

      toast.success(res.data.message);
      return true;
    } catch (error) {
      console.error("Toggle status error:", error);
      return false;
    }
  },

  // =========================
  // UPDATE STOCK (for specific color)
  // =========================
  updateStock: async (productId, colorIndex, stock) => {
    try {
      const res = await api.patch(`/product/update-stock/${productId}`, {
        colorIndex,
        stock,
      });

      set({
        products: get().products.map((p) =>
          p._id === productId ? { ...p, totalStock: res.data.totalStock } : p,
        ),
      });

      toast.success("Stock updated");
      return true;
    } catch (error) {
      console.error("Stock update error:", error);
      toast.error("Stock update failed");
      return false;
    }
  },

  // =========================
  // ADD COLOR VARIANT
  // =========================
  addColorVariant: async (productId, formData) => {
    try {
      set({ actionLoading: true });

      const res = await api.post(`/product/add-color/${productId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({
        products: get().products.map((p) =>
          p._id === productId ? res.data.product : p,
        ),
        actionLoading: false,
      });

      toast.success("Color variant added");
      return true;
    } catch (error) {
      console.error("Add color error:", error);
      toast.error("Failed to add color");
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // REMOVE COLOR VARIANT
  // =========================
  removeColorVariant: async (productId, colorIndex) => {
    try {
      const res = await api.delete(
        `/product/remove-color/${productId}/${colorIndex}`,
      );

      set({
        products: get().products.map((p) =>
          p._id === productId ? res.data.product : p,
        ),
      });

      toast.success("Color variant removed");
      return true;
    } catch (error) {
      console.error("Remove color error:", error);
      toast.error(error?.response?.data?.message || "Failed to remove color");
      return false;
    }
  },

  // =========================
  // SET FILTERS
  // =========================
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  // =========================
  // CLEAR FILTERS
  // =========================
  clearFilters: () => {
    set({
      filters: {
        category: "",
        subCategory: "",
        minPrice: "",
        maxPrice: "",
        isFeatured: "",
        inStock: "",
        sort: "-createdAt",
      },
    });
  },

  // =========================
  // CLEAR SINGLE PRODUCT
  // =========================
  clearSingleProduct: () => {
    set({ singleProduct: null });
  },
}));

export default useProductStore;
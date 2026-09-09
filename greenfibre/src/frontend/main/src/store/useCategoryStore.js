import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

export const useCategoryStore = create((set, get) => ({
  /* =========================
     STATE
  ========================== */
  categories: [],
  category: null,
  featuredCategories: [],

  loading: false,
  actionLoading: false,

  /* =========================
     GET ALL CATEGORIES
  ========================== */
  fetchCategories: async () => {
    try {
      if (get().categories.length > 0) return;

      set({ loading: true });

      const res = await api.get("/categories");

      const categories = res.data.categories;

      set({
        categories,
        featuredCategories: categories.filter((c) => c.isFeatured),
      });
    } catch (error) {
      toast.error("Failed to fetch categories");
    } finally {
      set({ loading: false });
    }
  },

  /* =========================
     FORCE REFETCH
  ========================== */
  refetchCategories: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/categories");

      set({ categories: res.data.categories });
    } catch {
      toast.error("Failed to refresh categories");
    } finally {
      set({ loading: false });
    }
  },

  /* =========================
     GET SINGLE CATEGORY
  ========================== */
  fetchCategoryBySlug: async (slug) => {
    try {
      set({ loading: true });

      const res = await api.get(`/categories/${slug}`);

      set({ category: res.data.category });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Category not found");
    } finally {
      set({ loading: false });
    }
  },

  /* =========================
     ADMIN: CREATE CATEGORY
  ========================== */
  createCategory: async (data) => {
    try {
      set({ actionLoading: true });

      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (key === "image" && data[key]) {
          formData.append("image", data[key]);
        } else if (key === "metaKeywords") {
          formData.append(key, data[key].join(","));
        } else {
          formData.append(key, data[key]);
        }
      });

      const res = await api.post("/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({
        categories: [...get().categories, res.data.category],
      });

      toast.success("Category created");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to create category",
      );
    } finally {
      set({ actionLoading: false });
    }
  },

  /* =========================
     ADMIN: UPDATE CATEGORY
  ========================== */
  updateCategory: async (id, data) => {
    try {
      set({ actionLoading: true });

      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        const value = data[key];

        if (key === "image" && value) {
          formData.append("image", value);
        } else if (key === "metaKeywords") {
          formData.append(key, value.join(","));
        }

        // ✅ FIX: Boolean handling
        else if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        }

        // ✅ Skip null/undefined
        else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      const res = await api.put(`/categories/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res.data.category;

      set({
        categories: get().categories.map((c) => (c._id === id ? updated : c)),
        category: updated,
      });

      toast.success("Category updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed");
    } finally {
      set({ actionLoading: false });
    }
  },

  /* =========================
     ADMIN: DELETE CATEGORY
  ========================== */
  deleteCategory: async (id) => {
    try {
      set({ actionLoading: true });

      await api.delete(`/categories/${id}`);

      set({
        categories: get().categories.filter((c) => c._id !== id),
      });

      toast.success("Category deleted");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    } finally {
      set({ actionLoading: false });
    }
  },

  /* =========================
     ADMIN: TOGGLE STATUS
  ========================== */
  toggleCategoryStatus: async (id) => {
    try {
      const res = await api.patch(`/categories/${id}/toggle`);

      set({
        categories: get().categories.map((c) =>
          c._id === id ? { ...c, isActive: res.data.isActive } : c,
        ),
      });

      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  },

  /* =========================
     HELPERS
  ========================== */

  getRootCategories: () => {
    return get().categories.filter((c) => !c.parentCategory);
  },

  getSubCategories: (parentId) => {
    return get().categories.filter((c) => c.parentCategory === parentId);
  },

  getCategoryById: (id) => {
    return get().categories.find((c) => c._id === id);
  },

  clearCategory: () => set({ category: null }),

  clearCategories: () =>
    set({
      categories: [],
      featuredCategories: [],
    }),
}));

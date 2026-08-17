import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const useGalleryStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  gallery: [],
  loading: false,
  actionLoading: false,

  // =========================
  // FETCH GALLERY (Public/Admin)
  // GET /api/gallery
  // =========================
  fetchGallery: async (category = "") => {
    try {
      set({ loading: true });

      const res = await api.get("/gallery", {
        params: category ? { category } : {},
      });

      set({
        gallery: res.data.gallery || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // CREATE GALLERY ITEMS (Admin)
  // POST /api/gallery/create
  // =========================
  createGalleryItems: async (formData) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/gallery/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({
        gallery: [...res.data.items, ...get().gallery],
        actionLoading: false,
      });

      toast.success("Gallery items created successfully");
      return true;
    } catch (error) {
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // TOGGLE GALLERY STATUS
  // PATCH /api/gallery/toggle-status/:galleryId
  // =========================
  toggleGalleryStatus: async (galleryId) => {
    try {
      const res = await api.patch(`/gallery/toggle-status/${galleryId}`);

      set({
        gallery: get().gallery.map((item) =>
          item._id === galleryId
            ? { ...item, isActive: res.data.status }
            : item,
        ),
      });

      toast.success("Gallery status updated");
      return true;
    } catch (error) {
      return false;
    }
  },

  // =========================
  // UPDATE GALLERY ORDER
  // PATCH /api/gallery/update-order/:galleryId
  // =========================
  updateGalleryOrder: async (galleryId, order) => {
    try {
      const res = await api.patch(`/gallery/update-order/${galleryId}`, {
        order,
      });

      set({
        gallery: get().gallery.map((item) =>
          item._id === galleryId ? res.data.item : item,
        ),
      });

      toast.success("Display order updated");
      return true;
    } catch (error) {
      return false;
    }
  },

  // =========================
  // DELETE GALLERY ITEM
  // DELETE /api/gallery/delete/:galleryId
  // =========================
  deleteGalleryItem: async (galleryId) => {
    try {
      await api.delete(`/gallery/delete/${galleryId}`);

      set({
        gallery: get().gallery.filter((item) => item._id !== galleryId),
      });

      toast.success("Gallery item deleted");
      return true;
    } catch (error) {
      return false;
    }
  },
}));

export default useGalleryStore;

import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const useShopByVideoStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  videos: [],
  loading: false,
  actionLoading: false,
  allVideos: [],

  // =========================
  // FETCH ACTIVE VIDEOS (Public)
  // GET /api/shop-by-video
  // =========================
  fetchVideos: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/shop-by-video");

      set({
        videos: res.data.videos || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // FETCH ALL VIDEOS (Admin)
  // GET /api/shop-by-video/all
  // =========================
  fetchAllVideos: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/shop-by-video/all");

      set({
        allVideos: res.data.videos || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // CREATE VIDEO (Admin)
  // POST /api/shop-by-video/create
  // =========================
  createVideo: async (formData) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/shop-by-video/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({
        videos: [res.data.video, ...get().videos],
        actionLoading: false,
      });

      toast.success("Video created successfully");
      return true;
    } catch (error) {
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // TOGGLE STATUS (Admin)
  // PATCH /api/shop-by-video/toggle-status/:videoId
  // =========================
  toggleVideoStatus: async (videoId) => {
    try {
      const res = await api.patch(`/shop-by-video/toggle-status/${videoId}`);

      set({
        videos: get().videos.map((v) =>
          v._id === videoId ? { ...v, isActive: res.data.isActive } : v,
        ),
      });

      toast.success("Video status updated");
      return true;
    } catch (error) {
      return false;
    }
  },

  // =========================
  // UPDATE DISPLAY ORDER (Admin)
  // PATCH /api/shop-by-video/update-order/:videoId
  // =========================
  updateVideoOrder: async (videoId, order) => {
    try {
      const res = await api.patch(`/shop-by-video/update-order/${videoId}`, {
        order,
      });

      const updated = res.data.video;

      set({
        videos: get().videos.map((v) => (v._id === videoId ? updated : v)),
      });

      toast.success("Video order updated");
      return true;
    } catch (error) {
      return false;
    }
  },

  // =========================
  // DELETE VIDEO (Admin)
  // DELETE /api/shop-by-video/delete/:videoId
  // =========================
  deleteVideo: async (videoId) => {
    try {
      await api.delete(`/shop-by-video/delete/${videoId}`);

      set({
        videos: get().videos.filter((v) => v._id !== videoId),
      });

      toast.success("Video deleted successfully");
      return true;
    } catch (error) {
      return false;
    }
  },

  // =========================
  // CLEAR STATE (Optional)
  // =========================
  clearVideos: () => {
    set({ videos: [] });
  },
}));

export default useShopByVideoStore;

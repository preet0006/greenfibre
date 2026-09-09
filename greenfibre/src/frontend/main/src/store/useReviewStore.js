import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const useReviewStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  reviews: [],
  loading: false,
  actionLoading: false,

  // =========================
  // FETCH PRODUCT REVIEWS (Public)
  // GET /api/review/:productId
  // =========================
  fetchProductReviews: async (productId) => {
    try {
      set({ loading: true });

      const res = await api.get(`/review/${productId}`);

      set({
        reviews: res.data.reviews || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // CREATE REVIEW (User)
  // POST /api/review/create
  // =========================
  createReview: async (formData) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/review/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({ actionLoading: false });

      toast.success(res.data.message || "Review submitted");
      return true;
    } catch (error) {
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // APPROVE REVIEW (Admin)
  // PATCH /api/review/approve/:reviewId
  // =========================
  approveReview: async (reviewId) => {
    try {
      const res = await api.patch(`/review/approve/${reviewId}`);

      // Mark as approved in state
      set({
        reviews: get().reviews.map((review) =>
          review._id === reviewId ? { ...review, isApproved: true } : review,
        ),
      });

      toast.success(res.data.message || "Review approved");
      return true;
    } catch (error) {
      return false;
    }
  },

  // =========================
  // DELETE REVIEW (Admin)
  // DELETE /api/review/delete/:reviewId
  // =========================
  deleteReview: async (reviewId) => {
    try {
      await api.delete(`/review/delete/${reviewId}`);

      set({
        reviews: get().reviews.filter((review) => review._id !== reviewId),
      });

      toast.success("Review deleted");
      return true;
    } catch (error) {
      return false;
    }
  },

  fetchAllReviews: async () => {
    try {
      set({ loading: true });

      // Public endpoint — approved reviews only (do NOT use /review/all — admin only)
      const res = await api.get("/review");

      set({
        reviews: res.data.reviews || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false, reviews: [] });
      return false;
    }
  },

  // =========================
  // CLEAR REVIEWS (Helper)
  // =========================
  clearReviews: () => {
    set({ reviews: [] });
  },
}));

export default useReviewStore;

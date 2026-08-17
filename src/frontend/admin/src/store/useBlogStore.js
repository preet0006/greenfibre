import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const useBlogStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  blogs: [],
  singleBlog: null,
  loading: false,
  actionLoading: false,

  // =========================
  // FETCH ALL BLOGS (Public)
  // GET /api/blogs
  // =========================
  fetchBlogs: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/blogs");

      set({
        blogs: res.data.blogs || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // FETCH SINGLE BLOG (Public)
  // GET /api/blogs/:slug
  // =========================
  fetchSingleBlog: async (slug) => {
    try {
      set({ loading: true });

      const res = await api.get(`/blogs/${slug}`);

      set({
        singleBlog: res.data.blog,
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // CREATE BLOG (Admin)
  // POST /api/blogs/create
  // =========================
  createBlog: async (formData) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/blogs/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({
        blogs: [res.data.blog, ...get().blogs],
        actionLoading: false,
      });

      toast.success(res.data.message || "Blog created successfully");
      return true;
    } catch (error) {
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // UPDATE BLOG (Admin)
  // PUT /api/blogs/update/:blogId
  // =========================
  updateBlog: async (blogId, formData) => {
    try {
      set({ actionLoading: true });

      const res = await api.put(`/blogs/update/${blogId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({
        blogs: get().blogs.map((blog) =>
          blog._id === blogId ? res.data.blog : blog,
        ),
        singleBlog:
          get().singleBlog?._id === blogId ? res.data.blog : get().singleBlog,
        actionLoading: false,
      });

      toast.success(res.data.message || "Blog updated successfully");
      return true;
    } catch (error) {
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // DELETE BLOG (Admin)
  // DELETE /api/blogs/delete/:blogId
  // =========================
  deleteBlog: async (blogId) => {
    try {
      await api.delete(`/blogs/delete/${blogId}`);

      set({
        blogs: get().blogs.filter((blog) => blog._id !== blogId),
      });

      toast.success("Blog deleted successfully");
      return true;
    } catch (error) {
      return false;
    }
  },

  // =========================
  // TOGGLE PUBLISH STATUS
  // PATCH /api/blogs/toggle-status/:blogId
  // =========================
  togglePublishStatus: async (blogId, explicitValue) => {
    try {
      const res = await api.patch(
        `/blogs/toggle-status/${blogId}`,
        explicitValue !== undefined ? { isPublished: explicitValue } : {},
      );

      set({
        blogs: get().blogs.map((blog) =>
          blog._id === blogId
            ? { ...blog, isPublished: res.data.isPublished }
            : blog,
        ),
      });

      toast.success(res.data.message || "Publish status updated");
      return true;
    } catch (error) {
      return false;
    }
  },

  // =========================
  // CLEAR SINGLE BLOG (Optional helper)
  // =========================
  clearSingleBlog: () => {
    set({ singleBlog: null });
  },
}));

export default useBlogStore;

import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const useUserStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  admin: null,
  users: [],
  loading: false,
  userLoading: false,

  // =========================
  // GET CURRENT ADMIN PROFILE
  // GET /api/admin/me
  // =========================
  fetchAdminProfile: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/admin/me");

      set({
        admin: res.data.user,
        loading: false,
      });
    } catch (error) {
      set({
        admin: null,
        loading: false,
      });
    }
  },

  // =========================
  // LOGIN ADMIN
  // POST /api/admin/login
  // =========================
  loginAdmin: async (formData, router) => {
    try {
      set({ loading: true });

      const res = await api.post("/admin/login", formData);

      set({
        admin: res.data.user,
        loading: false,
      });

      toast.success("Login successful");

      router.push("/dashboard");
    } catch (error) {
      set({ loading: false });
    }
  },

  // =========================
  // LOGOUT ADMIN
  // POST /api/admin/logout
  // =========================
  logoutAdmin: async (router) => {
    try {
      await api.post("/admin/logout");

      set({
        admin: null,
        users: [],
      });

      toast.success("Logged out successfully");

      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
    }
  },

  // =========================
  // FETCH ALL USERS (ADMIN)
  // GET /api/admin/users
  // =========================
  fetchUsers: async () => {
    try {
      set({ userLoading: true });

      const res = await api.get("/admin/users");

      set({
        users: res.data.users || [],
        userLoading: false,
      });
    } catch (error) {
      set({ userLoading: false });
    }
  },

  // =========================
  // DELETE USER (ADMIN)
  // DELETE /api/admin/delete-user
  // =========================
  deleteUser: async (userId) => {
    try {
      await api.delete("/admin/delete-user", {
        data: { userId },
      });

      set({
        users: get().users.filter((u) => u._id !== userId),
      });

      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Delete user error", error);
    }
  },

  // =========================
  // CREATE ADMIN
  // POST /api/admin/create-admin
  // =========================
  createAdmin: async (formData) => {
    try {
      set({ loading: true });

      await api.post("/admin/create-admin", formData);

      set({ loading: false });

      toast.success("Admin created successfully");
    } catch (error) {
      set({ loading: false });
    }
  },

  // =========================
  // UPDATE ADMIN PROFILE
  // PUT /api/admin/update-profile
  // =========================
  updateProfile: async (formData) => {
    try {
      set({ loading: true });

      const res = await api.put("/admin/update-profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      set({
        admin: res.data.user,
        loading: false,
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      set({ loading: false });
    }
  },

  // =========================
  // UPDATE PASSWORD
  // PUT /api/admin/update-password
  // =========================
  updatePassword: async (formData) => {
    try {
      set({ loading: true });

      await api.put("/admin/update-password", formData);

      set({ loading: false });

      toast.success("Password updated successfully");
    } catch (error) {
      set({ loading: false });
    }
  },

  // =========================
  // FORGOT PASSWORD (ADMIN)
  // POST /api/admin/forgot-password
  // =========================
  forgotPassword: async (email) => {
    try {
      set({ loading: true });

      const res = await api.post("/admin/forgot-password", { email });

      toast.success(res.data.message || "Reset OTP sent to email");
      set({ loading: false });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // RESET PASSWORD WITH OTP
  // POST /api/admin/reset-password
  // =========================
  resetPassword: async ({ email, otp, newPassword }) => {
    try {
      set({ loading: true });

      const res = await api.post("/admin/reset-password", {
        email,
        otp,
        newPassword,
      });

      set({ loading: false });

      toast.success(res.data.message || "Password reset successfully");
      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },
}));

export default useUserStore;

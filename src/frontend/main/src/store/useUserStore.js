import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import useCartStore from "@/store/useCartStore";

const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  authChecked: false,

  fetchUser: async () => {
    try {
      set({ loading: true });
      const res = await api.get("/users/me");
      set({
        user: res.data.user,
        loading: false,
        authChecked: true,
      });
    } catch (error) {
      set({
        user: null,
        loading: false,
        authChecked: true,
      });
    }
  },

  register: async (data, router) => {
    try {
      set({ loading: true });
      const res = await api.post("/users/register", data);
      toast.success(res.data.message || "Account created. Verify your email.");
      set({ loading: false });
      const email = encodeURIComponent(data.email);
      router.push(`/verify-email?email=${email}`);
      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  verifyOtp: async (data, router) => {
    try {
      set({ loading: true });
      const res = await api.post("/users/verify-otp", data);
      set({
        user: res.data.user,
        loading: false,
        authChecked: true,
      });
      toast.success(res.data.message || "Email verified");
      await useCartStore.getState().mergeGuestCartOnLogin();
      router.push("/");
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        message: error?.response?.data?.message || "Verification failed",
        code: error?.response?.data?.code,
      };
    }
  },

  login: async (data, router) => {
    try {
      set({ loading: true });
      const res = await api.post("/users/login", data);
      set({
        user: res.data.user,
        loading: false,
        authChecked: true,
      });
      toast.success(res.data.message || "Logged in");
      await useCartStore.getState().mergeGuestCartOnLogin();
      const redirect =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;
      router.push(redirect || "/");
      return { success: true };
    } catch (error) {
      set({ loading: false });
      const code = error?.response?.data?.code;
      const email = error?.response?.data?.email || data.email;
      if (code === "EMAIL_NOT_VERIFIED") {
        return {
          success: false,
          code,
          email,
          message:
            error?.response?.data?.message ||
            "Please verify your email before logging in.",
        };
      }
      return {
        success: false,
        message: error?.response?.data?.message || "Login failed",
      };
    }
  },

  logout: async (router) => {
    try {
      await api.post("/users/logout");
      set({ user: null });
      useCartStore.getState().resetLocalCart();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error(error);
    }
  },

  resendOtp: async (email) => {
    try {
      set({ loading: true });
      const res = await api.post("/users/resend-otp", { email });
      toast.success(res.data.message || "OTP resent");
      set({ loading: false });
      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  forgotPassword: async (email, router) => {
    try {
      set({ loading: true });
      const res = await api.post("/users/forgot-password", { email });
      toast.success(res.data.message);
      set({ loading: false });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  resetPassword: async (data, router) => {
    try {
      set({ loading: true });
      const res = await api.post("/users/reset-password", data);
      toast.success(res.data.message);
      set({ loading: false });
      router.push("/login");
      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  updateProfile: async (formData) => {
    try {
      set({ loading: true });
      const res = await api.put("/users/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set({ user: res.data.user, loading: false });
      toast.success(res.data.message);
    } catch (error) {
      set({ loading: false });
    }
  },

  updatePassword: async (data) => {
    try {
      set({ loading: true });
      const res = await api.put("/users/update-password", data);
      toast.success(res.data.message);
      set({ loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  deleteAccount: async (router) => {
    try {
      set({ loading: true });
      const res = await api.delete("/users/delete-account");
      toast.success(res.data.message);
      set({ user: null, loading: false });
      useCartStore.getState().clearCart();
      router.push("/");
    } catch (error) {
      set({ loading: false });
    }
  },
}));

export default useUserStore;

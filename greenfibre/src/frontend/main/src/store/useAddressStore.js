import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const useAddressStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  addresses: [],
  defaultAddress: null,
  loading: false,
  actionLoading: false,

  // =========================
  // ADD ADDRESS
  // =========================
  addAddress: async (data) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/address/add", data);

      set({
        addresses: [res.data.address, ...get().addresses],
        actionLoading: false,
      });

      toast.success("Address added");
      return true;
    } catch (error) {
      set({ actionLoading: false });
      toast.error(error.response?.data?.message || "Add failed");
      return false;
    }
  },

  // =========================
  // FETCH ALL ADDRESSES
  // =========================
  fetchAddresses: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/address");

      set({
        addresses: res.data.addresses || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      toast.error("Failed to fetch addresses");
      return false;
    }
  },

  // =========================
  // UPDATE ADDRESS
  // =========================
  updateAddress: async (addressId, data) => {
    try {
      set({ actionLoading: true });

      const res = await api.put(`/address/update/${addressId}`, data);

      const updated = res.data.address;

      set({
        addresses: get().addresses.map((addr) =>
          addr._id === addressId ? updated : addr,
        ),
        actionLoading: false,
      });

      toast.success("Address updated");
      return true;
    } catch (error) {
      set({ actionLoading: false });
      toast.error("Update failed");
      return false;
    }
  },

  // =========================
  // DELETE ADDRESS
  // =========================
  deleteAddress: async (addressId) => {
    try {
      await api.delete(`/address/delete/${addressId}`);

      set({
        addresses: get().addresses.filter((addr) => addr._id !== addressId),
      });

      toast.success("Address deleted");
      return true;
    } catch (error) {
      toast.error("Delete failed");
      return false;
    }
  },

  // =========================
  // GET DEFAULT ADDRESS
  // =========================
  fetchDefaultAddress: async (addressType = "shipping") => {
    try {
      const res = await api.get(`/address/default?addressType=${addressType}`);

      set({
        defaultAddress: res.data.address || null,
      });

      return true;
    } catch (error) {
      toast.error("Failed to fetch default address");
      return false;
    }
  },

  // =========================
  // SET DEFAULT (OPTIMISTIC)
  // =========================
  setDefaultAddress: async (addressId, addressType) => {
    try {
      set({ actionLoading: true });

      const target = get().addresses.find((a) => a._id === addressId);

      if (!target) return false;

      await api.put(`/address/update/${addressId}`, {
        ...target,
        isDefault: true,
      });

      // Update local state
      set({
        addresses: get().addresses.map((addr) => ({
          ...addr,
          isDefault: addr.addressType === addressType && addr._id === addressId,
        })),
        defaultAddress: target,
        actionLoading: false,
      });

      toast.success("Default address updated");
      return true;
    } catch (error) {
      set({ actionLoading: false });
      toast.error("Failed to set default");
      return false;
    }
  },

  // =========================
  // HELPER: GET BY TYPE
  // =========================
  getAddressesByType: (type) => {
    return get().addresses.filter((addr) => addr.addressType === type);
  },
}));

export default useAddressStore;

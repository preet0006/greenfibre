import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const useContactStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  contacts: [],
  loading: false,
  actionLoading: false,

  // =========================
  // SUBMIT CONTACT (Public)
  // POST /api/contact/contact
  // =========================
  submitContact: async (formData) => {
    try {
      set({ actionLoading: true });

      const res = await api.post("/contact/contact", formData);

      toast.success(res.data.message || "Message submitted successfully");

      set({ actionLoading: false });
      return true;
    } catch (error) {
      set({ actionLoading: false });
      return false;
    }
  },

  // =========================
  // FETCH ALL CONTACTS (Admin)
  // GET /api/contact
  // =========================
  fetchContacts: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/contact");

      set({
        contacts: res.data.contacts || [],
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // TOGGLE CONTACT STATUS (Admin)
  // PATCH /api/contact/toggle-status/:contactId
  // =========================
  toggleContactStatus: async (contactId) => {
    try {
      const res = await api.patch(`/contact/toggle-status/${contactId}`);

      const updatedStatus = res.data.status;

      set({
        contacts: get().contacts.map((c) =>
          c._id === contactId ? { ...c, status: updatedStatus } : c,
        ),
      });

      toast.success("Status updated");
      return true;
    } catch (error) {
      return false;
    }
  },

  // =========================
  // DELETE CONTACT (Admin)
  // DELETE /api/contact/delete/:contactId
  // =========================
  deleteContact: async (contactId) => {
    try {
      await api.delete(`/contact/delete/${contactId}`);

      set({
        contacts: get().contacts.filter((c) => c._id !== contactId),
      });

      toast.success("Contact deleted successfully");
      return true;
    } catch (error) {
      return false;
    }
  },
}));

export default useContactStore;

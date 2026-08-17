import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const defaultSettings = {
  companyName: "",
  phoneNumbers: [],
  whatsappNumber: "",
  emails: [],
  address: "",
  gstNumber: "",
  footerDescription: "",
  googleMapEmbedUrl: "",
  socialLinks: {
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    linkedin: "",
    pinterest: "",
  },
};

const usePageSettingsStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================
  settings: defaultSettings,
  loading: false,
  updating: false,

  // =========================
  // FETCH PAGE SETTINGS (Public/Admin)
  // GET /api/page-settings
  // =========================
  fetchPageSettings: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/page-settings");

      set({
        settings: res.data.settings || defaultSettings,
        loading: false,
      });

      return true;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  // =========================
  // UPDATE PAGE SETTINGS (Admin Only)
  // PUT /api/page-settings
  // =========================
  updatePageSettings: async (updatedData) => {
    try {
      set({ updating: true });

      const res = await api.put("/page-settings", updatedData);

      set({
        settings: res.data.settings,
        updating: false,
      });

      toast.success(res.data.message || "Page settings updated");
      return true;
    } catch (error) {
      set({ updating: false });
      return false;
    }
  },

  // =========================
  // LOCAL FIELD UPDATE (for forms)
  // =========================
  setField: (field, value) => {
    set({
      settings: {
        ...get().settings,
        [field]: value,
      },
    });
  },

  // =========================
  // UPDATE SOCIAL LINKS FIELD
  // =========================
  setSocialLink: (platform, value) => {
    set({
      settings: {
        ...get().settings,
        socialLinks: {
          ...get().settings.socialLinks,
          [platform]: value,
        },
      },
    });
  },

  // =========================
  // ADD PHONE NUMBER
  // =========================
  addPhoneNumber: (number) => {
    set({
      settings: {
        ...get().settings,
        phoneNumbers: [...get().settings.phoneNumbers, number],
      },
    });
  },

  removePhoneNumber: (index) => {
    const updated = [...get().settings.phoneNumbers];
    updated.splice(index, 1);

    set({
      settings: {
        ...get().settings,
        phoneNumbers: updated,
      },
    });
  },

  // =========================
  // ADD EMAIL
  // =========================
  addEmail: (email) => {
    set({
      settings: {
        ...get().settings,
        emails: [...get().settings.emails, email],
      },
    });
  },

  removeEmail: (index) => {
    const updated = [...get().settings.emails];
    updated.splice(index, 1);

    set({
      settings: {
        ...get().settings,
        emails: updated,
      },
    });
  },
}));

export default usePageSettingsStore;

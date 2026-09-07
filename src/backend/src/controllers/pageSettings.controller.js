import mongoose from "mongoose";
import { PageSettings } from "../models/pageSettings.model.js";

const DEFAULT_SETTINGS = {
    announcementBar: { text: "Welcome to Green Fibre", isEnabled: true },
    socialLinks: {},
    seo: { title: "Green Fibre — Sustainability, Simplified" },
};

/* =====================================================
   GET PAGE SETTINGS (Public)
===================================================== */
export const getPageSettings = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({
                success: true,
                settings: DEFAULT_SETTINGS,
            });
        }

        let settings = await PageSettings.findOne();

        if (!settings) {
            settings = await PageSettings.create({});
        }

        return res.status(200).json({
            success: true,
            settings,
        });
    } catch (error) {
        console.warn("Get page settings error (returning default fallback):", error.message);
        return res.status(200).json({
            success: true,
            settings: DEFAULT_SETTINGS,
        });
    }
};

/* =====================================================
   UPDATE PAGE SETTINGS (Admin Only)
===================================================== */
export const updatePageSettings = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Database is reconnecting. Please retry in a few seconds.",
            });
        }

        let settings = await PageSettings.findOne();

        if (!settings) {
            settings = await PageSettings.create(req.body);
        } else {
            Object.assign(settings, req.body);
            await settings.save();
        }

        return res.status(200).json({
            success: true,
            message: "Page settings updated successfully",
            settings,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error updating page settings",
        });
    }
};

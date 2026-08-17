import { PageSettings } from "../models/pageSettings.model.js";

/* =====================================================
   GET PAGE SETTINGS (Public)
===================================================== */
export const getPageSettings = async (req, res) => {
    try {
        let settings = await PageSettings.findOne();

        if (!settings) {
            settings = await PageSettings.create({});
        }

        res.json({
            success: true,
            settings,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching page settings",
        });
    }
};

/* =====================================================
   UPDATE PAGE SETTINGS (Admin Only)
===================================================== */
export const updatePageSettings = async (req, res) => {
    try {
        let settings = await PageSettings.findOne();

        if (!settings) {
            settings = await PageSettings.create(req.body);
        } else {
            Object.assign(settings, req.body);
            await settings.save();
        }

        res.json({
            success: true,
            message: "Page settings updated successfully",
            settings,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating page settings",
        });
    }
};

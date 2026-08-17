import mongoose from "mongoose";

const socialLinksSchema = new mongoose.Schema(
    {
        facebook: String,
        instagram: String,
        twitter: String,
        youtube: String,
        linkedin: String,
        pinterest: String,
    },
    { _id: false }
);

const pageSettingsSchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            default: "GreenFibre",
        },

        phoneNumbers: [
            {
                type: String,
                trim: true,
            },
        ],

        whatsappNumber: {
            type: String,
            trim: true,
        },

        emails: [
            {
                type: String,
                lowercase: true,
                trim: true,
            },
        ],

        address: {
            type: String,
        },

        gstNumber: {
            type: String,
        },

        socialLinks: socialLinksSchema,

        footerDescription: String,

        googleMapEmbedUrl: String,
    },
    { timestamps: true }
);

export const PageSettings = mongoose.model("PageSettings", pageSettingsSchema);

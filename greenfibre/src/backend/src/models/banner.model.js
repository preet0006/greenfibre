import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
        },

        subtitle: {
            type: String,
            trim: true,
        },

        mediaType: {
            type: String,
            enum: ["image", "video"],
            required: true,
        },

        mediaUrl: {
            type: String,
            required: true,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        order: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export const Banner = mongoose.model("Banner", bannerSchema);

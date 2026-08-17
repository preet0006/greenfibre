import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
        },

        caption: {
            type: String,
            trim: true,
            maxlength: 300,
        },

        image: {
            type: String,
            required: true,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
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

export const Gallery = mongoose.model("Gallery", gallerySchema);

import { Wishlist } from "../models/wishlist.model.js";
import { Product } from "../models/product.model.js";

// =============================
// ADD TO WISHLIST
// =============================
export const addToWishlist = async (req, res) => {
    try {
        const userId = req.user._id;

        const { productId } = req.body;

        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        let wishlist = await Wishlist.findOne({
            user: userId,
        });

        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: userId,
                products: [productId],
            });
        } else {
            const alreadyExists = wishlist.products.some(
                (id) => id.toString() === String(productId)
            );
            if (alreadyExists) {
                return res.status(400).json({
                    message: "Product already in wishlist",
                });
            }

            wishlist.products.push(productId);

            await wishlist.save();
        }

        return res.status(200).json({
            success: true,
            message: "Product added to wishlist",
        });
    } catch (error) {
        console.error("Add wishlist error:", error);

        return res.status(500).json({
            message: "Error adding to wishlist",
        });
    }
};

// =============================
// REMOVE FROM WISHLIST
// =============================
export const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user._id;

        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({
            user: userId,
        });

        if (!wishlist) {
            return res.status(404).json({
                message: "Wishlist not found",
            });
        }

        wishlist.products = wishlist.products.filter(
            (item) => item.toString() !== productId
        );

        await wishlist.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error removing from wishlist",
        });
    }
};

// =============================
// HELPER: Transform Product Images
// =============================
const transformProductImages = (product) => {
    if (!product) return null;

    const productObj = product.toObject ? product.toObject() : { ...product };

    // Transform color variant images
    if (productObj.colors && productObj.colors.length > 0) {
        productObj.colors = productObj.colors.map((color) => {
            if (color.images && color.images.length > 0) {
                return {
                    ...color,
                    images: color.images.map((img) => {
                        const imgUrl =
                            typeof img === "string" ? img : img.original || img;

                        return {
                            thumbnail: imgUrl,
                            card: imgUrl,
                            original: imgUrl,
                        };
                    }),
                };
            }

            return color;
        });

        // Add main product image
        const firstImage = productObj.colors[0]?.images?.[0];

        if (firstImage) {
            productObj.mainImage = firstImage.card || firstImage.thumbnail;
        }
    }

    return productObj;
};

// =============================
// GET USER WISHLIST
// =============================
export const getWishlist = async (req, res) => {
    try {
        const userId = req.user._id;

        const wishlist = await Wishlist.findOne({
            user: userId,
        }).populate({
            path: "products",
            match: {
                isActive: true,
            },
        });

        if (!wishlist) {
            return res.status(200).json({
                success: true,
                products: [],
            });
        }

        // Filter out null products
        const validProducts = wishlist.products.filter((p) => p !== null);

        // Transform images
        const productsWithImages = validProducts.map(transformProductImages);

        return res.status(200).json({
            success: true,
            products: productsWithImages,
        });
    } catch (error) {
        console.error("Get wishlist error:", error);

        return res.status(500).json({
            message: "Error fetching wishlist",
        });
    }
};

// =============================
// TOGGLE WISHLIST
// =============================
export const toggleWishlist = async (req, res) => {
    try {
        const userId = req.user._id;

        const { productId } = req.body;

        // Validate product
        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        let wishlist = await Wishlist.findOne({
            user: userId,
        });

        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: userId,
                products: [productId],
            });

            return res.status(200).json({
                success: true,
                message: "Added to wishlist",
                isWishlisted: true,
            });
        }

        const exists = wishlist.products.some(
            (id) => id.toString() === productId
        );

        if (exists) {
            wishlist.products = wishlist.products.filter(
                (id) => id.toString() !== productId
            );
        } else {
            wishlist.products.push(productId);
        }

        await wishlist.save();

        return res.status(200).json({
            success: true,
            isWishlisted: !exists,
            message: exists ? "Removed from wishlist" : "Added to wishlist",
        });
    } catch (error) {
        console.error("Toggle wishlist error:", error);

        return res.status(500).json({
            message: "Error toggling wishlist",
        });
    }
};
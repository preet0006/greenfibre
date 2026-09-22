import mongoose from "mongoose";
import slugify from "slugify";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { getImgproxyUrl } from "../utils/imgproxy.js";

// =============================
// HELPER: Transform product images
// =============================
const transformProductImages = (product, sizes = "full") => {
    const productObj = product.toObject ? product.toObject() : product;

    // Transform color variant images
    if (productObj.colors && productObj.colors.length > 0) {
        productObj.colors = productObj.colors.map((color) => {
            if (!color.images || color.images.length === 0) {
                return {
                    ...color,
                    images: [],
                };
            }

            if (sizes === "full") {
                return {
                    ...color,
                    images: color.images.map((img) => ({
                        original: img,
                        large: img,
                        medium: img,
                        thumbnail: img,
                    })),
                };
            } else if (sizes === "card") {
                return {
                    ...color,
                    images: color.images.map((img) => ({
                        original: img,
                        card: img,
                        thumbnail: img,
                    })),
                };
            } else if (sizes === "thumbnail") {
                return {
                    ...color,
                    images: color.images.map((img) => img),
                };
            }

            return color;
        });
    }

    return productObj;
};
// =============================
// HELPER: Calculate total stock
// =============================
const calculateTotalStock = (colors) => {
    if (!colors || colors.length === 0) return 0;
    return colors.reduce((sum, color) => sum + (color.stock || 0), 0);
};

// =============================
// GET ALL PRODUCTS (Public)
// =============================
export const getProducts = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({
                success: true,
                products: [],
                pagination: {
                    page: Number(req.query.page) || 1,
                    limit: Number(req.query.limit) || 20,
                    total: 0,
                    pages: 0,
                },
            });
        }

        const {
            category,
            subCategory,
            minPrice,
            maxPrice,
            isFeatured,
            inStock,
            sort = "-createdAt",
            page = 1,
            limit = 20,
        } = req.query;

        const filter = { isActive: true };

        // Category filter — accept ObjectId or slug
        if (category) {
            const isObjectId = /^[a-f\d]{24}$/i.test(String(category));
            if (isObjectId) {
                filter.category = category;
            } else {
                const categoryDoc = await Category.findOne({
                    slug: String(category).toLowerCase(),
                    isActive: true,
                }).select("_id");
                if (categoryDoc) {
                    filter.category = categoryDoc._id;
                } else {
                    filter.category = category; // no match → empty results
                }
            }
        }

        // Sub-category filter — accept ObjectId or slug
        if (subCategory) {
            const isObjectId = /^[a-f\d]{24}$/i.test(String(subCategory));
            if (isObjectId) {
                filter.subCategory = subCategory;
            } else {
                const subDoc = await Category.findOne({
                    slug: String(subCategory).toLowerCase(),
                    isActive: true,
                }).select("_id");
                if (subDoc) {
                    filter.subCategory = subDoc._id;
                } else {
                    filter.subCategory = subCategory;
                }
            }
        }

        // Price range filter
        if (minPrice || maxPrice) {
            filter.discountedPrice = {};
            if (minPrice) filter.discountedPrice.$gte = Number(minPrice);
            if (maxPrice) filter.discountedPrice.$lte = Number(maxPrice);
        }

        // Featured filter
        if (isFeatured === "true") {
            filter.isFeatured = true;
        }

        // Stock filter (at least one color has stock)
        if (inStock === "true") {
            filter["colors.stock"] = { $gt: 0 };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const products = await Product.find(filter)
            .populate("category", "name slug")
            .populate("subCategory", "name slug")
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));

        const total = await Product.countDocuments(filter);

        // Transform images for card view
        const productsWithImages = products.map((product) => {
            const transformed = transformProductImages(product, "card");
            // Add total stock
            transformed.totalStock = calculateTotalStock(transformed.colors);
            return transformed;
        });

        return res.status(200).json({
            success: true,
            products: productsWithImages,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)) || 0,
            },
        });
    } catch (error) {
        console.error("Get products error:", error);
        return res.status(500).json({
            message: "Error fetching products",
        });
    }
};

// =============================
// SEARCH PRODUCTS (Public)
// =============================
export const searchProducts = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({
                success: true,
                query: req.query.q || "",
                products: [],
                pagination: { page: 1, limit: 20, total: 0, pages: 1 },
            });
        }

        const { q, page = 1, limit = 20 } = req.query;

        if (!q || q.trim() === "") {
            return res.status(400).json({
                message: "Search query is required",
            });
        }

        const searchQuery = q.trim();
        // Escape regex metacharacters so user input is treated literally.
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Word-start match: "coff" → Coffee, but "her" will NOT match inside "other"/"thermal".
        const wordStartPattern = `\\b${escaped}`;
        // Whole-word match for description/keywords to avoid false positives.
        const wholeWordPattern = `\\b${escaped}\\b`;

        const filter = {
            isActive: true,
            $or: [
                { name: { $regex: wordStartPattern, $options: "i" } },
                { slug: { $regex: wordStartPattern, $options: "i" } },
                { description: { $regex: wholeWordPattern, $options: "i" } },
                {
                    metaKeywords: {
                        $elemMatch: {
                            $regex: wholeWordPattern,
                            $options: "i",
                        },
                    },
                },
            ],
        };

        const skip = (Number(page) - 1) * Number(limit);

        const products = await Product.find(filter)
            .populate("category", "name slug")
            .populate("subCategory", "name slug")
            .sort({ averageRating: -1, reviewCount: -1 })
            .skip(skip)
            .limit(Number(limit));

        // Prefer products whose name/slug starts matching the query.
        const ranked = [...products].sort((a, b) => {
            const aName = a.name || "";
            const bName = b.name || "";
            const re = new RegExp(wordStartPattern, "i");
            const aScore = re.test(aName) ? 1 : 0;
            const bScore = re.test(bName) ? 1 : 0;
            return bScore - aScore;
        });

        const total = await Product.countDocuments(filter);

        // Transform images for card view
        const productsWithImages = ranked.map((product) => {
            const transformed = transformProductImages(product, "card");
            transformed.totalStock = calculateTotalStock(transformed.colors);
            return transformed;
        });

        return res.status(200).json({
            success: true,
            query: searchQuery,
            products: productsWithImages,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error("Search products error:", error);
        return res.status(500).json({
            message: "Error searching products",
        });
    }
};

// =============================
// GET SINGLE PRODUCT (Public)
// =============================
export const getSingleProduct = async (req, res) => {
    const { slug } = req.params;
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        const filter = { isActive: true };
        if (mongoose.Types.ObjectId.isValid(slug) && String(new mongoose.Types.ObjectId(slug)) === String(slug)) {
            filter.$or = [{ slug }, { _id: slug }];
        } else {
            filter.slug = slug;
        }

        const product = await Product.findOne(filter)
            .populate("category", "name slug")
            .populate("subCategory", "name slug");

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        // Transform images with full sizes
        const productWithImages = transformProductImages(product, "full");
        productWithImages.totalStock = calculateTotalStock(
            productWithImages.colors
        );

        return res.status(200).json({
            success: true,
            product: productWithImages,
        });
    } catch (error) {
        console.error("Get single product error:", error.message);
        return res.status(500).json({
            message: "Error fetching product",
        });
    }
};

// =============================
// GET RELATED PRODUCTS (Public)
// =============================
export const getRelatedProducts = async (req, res) => {
    try {
        const { slug } = req.params;
        const { limit = 8 } = req.query;

        const product = await Product.findOne({ slug });

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        // Find products in same category/subcategory, exclude current product
        const filter = {
            isActive: true,
            _id: { $ne: product._id },
            $or: [
                { category: product.category },
                { subCategory: product.subCategory },
            ],
        };

        const relatedProducts = await Product.find(filter)
            .populate("category", "name slug")
            .populate("subCategory", "name slug")
            .sort({ averageRating: -1, reviewCount: -1 })
            .limit(Number(limit));

        // Transform images for card view
        const productsWithImages = relatedProducts.map((product) => {
            const transformed = transformProductImages(product, "card");
            transformed.totalStock = calculateTotalStock(transformed.colors);
            return transformed;
        });

        return res.status(200).json({
            success: true,
            products: productsWithImages,
        });
    } catch (error) {
        console.error("Get related products error:", error);
        return res.status(500).json({
            message: "Error fetching related products",
        });
    }
};

// =============================
// CREATE PRODUCT (Admin)
// =============================
export const createProduct = async (req, res) => {
    try {
        const {
            name,
            originalPrice,
            discountedPrice,
            description,
            category,
            subCategory,
            colors, // JSON string: [{ name, hex, stock, imageCount }]
            features,
            materialInfo,
            isFeatured,
            metaTitle,
            metaDescription,
            metaKeywords,
        } = req.body;

        // Validate category
        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            return res.status(400).json({
                message: "Invalid category",
            });
        }

        // Validate subcategory if provided
        if (subCategory) {
            const subCategoryDoc = await Category.findById(subCategory);
            if (!subCategoryDoc) {
                return res.status(400).json({
                    message: "Invalid subcategory",
                });
            }
        }

        // Parse colors
        const colorVariants = colors ? JSON.parse(colors) : [];

        if (colorVariants.length === 0) {
            return res.status(400).json({
                message: "At least one color variant is required",
            });
        }

        // Process uploaded images and assign to colors
        // Expected file field names: color_0_image_0, color_0_image_1, color_1_image_0, etc.
        const processedColors = [];

        for (let i = 0; i < colorVariants.length; i++) {
            const colorData = colorVariants[i];
            const colorImages = [];

            // Find all images for this color
            if (req.files) {
                for (const file of req.files) {
                    if (file.fieldname.startsWith(`color_${i}_image_`)) {
                        const url = await uploadOnCloudinary(
                            file.path,
                            "products"
                        );
                        if (url) colorImages.push(url);
                    }
                }
            }

            processedColors.push({
                name: colorData.name,
                hex: colorData.hex || "",
                images: colorImages,
                stock: parseInt(colorData.stock) || 0,
            });
        }

        // Validate at least one color has images
        const hasImages = processedColors.some(
            (color) => color.images.length > 0
        );
        if (!hasImages) {
            return res.status(400).json({
                message: "At least one color must have images",
            });
        }

        const product = await Product.create({
            name,
            originalPrice,
            discountedPrice,
            colors: processedColors,
            description,
            category,
            subCategory: subCategory || null,
            features: features ? JSON.parse(features) : {},
            materialInfo: materialInfo ? JSON.parse(materialInfo) : {},
            isFeatured: isFeatured === "true",
            metaTitle,
            metaDescription,
            metaKeywords: metaKeywords ? metaKeywords.split(",") : [],
        });

        // Transform images for response
        const productWithImages = transformProductImages(product, "full");
        productWithImages.totalStock = calculateTotalStock(
            productWithImages.colors
        );

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: productWithImages,
        });
    } catch (error) {
        console.error("Create product error:", error);
        return res.status(500).json({
            message: "Error creating product",
        });
    }
};

// =============================
// UPDATE PRODUCT (Admin)
// =============================
export const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        const {
            name,
            originalPrice,
            discountedPrice,
            description,
            category,
            subCategory,
            colors, // JSON string with color updates
            features,
            materialInfo,
            isFeatured,
            metaTitle,
            metaDescription,
            metaKeywords,
            removeColorImages, // JSON: [{ colorIndex, imageIndices: [0, 2] }]
        } = req.body;

        // Update basic fields
        if (name) product.name = name;
        if (originalPrice) product.originalPrice = originalPrice;
        if (discountedPrice) product.discountedPrice = discountedPrice;
        if (description) product.description = description;
        if (category) product.category = category;
        if (subCategory !== undefined)
            product.subCategory = subCategory || null;
        if (features) product.features = JSON.parse(features);
        if (materialInfo) product.materialInfo = JSON.parse(materialInfo);
        if (isFeatured !== undefined)
            product.isFeatured = isFeatured === "true";

        // SEO fields
        if (metaTitle) product.metaTitle = metaTitle;
        if (metaDescription) product.metaDescription = metaDescription;
        if (metaKeywords) product.metaKeywords = metaKeywords.split(",");

        // Handle color image removal
        if (removeColorImages) {
            const removals = JSON.parse(removeColorImages);
            for (const { colorIndex, imageIndices } of removals) {
                if (product.colors[colorIndex]) {
                    // Sort indices descending to remove from end first
                    const sortedIndices = imageIndices.sort((a, b) => b - a);
                    for (const imgIndex of sortedIndices) {
                        const imageUrl =
                            product.colors[colorIndex].images[imgIndex];
                        if (imageUrl) {
                            await deleteFromCloudinary(imageUrl);
                            product.colors[colorIndex].images.splice(
                                imgIndex,
                                1
                            );
                        }
                    }
                }
            }
        }

        // Update colors (name, hex, stock)
        if (colors) {
            const colorUpdates = JSON.parse(colors);
            colorUpdates.forEach((colorUpdate, index) => {
                if (product.colors[index]) {
                    if (colorUpdate.name)
                        product.colors[index].name = colorUpdate.name;
                    if (colorUpdate.hex !== undefined)
                        product.colors[index].hex = colorUpdate.hex;
                    if (colorUpdate.stock !== undefined)
                        product.colors[index].stock = parseInt(
                            colorUpdate.stock
                        );
                }
            });
        }

        // Handle new image uploads
        // Expected format: color_0_image, color_1_image, etc.
        if (req.files) {
            for (const file of req.files) {
                const match = file.fieldname.match(/color_(\d+)_image/);
                if (match) {
                    const colorIndex = parseInt(match[1]);
                    if (product.colors[colorIndex]) {
                        const url = await uploadOnCloudinary(file.path, "products");
                        if (url) {
                            product.colors[colorIndex].images.push(url);
                        }
                    }
                }
            }
        }

        await product.save();

        // Transform images for response
        const productWithImages = transformProductImages(product, "full");
        productWithImages.totalStock = calculateTotalStock(
            productWithImages.colors
        );

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: productWithImages,
        });
    } catch (error) {
        console.error("Update product error:", error);
        return res.status(500).json({
            message: "Error updating product",
        });
    }
};

// =============================
// UPDATE STOCK (Admin)
// =============================
export const updateStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const { colorIndex, stock } = req.body;

        if (colorIndex === undefined || stock === undefined || stock < 0) {
            return res.status(400).json({
                message: "Color index and valid stock quantity are required",
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        if (!product.colors[colorIndex]) {
            return res.status(400).json({
                message: "Invalid color index",
            });
        }

        product.colors[colorIndex].stock = parseInt(stock);
        await product.save();

        const totalStock = calculateTotalStock(product.colors);

        return res.status(200).json({
            success: true,
            message: "Stock updated successfully",
            colorStock: product.colors[colorIndex].stock,
            totalStock,
        });
    } catch (error) {
        console.error("Update stock error:", error);
        return res.status(500).json({
            message: "Error updating stock",
        });
    }
};

// =============================
// BULK UPDATE PRODUCTS (Admin)
// High-performance batch update using Product.bulkWrite()
// Production-ready for 100-500+ items per request
// =============================
export const bulkUpdateProducts = async (req, res) => {
    try {
        const items = Array.isArray(req.body)
            ? req.body
            : req.body.products || req.body.items;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "An array of products/items to update is required (e.g. { products: [...] } or [...])",
            });
        }

        if (items.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Batch size limit exceeded. Maximum 500 products per request.",
            });
        }

        const bulkOperations = [];
        const validationErrors = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const id = item.productId || item._id || item.id;

            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                validationErrors.push({
                    index: i,
                    id: id || null,
                    error: "Invalid or missing productId / _id",
                });
                continue;
            }

            const setFields = {};

            // Pricing updates
            if (item.originalPrice !== undefined) {
                const orig = Number(item.originalPrice);
                if (isNaN(orig) || orig < 0) {
                    validationErrors.push({ index: i, id, error: "originalPrice must be a positive number" });
                    continue;
                }
                setFields.originalPrice = orig;
            }

            if (item.discountedPrice !== undefined) {
                const disc = Number(item.discountedPrice);
                if (isNaN(disc) || disc < 0) {
                    validationErrors.push({ index: i, id, error: "discountedPrice must be a positive number" });
                    continue;
                }
                setFields.discountedPrice = disc;
            }

            // Status / Featured flags
            if (item.isActive !== undefined) {
                setFields.isActive = Boolean(item.isActive);
            }
            if (item.isFeatured !== undefined) {
                setFields.isFeatured = Boolean(item.isFeatured);
            }

            // Name & Slug
            if (item.name && typeof item.name === "string" && item.name.trim()) {
                setFields.name = item.name.trim();
                if (item.updateSlug !== false) {
                    setFields.slug = slugify(item.name.trim(), { lower: true, strict: true });
                }
            }

            // Description
            if (item.description && typeof item.description === "string") {
                setFields.description = item.description;
            }

            // Category & SubCategory
            if (item.category && mongoose.Types.ObjectId.isValid(item.category)) {
                setFields.category = item.category;
            }
            if (item.subCategory !== undefined) {
                if (item.subCategory === null || item.subCategory === "") {
                    setFields.subCategory = null;
                } else if (mongoose.Types.ObjectId.isValid(item.subCategory)) {
                    setFields.subCategory = item.subCategory;
                }
            }

            // SEO Metadata
            if (item.metaTitle !== undefined) setFields.metaTitle = item.metaTitle;
            if (item.metaDescription !== undefined) setFields.metaDescription = item.metaDescription;
            if (Array.isArray(item.metaKeywords)) setFields.metaKeywords = item.metaKeywords;

            // Full color array replacement
            if (Array.isArray(item.colors)) {
                setFields.colors = item.colors;
            }

            // Specific Color Stock updates:
            // 1) item.stockUpdates: [{ colorIndex: 0, stock: 50 }, ...]
            // 2) item.colorIndex + item.stock
            // 3) item.stock (if total/first color)
            if (Array.isArray(item.stockUpdates)) {
                item.stockUpdates.forEach((su) => {
                    if (su.colorIndex !== undefined && su.stock !== undefined) {
                        setFields[`colors.${su.colorIndex}.stock`] = parseInt(su.stock, 10) || 0;
                    }
                });
            } else if (item.colorIndex !== undefined && item.stock !== undefined) {
                setFields[`colors.${item.colorIndex}.stock`] = parseInt(item.stock, 10) || 0;
            } else if (item.stock !== undefined && !Array.isArray(item.colors)) {
                // If single stock provided without color index, update primary color (index 0)
                setFields["colors.0.stock"] = parseInt(item.stock, 10) || 0;
            }

            // Features & Material Info
            if (item.features && typeof item.features === "object") setFields.features = item.features;
            if (item.materialInfo && typeof item.materialInfo === "object") setFields.materialInfo = item.materialInfo;

            // Check if there are any fields to update
            if (Object.keys(setFields).length === 0) {
                validationErrors.push({
                    index: i,
                    id,
                    error: "No valid fields provided to update",
                });
                continue;
            }

            bulkOperations.push({
                updateOne: {
                    filter: { _id: new mongoose.Types.ObjectId(id) },
                    update: { $set: setFields },
                },
            });
        }

        if (bulkOperations.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid update operations to perform",
                errors: validationErrors,
            });
        }

        // Execute bulkWrite with ordered: false for parallel, resilient execution
        const result = await Product.bulkWrite(bulkOperations, { ordered: false });

        return res.status(200).json({
            success: true,
            message: `Bulk update completed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`,
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            totalSubmitted: items.length,
            processedCount: bulkOperations.length,
            errors: validationErrors.length > 0 ? validationErrors : undefined,
        });
    } catch (error) {
        console.error("Bulk update products error:", error);
        return res.status(500).json({
            success: false,
            message: "Error processing bulk product update",
            error: error.message,
        });
    }
};

// =============================
// DELETE PRODUCT (Admin)
// =============================
export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        // Delete all color images
        for (const color of product.colors) {
            for (const img of color.images) {
                await deleteFromCloudinary(img);
            }
        }

        await Product.findByIdAndDelete(productId);

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Delete product error:", error);
        return res.status(500).json({
            message: "Error deleting product",
        });
    }
};

// =============================
// TOGGLE PRODUCT STATUS (Admin)
// =============================
export const toggleProductStatus = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        product.isActive = !product.isActive;
        await product.save();

        return res.status(200).json({
            success: true,
            message: `Product ${product.isActive ? "activated" : "deactivated"} successfully`,
            isActive: product.isActive,
        });
    } catch (error) {
        console.error("Toggle product status error:", error);
        return res.status(500).json({
            message: "Error toggling product status",
        });
    }
};

// =============================
// ADD COLOR VARIANT (Admin)
// =============================
export const addColorVariant = async (req, res) => {
    try {
        const { productId } = req.params;
        const { name, hex, stock } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        // Upload images for new color
        const colorImages = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const url = await uploadOnCloudinary(file.path, "products");
                if (url) colorImages.push(url);
            }
        }

        product.colors.push({
            name,
            hex: hex || "",
            images: colorImages,
            stock: parseInt(stock) || 0,
        });

        await product.save();

        const productWithImages = transformProductImages(product, "full");
        productWithImages.totalStock = calculateTotalStock(
            productWithImages.colors
        );

        return res.status(200).json({
            success: true,
            message: "Color variant added successfully",
            product: productWithImages,
        });
    } catch (error) {
        console.error("Add color variant error:", error);
        return res.status(500).json({
            message: "Error adding color variant",
        });
    }
};

// =============================
// REMOVE COLOR VARIANT (Admin)
// =============================
export const removeColorVariant = async (req, res) => {
    try {
        const { productId, colorIndex } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        if (!product.colors[colorIndex]) {
            return res.status(400).json({
                message: "Invalid color index",
            });
        }

        if (product.colors.length === 1) {
            return res.status(400).json({
                message: "Cannot remove the last color variant",
            });
        }

        // Delete all images for this color
        for (const img of product.colors[colorIndex].images) {
            await deleteFromCloudinary(img);
        }

        product.colors.splice(colorIndex, 1);
        await product.save();

        const productWithImages = transformProductImages(product, "full");
        productWithImages.totalStock = calculateTotalStock(
            productWithImages.colors
        );

        return res.status(200).json({
            success: true,
            message: "Color variant removed successfully",
            product: productWithImages,
        });
    } catch (error) {
        console.error("Remove color variant error:", error);
        return res.status(500).json({
            message: "Error removing color variant",
        });
    }
};
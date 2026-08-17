import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

const calculateCartTotal = (items) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// =============================
// ADD TO CART
// =============================
export const addToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, colorIndex, quantity } = req.body;

        if (!productId || colorIndex === undefined || !quantity) {
            return res.status(400).json({
                message: "Product, color, and quantity required",
            });
        }

        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
            return res.status(404).json({
                message: "Product not available",
            });
        }

        // Validate color index
        if (!product.colors[colorIndex]) {
            return res.status(400).json({
                message: "Invalid color selection",
            });
        }

        const selectedColor = product.colors[colorIndex];

        // Check stock
        if (selectedColor.stock < quantity) {
            return res.status(400).json({
                message: `Only ${selectedColor.stock} items available in ${selectedColor.name}`,
            });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = await Cart.create({
                user: userId,
                items: [],
            });
        }

        // Check if same product+color combo exists
        const existingItem = cart.items.find(
            (item) =>
                item.product.toString() === productId &&
                item.colorIndex === colorIndex
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;

            // Check stock for updated quantity
            if (selectedColor.stock < newQuantity) {
                return res.status(400).json({
                    message: `Only ${selectedColor.stock} items available in ${selectedColor.name}`,
                });
            }

            existingItem.quantity = newQuantity;
            // Sync price (important after bulk price update)
            existingItem.price = product.discountedPrice;
        } else {
            cart.items.push({
                product: productId,
                colorIndex,
                colorName: selectedColor.name,
                colorHex: selectedColor.hex,
                quantity,
                price: product.discountedPrice,
            });
        }

        cart.totalAmount = calculateCartTotal(cart.items);

        await cart.save();

        // Populate and transform for response
        await cart.populate("items.product");

        const cartResponse = cart.toObject();
        cartResponse.items = cartResponse.items.map((item) => {
            if (item.product?.colors?.[item.colorIndex]?.images?.[0]) {
                const firstImage =
                    item.product.colors[item.colorIndex].images[0];
                item.product.thumbnail =
                    typeof firstImage === "string"
                        ? firstImage
                        : firstImage.thumbnail ||
                          firstImage.card ||
                          firstImage.original;
            }
            return item;
        });

        return res.status(200).json({
            success: true,
            message: "Product added to cart",
            cart: cartResponse,
        });
    } catch (error) {
        console.error("Add to cart error:", error);
        return res.status(500).json({
            message: "Error adding to cart",
        });
    }
};

// =============================
// GET USER CART
// =============================
export const getCart = async (req, res) => {
    try {
        const userId = req.user._id;

        let cart = await Cart.findOne({ user: userId }).populate(
            "items.product"
        );

        if (!cart) {
            return res.status(200).json({
                success: true,
                items: [],
                totalAmount: 0,
            });
        }

        // Sync prices with latest product prices and validate stock
        let updated = false;
        const validItems = [];

        for (const item of cart.items) {
            if (!item.product || !item.product.isActive) {
                // Product deleted or inactive - skip
                continue;
            }

            const productColor = item.product.colors?.[item.colorIndex];

            if (!productColor) {
                // Color variant removed - skip
                continue;
            }

            // Update price if changed
            if (item.price !== item.product.discountedPrice) {
                item.price = item.product.discountedPrice;
                updated = true;
            }

            // Update color info if changed
            if (
                item.colorName !== productColor.name ||
                item.colorHex !== productColor.hex
            ) {
                item.colorName = productColor.name;
                item.colorHex = productColor.hex;
                updated = true;
            }

            // Adjust quantity if exceeds available stock
            if (item.quantity > productColor.stock) {
                if (productColor.stock > 0) {
                    item.quantity = productColor.stock;
                    updated = true;
                } else {
                    // Out of stock - skip
                    continue;
                }
            }

            validItems.push(item);
        }

        // Update cart if items were filtered or modified
        if (cart.items.length !== validItems.length || updated) {
            cart.items = validItems;
            cart.totalAmount = calculateCartTotal(cart.items);
            await cart.save();
        }

        // Transform images for response
        const cartResponse = cart.toObject();
        cartResponse.items = cartResponse.items.map((item) => {
            const itemObj = { ...item };

            if (item.product?.colors?.[item.colorIndex]?.images?.[0]) {
                const colorImages = item.product.colors[item.colorIndex].images;
                const firstImage = colorImages[0];

                itemObj.product.thumbnail =
                    typeof firstImage === "string"
                        ? firstImage
                        : firstImage.thumbnail ||
                          firstImage.card ||
                          firstImage.original;

                itemObj.product.image =
                    typeof firstImage === "string"
                        ? firstImage
                        : firstImage.card ||
                          firstImage.medium ||
                          firstImage.original;
            }

            // Add available stock for this color
            if (item.product?.colors?.[item.colorIndex]) {
                itemObj.availableStock =
                    item.product.colors[item.colorIndex].stock;
            }

            return itemObj;
        });

        return res.status(200).json({
            success: true,
            cart: cartResponse,
        });
    } catch (error) {
        console.error("Get cart error:", error);
        return res.status(500).json({
            message: "Error fetching cart",
        });
    }
};

// =============================
// UPDATE CART ITEM QUANTITY
// =============================
export const updateCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, colorIndex, quantity } = req.body;

        if (colorIndex === undefined) {
            return res.status(400).json({
                message: "Color index required",
            });
        }

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
            });
        }

        const itemIndex = cart.items.findIndex(
            (i) =>
                i.product.toString() === productId &&
                i.colorIndex === colorIndex
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                message: "Item not found in cart",
            });
        }

        if (quantity <= 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Check stock
            const product = await Product.findById(productId);
            if (product?.colors?.[colorIndex]) {
                const availableStock = product.colors[colorIndex].stock;
                if (quantity > availableStock) {
                    return res.status(400).json({
                        message: `Only ${availableStock} items available`,
                    });
                }
            }

            cart.items[itemIndex].quantity = quantity;
        }

        cart.totalAmount = calculateCartTotal(cart.items);

        await cart.save();

        // Populate and transform
        await cart.populate("items.product");

        const cartResponse = cart.toObject();
        cartResponse.items = cartResponse.items.map((item) => {
            if (item.product?.colors?.[item.colorIndex]?.images?.[0]) {
                const firstImage =
                    item.product.colors[item.colorIndex].images[0];
                item.product.thumbnail =
                    typeof firstImage === "string"
                        ? firstImage
                        : firstImage.thumbnail ||
                          firstImage.card ||
                          firstImage.original;
            }
            return item;
        });

        return res.status(200).json({
            success: true,
            cart: cartResponse,
        });
    } catch (error) {
        console.error("Update cart error:", error);
        return res.status(500).json({
            message: "Error updating cart",
        });
    }
};

// =============================
// REMOVE CART ITEM
// =============================
export const removeCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;
        const { colorIndex } = req.query;

        if (colorIndex === undefined) {
            return res.status(400).json({
                message: "Color index required",
            });
        }

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
            });
        }

        cart.items = cart.items.filter(
            (item) =>
                !(
                    item.product.toString() === productId &&
                    item.colorIndex === parseInt(colorIndex)
                )
        );

        cart.totalAmount = calculateCartTotal(cart.items);

        await cart.save();

        return res.status(200).json({
            success: true,
            cart,
        });
    } catch (error) {
        console.error("Remove item error:", error);
        return res.status(500).json({
            message: "Error removing item",
        });
    }
};

// =============================
// CLEAR CART
// =============================
export const clearCart = async (req, res) => {
    try {
        const userId = req.user._id;

        await Cart.findOneAndUpdate(
            { user: userId },
            { items: [], totalAmount: 0 }
        );

        return res.status(200).json({
            success: true,
            message: "Cart cleared",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error clearing cart",
        });
    }
};

// =============================
// GET ALL CARTS (Admin)
// =============================
export const getAllCarts = async (req, res) => {
    try {
        const carts = await Cart.find({ items: { $not: { $size: 0 } } })
            .populate("user", "full_name email profile_image")
            .populate("items.product", "name colors discountedPrice")
            .sort({ updatedAt: -1 });

        // Transform for response
        const cartsWithImages = carts.map((cart) => {
            const cartObj = cart.toObject();

            // Transform user profile image
            if (cartObj.user?.profile_image) {
                cartObj.user.profile_image = cartObj.user.profile_image;
            }

            // Transform cart items
            cartObj.items = cartObj.items.map((item) => {
                if (item.product?.colors?.[item.colorIndex]?.images?.[0]) {
                    const firstImage =
                        item.product.colors[item.colorIndex].images[0];
                    item.product.thumbnail =
                        typeof firstImage === "string"
                            ? firstImage
                            : firstImage.thumbnail ||
                              firstImage.card ||
                              firstImage.original;
                }

                // Add available stock
                if (item.product?.colors?.[item.colorIndex]) {
                    item.availableStock =
                        item.product.colors[item.colorIndex].stock;
                }

                return item;
            });

            return cartObj;
        });

        return res.status(200).json({
            success: true,
            carts: cartsWithImages,
        });
    } catch (error) {
        console.error("Get all carts error:", error);
        return res.status(500).json({
            message: "Error fetching carts",
        });
    }
};

// =============================
// MERGE GUEST CART INTO USER CART
// =============================
export const mergeCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { items = [] } = req.body;

        if (!Array.isArray(items)) {
            return res.status(400).json({ message: "items must be an array" });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        for (const incoming of items) {
            const productId = incoming.productId;
            const colorIndex = Number(incoming.colorIndex) || 0;
            const quantity = Number(incoming.quantity) || 1;

            if (!productId || quantity < 1) continue;

            const product = await Product.findById(productId);
            if (!product || !product.isActive) continue;
            if (!product.colors?.[colorIndex]) continue;

            const selectedColor = product.colors[colorIndex];
            const existingItem = cart.items.find(
                (item) =>
                    item.product.toString() === String(productId) &&
                    item.colorIndex === colorIndex
            );

            if (existingItem) {
                const newQty = Math.min(
                    existingItem.quantity + quantity,
                    selectedColor.stock || existingItem.quantity + quantity
                );
                existingItem.quantity = newQty;
                existingItem.price = product.discountedPrice;
            } else {
                const qty = Math.min(quantity, selectedColor.stock || quantity);
                if (qty < 1) continue;
                cart.items.push({
                    product: productId,
                    colorIndex,
                    colorName: selectedColor.name,
                    colorHex: selectedColor.hex,
                    quantity: qty,
                    price: product.discountedPrice,
                });
            }
        }

        cart.totalAmount = calculateCartTotal(cart.items);
        await cart.save();
        await cart.populate("items.product");

        const cartResponse = cart.toObject();
        cartResponse.items = cartResponse.items.map((item) => {
            if (item.product?.colors?.[item.colorIndex]?.images?.[0]) {
                const firstImage =
                    item.product.colors[item.colorIndex].images[0];
                item.product.thumbnail =
                    typeof firstImage === "string"
                        ? firstImage
                        : firstImage.thumbnail ||
                          firstImage.card ||
                          firstImage.original;
            }
            return item;
        });

        return res.status(200).json({
            success: true,
            message: "Cart merged successfully",
            cart: cartResponse,
        });
    } catch (error) {
        console.error("Merge cart error:", error);
        return res.status(500).json({
            message: "Error merging cart",
        });
    }
};

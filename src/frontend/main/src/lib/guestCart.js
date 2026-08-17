const GUEST_CART_KEY = "gf_guest_cart_v1";

export function loadGuestCart() {
  if (typeof window === "undefined") {
    return { items: [], totalAmount: 0 };
  }
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return { items: [], totalAmount: 0 };
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      totalAmount: Number(parsed.totalAmount) || 0,
    };
  } catch {
    return { items: [], totalAmount: 0 };
  }
}

export function saveGuestCart(cart) {
  if (typeof window === "undefined") return;
  const payload = {
    items: cart.items || [],
    totalAmount: cart.totalAmount || 0,
  };
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(payload));
}

export function clearGuestCartStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CART_KEY);
}

export function calcGuestTotal(items) {
  return items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );
}

export function buildGuestItem({ product, productId, colorIndex, quantity }) {
  const id = productId || product?._id;
  const colors = product?.colors || [];
  const color = colors[colorIndex] || {};
  const firstImage = color?.images?.[0];
  const thumbnail =
    typeof firstImage === "string"
      ? firstImage
      : firstImage?.card || firstImage?.original || firstImage?.thumbnail || null;

  return {
    product: {
      _id: id,
      name: product?.name || "Product",
      slug: product?.slug || "",
      originalPrice: product?.originalPrice,
      discountedPrice: product?.discountedPrice ?? product?.price,
      colors: colors,
      category: product?.category,
      thumbnail,
      image: thumbnail,
      isActive: product?.isActive !== false,
    },
    productId: id,
    colorIndex: Number(colorIndex) || 0,
    colorName: color?.name || "",
    colorHex: color?.hex || "",
    quantity: Number(quantity) || 1,
    price: product?.discountedPrice ?? product?.price ?? 0,
  };
}

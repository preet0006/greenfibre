import WishlistClient from "./WishlistClient";

export const metadata = {
  title: "My Wishlist",
  description: "View and manage your saved products on greenfibre.",
};

export default function WishlistPage() {
  return <WishlistClient />;
}

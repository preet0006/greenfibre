import CartClient from "./CartClient";

export const metadata = {
  title: "My Cart",
  description: "Review your cart and proceed to checkout on Greenfibre.",
};

export default function CartPage() {
  return <CartClient />;
}

import type { Metadata } from "next";
import CartCheckout from "@/src/components/features/portal/checkout/CartCheckout";
import { getBranches, getPublicProducts } from "@/src/services/data";
import { CART_PAGE } from "@/src/constants/portal/pages";

export const metadata: Metadata = { title: CART_PAGE.metaTitle };
export const dynamic = "force-dynamic";
export default async function CartPage() {
  const [branches, products] = await Promise.all([
    getBranches(false).catch(() => []),
    getPublicProducts().catch(() => []),
  ]);
  const brands = Object.fromEntries(products.map((product) => [product.slug, product.brand || ""]));
  return (
    <main className="cart-page quick-order-page">
      <div className="shell quick-order-shell">
        <CartCheckout branches={branches} recommendations={products.slice(0, 4)} brands={brands} />
      </div>
    </main>
  );
}

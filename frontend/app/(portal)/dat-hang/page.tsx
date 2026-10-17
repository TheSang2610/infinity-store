import type { Metadata } from "next";
import { getPublicProducts } from "@/src/services/data";
import OrderReview from "@/src/components/features/portal/checkout/OrderReview";
import { ORDER_PAGE } from "@/src/constants/portal/pages";

export const metadata: Metadata = {
  title: ORDER_PAGE.metaTitle,
  description: ORDER_PAGE.metaDescription,
};

export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const products = await getPublicProducts();
  return (
    <main className="quick-order-page">
      <section className="quick-order-shell shell">
        <header className="quick-order-heading">
          <span>{ORDER_PAGE.eyebrow}</span>
          <h1>{ORDER_PAGE.title}</h1>
          <p>{ORDER_PAGE.text}</p>
        </header>
        <OrderReview products={products} />
      </section>
    </main>
  );
}

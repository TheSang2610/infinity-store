"use client";

import Link from "next/link";
import { CHECKOUT } from "@/src/constants/portal/checkout";
import Image from "next/image";
import ProductCard from "@/src/components/features/portal/catalog/ProductCard";
import type { Product } from "@/src/lib/products";

type EmptyCartProps = {
  recommendations: Product[];
};

export default function EmptyCart({ recommendations }: EmptyCartProps) {
  return (
    <div className="cps-cart-page">
      <div className="cps-cart-container">
        {/* Topbar: Tiếp tục mua sắm + Freeship */}
        <div className="cps-cart-topbar">
          <Link href="/" className="cps-cart-back">
            <span>{CHECKOUT.backToShop}</span>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <span style={{ color: "#475569" }}>{CHECKOUT.cartTitle}</span>
          </Link>
          <div className="cps-freeship-pill">
            {CHECKOUT.freeShipping}</div>
        </div>

        {/* Controls Bar */}
        <div className="cps-cart-ctrl-bar">
          <label className="cps-cart-check-all">
            <input type="checkbox" defaultChecked disabled />
            <span>{CHECKOUT.all}</span>
          </label>
          <button type="button" className="cps-cart-ctrl-btn">
            {CHECKOUT.default}</button>
        </div>

        {/* Main Empty State Grid */}
        <div className="cps-cart-empty-grid">
          <div className="cps-cart-empty-card">
            <Image
              src="/cart/empty-cart.svg"
              alt={CHECKOUT.emptyLabel}
              width={140}
              height={140}
              className="cps-empty-mascot"
              unoptimized
              priority
            />
            <h3>{CHECKOUT.emptyTitle}</h3>
            <p>{CHECKOUT.emptyText}</p>
            <Link href="/" className="cps-empty-cta-link">
              {CHECKOUT.browseMore}</Link>
          </div>

          <aside className="cps-qr-promo-card">
            <Image
              src="/cart/qr-app.png"
              alt="QR Infinity Store App"
              width={80}
              height={80}
              className="cps-qr-img"
              unoptimized
            />
            <p className="cps-qr-text">
              {CHECKOUT.appPromo}</p>
          </aside>
        </div>

        {recommendations.length > 0 && (
          <section className="cps-recommend-section">
            <h2 className="cps-recommend-title">{CHECKOUT.recommendations}</h2>
            <div className="cps-recommend-grid">
              {recommendations.map((product) => <ProductCard key={product.slug} product={product} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

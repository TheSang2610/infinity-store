"use client";

import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/src/lib/products";

type RelatedProductsProps = {
  relatedProducts: Product[];
};

export default function RelatedProducts({ relatedProducts }: RelatedProductsProps) {
  return (
    <section className="pdp-section-wrap" aria-labelledby="pdp-related-heading">
      <header className="pdp-section-header">
        <span className="pdp-section-eyebrow">{PRODUCT_DETAIL.relatedEyebrow}</span>
        <h2 id="pdp-related-heading" className="pdp-section-title">
          {PRODUCT_DETAIL.relatedTitle}</h2>
      </header>

      <div className="pdp-related-grid">
        {relatedProducts.map((rel) => {
          const relPrice = rel.salePrice || rel.sellingPrice || rel.price;
          const formattedRelPrice = relPrice.toLowerCase().startsWith(PRODUCT_DETAIL.from) ? relPrice : PRODUCT_DETAIL.priceFrom(relPrice);
          return (
            <article key={rel.slug} className="product-card" aria-labelledby={`rel-title-${rel.slug}`}>
              <div className="product-image-wrapper">
                {rel.badge && <span className="product-badge badge-pro">{rel.badge}</span>}
                <Link
                  href={`/san-pham/${rel.slug}`}
                  className="product-image"
                  style={{ width: "100%", height: "100%", position: "relative", display: "block" }}
                >
                  <Image
                    src={rel.image}
                    alt={rel.name}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 280px"
                    style={{ objectFit: "contain", padding: "16px" }}
                  />
                </Link>
              </div>
              <div className="product-body">
                <p className="product-brand" style={{ color: "#0088cc", fontWeight: 700, fontSize: "11.5px" }}>
                  {rel.brand || PRODUCT_DETAIL.appleGenuine}
                </p>
                <h3 id={`rel-title-${rel.slug}`} style={{ minHeight: "42px" }}>
                  <Link href={`/san-pham/${rel.slug}`} style={{ color: "#0f172a", fontWeight: 700 }}>
                    {rel.name}
                  </Link>
                </h3>
                <div className="product-meta">
                  <div>
                    <strong className="product-price-highlight">{formattedRelPrice}</strong>
                  </div>
                </div>
                <div className="product-actions" style={{ marginTop: "auto", paddingTop: "10px" }}>
                  <Link
                    href={`/san-pham/${rel.slug}`}
                    className="mini-cta"
                    style={{ background: "#0088cc", color: "#fff", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 700, width: "100%", textAlign: "center" }}
                  >
                    {PRODUCT_DETAIL.viewAndBuy}</Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { MACBOOK_SHOWCASE } from "@/src/constants/portal/preorder-page";
import { PreorderProduct } from "@/src/constants/portal/preorder-products";
import Image from "next/image";

type OtherProductsSectionProps = {
  allProducts: PreorderProduct[];
};

export default function OtherProductsSection({ allProducts }: OtherProductsSectionProps) {
  return (
    <section className="apple-mbp-section" style={{ borderTop: "1px solid var(--apple-card-border)", paddingTop: "60px", paddingBottom: "80px" }}>
      <div className="apple-mbp-section-header text-center">
        <span className="apple-mbp-eyebrow">{MACBOOK_SHOWCASE.otherEyebrow}</span>
        <h2 className="apple-mbp-section-title">{MACBOOK_SHOWCASE.otherTitle}</h2>
        <p className="apple-mbp-section-sub">
          {MACBOOK_SHOWCASE.otherText}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", maxWidth: "960px", margin: "0 auto" }}>
        {allProducts
          .filter((p) => p.family !== "macbook")
          .slice(0, 3)
          .map((p) => (
            <div
              key={p.id}
              style={{
                background: "var(--apple-card-bg)",
                border: "1px solid var(--apple-card-border)",
                borderRadius: "20px",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <div style={{ position: "relative", height: "160px", marginBottom: "16px" }}>
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="280px"
                  style={{ objectFit: "contain" }}
                />
              </div>
              <h4 style={{ fontSize: "18px", color: "#fff", margin: "0 0 8px" }}>{p.name}</h4>
              <p style={{ color: "var(--apple-text-secondary)", fontSize: "13px", margin: "0 0 16px" }}>
                {p.description}
              </p>
              <a
                href="#configurator"
                className="apple-mbp-btn-secondary"
                style={{ width: "100%", justifyContent: "center", boxSizing: "border-box" }}
              >
                {MACBOOK_SHOWCASE.otherCta}</a>
            </div>
          ))}
      </div>
    </section>
  );
}

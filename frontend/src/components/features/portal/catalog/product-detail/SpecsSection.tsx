"use client";

import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";
import type { Product } from "@/src/lib/products";

type SpecsSectionProps = {
  product: Product;
};

export default function SpecsSection({ product }: SpecsSectionProps) {
  return (
    <section id="pdp-specifications" className="pdp-section-wrap" aria-labelledby="pdp-specs-heading">
      <header className="pdp-section-header">
        <span className="pdp-section-eyebrow">{PRODUCT_DETAIL.specsEyebrow}</span>
        <h2 id="pdp-specs-heading" className="pdp-section-title">
          {PRODUCT_DETAIL.specsTitle}</h2>
      </header>

      <div className="pdp-specs-container">
        {product.specs.map((spec, i) => {
          const parts = spec.split(/:\s*/);
          const label = parts.length > 1 ? parts[0] : PRODUCT_DETAIL.featureNumber(i + 1);
          const value = parts.length > 1 ? parts.slice(1).join(" ") : spec;
          return (
            <div key={i} className="pdp-spec-row">
              <span className="pdp-spec-key">{label}</span>
              <span className="pdp-spec-val">{value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

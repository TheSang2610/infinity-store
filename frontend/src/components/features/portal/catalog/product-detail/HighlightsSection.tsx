"use client";

import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";
import type { Product } from "@/src/lib/products";

type HighlightsSectionProps = {
  product: Product;
  specHighlights: ({ badge: string; title: "Hiệu Năng Vượt Trội"; desc: string; icon: string; } | { badge: string; title: "Hiển Thị Đỉnh Cao"; desc: string; icon: string; } | { badge: string; title: "Nhiếp Ảnh Chuyên Nghiệp"; desc: string; icon: string; } | { badge: string; title: "Vật Liệu Cao Cấp"; desc: string; icon: string; } | { badge: "PIN BỀN BỈ"; title: "Thời Lượng Vượt Trội"; desc: string; icon: string; } | { badge: "CÔNG NGHỆ"; title: "Tính Năng Nổi Bật"; desc: string; icon: string; })[];
};

export default function HighlightsSection({ product, specHighlights }: HighlightsSectionProps) {
  return (
    <section id="pdp-highlights" className="pdp-section-wrap" aria-labelledby="pdp-highlights-heading">
      <header className="pdp-section-header">
        <span className="pdp-section-eyebrow">{PRODUCT_DETAIL.highlightsEyebrow}</span>
        <h2 id="pdp-highlights-heading" className="pdp-section-title">
          {PRODUCT_DETAIL.highlightsTitle}{product.name}
        </h2>
        <p className="pdp-section-desc">
          {PRODUCT_DETAIL.highlightsText}</p>
      </header>

      <div className="pdp-highlights-grid">
        {specHighlights.map((hl, i) => (
          <article key={i} className="pdp-highlight-card">
            <div className="pdp-highlight-icon-wrap">{hl.icon}</div>
            <span className="pdp-section-eyebrow">{hl.badge}</span>
            <h3 className="pdp-highlight-title">{hl.title}</h3>
            <p className="pdp-highlight-detail">{hl.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import ShopProductCard from "@/src/components/features/portal/catalog/ShopProductCard";
import { useState } from "react";
import { PRODUCT_BLOCK } from "@/src/constants/portal/home";

export interface ShowcaseItem {
  slug: string;
  name: string;
  category: string;
  brand?: string;
  image: string;
  price: string;
  salePrice?: string;
  sellingPrice?: string;
  badge?: string;
  specs?: string[];
}

interface ProductBlockProps {
  title: string;
  viewAllHref: string;
  filterTabs: { label: string; filterKey: string }[];
  products: ShowcaseItem[];
}

export default function StorefrontProductBlock({
  title,
  viewAllHref,
  filterTabs,
  products,
}: ProductBlockProps) {
  const [direction, setDirection] = useState("next");
  const [activeTab, setActiveTab] = useState(filterTabs[0]?.filterKey || "all");

  const filteredProducts = products.filter((p) => {
    if (activeTab === "all") return true;
    const lowerSearch = (p.name + " " + (p.brand || "") + " " + (p.badge || "")).toLowerCase();
    return lowerSearch.includes(activeTab.toLowerCase()) || p.category.toLowerCase().includes(activeTab.toLowerCase());
  });

  const displayList = (filteredProducts.length > 0 ? filteredProducts : products).slice(0, 10);

  return (
    <section className="cps-container cps-block-section" aria-label={title}>
      {/* Block Header: Title + Filter Pills + View All */}
      <div className="cps-block-header">
        <div className="cps-block-heading-copy">
          <span className="cps-block-kicker">{PRODUCT_BLOCK.eyebrow}</span>
          <h2 className="cps-block-title">{title}</h2>
        </div>

        <div className="cps-block-filters">
          {filterTabs.map((tab) => (
            <button
              key={tab.filterKey}
              type="button"
              className={`cps-filter-pill ${activeTab === tab.filterKey ? "is-active" : ""}`}
              aria-pressed={activeTab === tab.filterKey}
              onClick={() => {
                setDirection(filterTabs.findIndex((item) => item.filterKey === tab.filterKey) > filterTabs.findIndex((item) => item.filterKey === activeTab) ? "next" : "previous");
                setActiveTab(tab.filterKey);
              }}
            >
              {tab.label}
            </button>
          ))}

          <Link href={viewAllHref} className="cps-view-all-link">
            {PRODUCT_BLOCK.viewAll}</Link>
        </div>
      </div>

      {/* Lưới sản phẩm: ảnh, tên, giá (5 cột desktop, 2 cột mobile) */}
      <div className="cps-block-grid shop-filter-results" key={activeTab} data-slide-direction={direction}>
        {displayList.map((item) => (
          <ShopProductCard key={item.slug} product={item} />
        ))}
      </div>
    </section>
  );
}

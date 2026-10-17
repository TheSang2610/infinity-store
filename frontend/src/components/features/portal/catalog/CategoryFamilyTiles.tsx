"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/src/lib/products";
import { CATEGORY_FAMILY_TILES } from "@/src/constants/portal/catalog";

type FamilyCategory = Extract<Product["category"], "iphone" | "ipad" | "macbook">;
type Family = { label: string; note: string; value: string; image: string };

const categoryFamilies: Record<FamilyCategory, Family[]> = {
  iphone: [
    { label: "iPhone 18 Pro Series", note: CATEGORY_FAMILY_TILES.fourColorsTo2tb, value: "18", image: "/products/iphone-18/pro-max-do.png" },
    { label: "iPhone 17", note: CATEGORY_FAMILY_TILES.newGeneration, value: "17", image: "/products/apple/iphone-17-official/mist-blue.jpg" },
    { label: "iPhone 16", note: CATEGORY_FAMILY_TILES.powerfulBalanced, value: "16", image: "/products/iphone-16.png" },
    { label: "iPhone 15", note: CATEGORY_FAMILY_TILES.usbC, value: "15", image: "/products/iphone-15.png" },
    { label: "iPhone 14", note: CATEGORY_FAMILY_TILES.durableFamiliar, value: "14", image: "/products/apple/iphone-models/iphone-14-plus.png" },
    { label: "iPhone 13, 12 & SE", note: CATEGORY_FAMILY_TILES.accessible, value: "legacy", image: "/products/iphone-13.jpg" },
  ],
  ipad: [
    { label: "iPad Pro", note: CATEGORY_FAMILY_TILES.proPerformance, value: "pro", image: "/products/apple/ipad-pro/space-black.jpg" },
    { label: "iPad mini", note: CATEGORY_FAMILY_TILES.compact, value: "mini", image: "/products/apple/ipad-mini-a17/colors.png" },
    { label: "iPad", note: CATEGORY_FAMILY_TILES.everydayFlexible, value: "standard", image: "/products/apple/ipad-a16/blue.jpg" },
    { label: "iPad Air", note: CATEGORY_FAMILY_TILES.thinPowerful, value: "air", image: "/products/apple/ipad-air/purple.jpg" },
  ],
  macbook: [
    { label: "MacBook Air", note: CATEGORY_FAMILY_TILES.thinLongBattery, value: "air", image: "/products/apple/macbook-air/sky-blue.jpg" },
    { label: "MacBook Pro", note: CATEGORY_FAMILY_TILES.deepPerformance, value: "pro", image: "/products/apple/macbook-pro/space-black.jpg" },
    { label: "MacBook Neo", note: CATEGORY_FAMILY_TILES.lightAccessible, value: "neo", image: "/products/apple/macbook-neo/indigo.jpg" },
  ],
};

const categoryTitles: Record<FamilyCategory, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  macbook: "MacBook",
};

export default function CategoryFamilyTiles({ category }: { category: FamilyCategory }) {
  const [selected, setSelected] = useState("");
  const families = categoryFamilies[category];

  function selectFamily(value: string) {
    setSelected(value);
    window.dispatchEvent(new CustomEvent("catalog-family-select", { detail: { category, group: value } }));
    window.setTimeout(() => document.getElementById("catalog-products")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }

  return <section className="catalog-family-section" aria-labelledby={`${category}-family-title`}>
    <div className="shell">
      <p className="catalog-family-kicker">{CATEGORY_FAMILY_TILES.label}</p>
      <h1 id={`${category}-family-title`}>{categoryTitles[category]}</h1>
      <div className={`catalog-family-grid catalog-family-grid-${families.length}`}>
        {families.map((family) => <button
          className={`catalog-family-tile${selected === family.value ? " is-active" : ""}`}
          type="button"
          onClick={() => selectFamily(family.value)}
          aria-pressed={selected === family.value}
          key={family.value}
        >
          <span className="catalog-family-image"><Image src={family.image} alt="" fill style={{ objectFit: "contain" }} sizes="(max-width: 700px) 42vw, 210px" unoptimized /></span>
          <span className="catalog-family-copy"><strong>{family.label}</strong><small>{family.note}</small></span>
        </button>)}
      </div>
    </div>
  </section>;
}

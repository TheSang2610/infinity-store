"use client";

import { useState } from "react";
import "@/src/components/features/portal/preorder/macbook-pro-apple.css";
import { COLORS, type MacBookProShowcaseProps } from "./macbook-data";
import MacBookRibbon from "./macbook/MacBookRibbon";
import MacBookLocalNav from "./macbook/MacBookLocalNav";
import MacBookHero from "./macbook/MacBookHero";
import HighlightsSection from "./macbook/HighlightsSection";
import ProductViewerSection from "./macbook/ProductViewerSection";
import PerformanceSection from "./macbook/PerformanceSection";
import MacBookConfigurator from "./macbook/MacBookConfigurator";
import OtherProductsSection from "./macbook/OtherProductsSection";

export default function MacBookProShowcase({
  branches,
  customer,
  allProducts,
}: MacBookProShowcaseProps) {
  // Config state
  const [selectedSize, setSelectedSize] = useState<"14" | "16">("14");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedVariantId, setSelectedVariantId] = useState("14-m5-pro");

  return (
    <div className="apple-mbp-root">
      {/* 0. APPLE GLOBAL BRAND RIBBON */}
      <MacBookRibbon />

      {/* 1. STICKY LOCALNAV */}
      <MacBookLocalNav />

      {/* 2. CINEMATIC HERO SECTION */}
      <MacBookHero />

      {/* 3. BENTO HIGHLIGHTS GRID ("CÁC ĐIỂM NỔI BẬT") */}
      <HighlightsSection />

      {/* 4. INTERACTIVE PRODUCT VIEWER & COLOR / SIZE SWITCHER ("NGẮM NHÌN CẬN CẢNH") */}
      <ProductViewerSection selectedSize={selectedSize} selectedColor={selectedColor} setSelectedColor={setSelectedColor} setSelectedSize={setSelectedSize} setSelectedVariantId={setSelectedVariantId} />

      {/* 5. CHIP MATRIX / DEEP DIVE ("BA CHIP. TIỀM NĂNG BẤT TẬN") */}
      <PerformanceSection />

      {/* 6. PRE-ORDER CONFIGURATOR SECTION (TÙY CHỌN CẤU HÌNH & ĐẶT TRƯỚC) */}
      <MacBookConfigurator selectedColor={selectedColor} selectedVariantId={selectedVariantId} setSelectedVariantId={setSelectedVariantId} setSelectedSize={setSelectedSize} setSelectedColor={setSelectedColor} customer={customer} branches={branches} />

      {/* 7. OTHER APPLE PRODUCTS PREORDER FOOTER */}
      <OtherProductsSection allProducts={allProducts} />
    </div>
  );
}

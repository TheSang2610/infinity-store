"use client";

import { MACBOOK_SHOWCASE } from "@/src/constants/portal/preorder-page";
import { COLORS, MBP_VARIANTS } from "../macbook-data";
import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";

type ProductViewerSectionProps = {
  selectedSize: "14" | "16";
  selectedColor: { name: string; viName: "Đen Không Gian"; hex: string; } | { name: string; viName: "Bạc"; hex: string; };
  setSelectedColor: Dispatch<SetStateAction<{ name: string; viName: "Đen Không Gian"; hex: string; } | { name: string; viName: "Bạc"; hex: string; }>>;
  setSelectedSize: Dispatch<SetStateAction<"14" | "16">>;
  setSelectedVariantId: Dispatch<SetStateAction<string>>;
};

export default function ProductViewerSection({ selectedSize, selectedColor, setSelectedColor, setSelectedSize, setSelectedVariantId }: ProductViewerSectionProps) {
  function handleSizeChange(size: "14" | "16") {
    setSelectedSize(size);
    const candidate = MBP_VARIANTS.find((v) => v.size === size);
    if (candidate) {
      setSelectedVariantId(candidate.id);
    }
  }

  return (
    <section id="product-viewer" className="apple-mbp-section">
      <div className="apple-mbp-section-header text-center">
        <span className="apple-mbp-eyebrow">{MACBOOK_SHOWCASE.designEyebrow}</span>
        <h2 className="apple-mbp-section-title">{MACBOOK_SHOWCASE.designTitle}</h2>
        <p className="apple-mbp-section-sub">
          {MACBOOK_SHOWCASE.designText}</p>
      </div>

      <div className="apple-mbp-viewer-stage">
        {/* Controls: Size & Color */}
        <div className="apple-mbp-viewer-controls">
          {/* Size Switch */}
          <div className="apple-mbp-size-switch" role="tablist" aria-label={MACBOOK_SHOWCASE.chooseSize}>
            <button
              type="button"
              className={`apple-mbp-size-btn${selectedSize === "14" ? " is-active" : ""}`}
              onClick={() => handleSizeChange("14")}
            >
              14-inch
            </button>
            <button
              type="button"
              className={`apple-mbp-size-btn${selectedSize === "16" ? " is-active" : ""}`}
              onClick={() => handleSizeChange("16")}
            >
              16-inch
            </button>
          </div>

          {/* Color Swatch Picker */}
          <div className="apple-mbp-color-picker" aria-label={MACBOOK_SHOWCASE.chooseColor}>
            {COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`apple-mbp-color-swatch-item${selectedColor.name === c.name ? " is-active" : ""}`}
                onClick={() => setSelectedColor(c)}
              >
                <span
                  className="apple-mbp-color-circle"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden="true"
                />
                <span>{c.viName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Viewer Visual Display */}
        <div className="apple-mbp-viewer-visual">
          <div className="apple-mbp-viewer-img-wrap">
            <Image
              src="/apple-macbook-pro/product-viewer-hero.jpg"
              alt={MACBOOK_SHOWCASE.imageAlt(String(selectedSize), selectedColor.viName)}
              width={820}
              height={420}
              className="apple-mbp-hero-img"
            />
          </div>
        </div>

        {/* Real-time Specs Bar */}
        <div className="apple-mbp-viewer-specs-bar">
          <div className="apple-mbp-spec-item">
            <strong>{selectedSize === "14" ? "14.2 inch" : "16.2 inch"}</strong>
            <span>Liquid Retina XDR Nano-texture</span>
          </div>
          <div className="apple-mbp-spec-item">
            <strong>{selectedSize === "14" ? "1.55 kg" : "2.14 kg"}</strong>
            <span>{MACBOOK_SHOWCASE.aluminumBody}</span>
          </div>
          <div className="apple-mbp-spec-item">
            <strong>{selectedSize === "14" ? MACBOOK_SHOWCASE.hours24 : MACBOOK_SHOWCASE.hours24}</strong>
            <span>{MACBOOK_SHOWCASE.maxBattery}</span>
          </div>
          <div className="apple-mbp-spec-item">
            <strong>3x Thunderbolt 5</strong>
            <span>HDMI, SDXC, MagSafe 3</span>
          </div>
        </div>
      </div>
    </section>
  );
}

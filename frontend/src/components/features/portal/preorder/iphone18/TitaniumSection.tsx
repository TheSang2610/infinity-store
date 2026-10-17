"use client";

import { IPHONE18_SHOWCASE } from "@/src/constants/portal/preorder-page";
import Image from "next/image";
import { COLOR_OPTIONS, ColorOption, MODELS } from "../iphone18-data";
import type { Dispatch, SetStateAction } from "react";

type TitaniumSectionProps = {
  selectedColor: ColorOption;
  selectedModel: { id: string; name: string; screen: string; dimensions: string; weight: string; battery: "Lên đến 29 giờ xem video"; priceStarts: string; } | { id: string; name: string; screen: string; dimensions: string; weight: string; battery: "Lên đến 33 giờ xem video"; priceStarts: string; };
  setSelectedModelId: Dispatch<SetStateAction<string>>;
  selectedModelId: string;
  setSelectedColor: Dispatch<SetStateAction<ColorOption>>;
};

export default function TitaniumSection({ selectedColor, selectedModel, setSelectedModelId, selectedModelId, setSelectedColor }: TitaniumSectionProps) {
  return (
    <section id="finish-design" className="apple-titanium-section">
      <div className="apple-titanium-header">
        <span className="apple-iphone-eyebrow">{IPHONE18_SHOWCASE.designEyebrow}</span>
        <h2>{IPHONE18_SHOWCASE.designTitle}</h2>
        <p style={{ color: "#86868b", fontSize: "16px" }}>
          {IPHONE18_SHOWCASE.designTextPrefix}<strong> {IPHONE18_SHOWCASE.burgundy}</strong> {IPHONE18_SHOWCASE.designTextSuffix}</p>
      </div>

      <div className="apple-titanium-viewer-card">
        {/* Left: Device Visual Showcase */}
        <div className="apple-titanium-preview-stage">
          <div
            className="apple-titanium-halo"
            style={{ background: selectedColor.hex }}
          />
          <div className="apple-titanium-img-wrap">
            <Image
              src={selectedColor.image}
              alt={`${selectedModel.name} - ${selectedColor.name}`}
              width={700}
              height={700}
              className="apple-titanium-product-img"
            />
          </div>
        </div>

        {/* Right: Interactive Model & Color Selector */}
        <div className="apple-titanium-controls">
          {/* Model switch */}
          <div className="apple-titanium-control-group">
            <span className="apple-titanium-label">{IPHONE18_SHOWCASE.displaySizeTitle}</span>
            <div className="apple-model-pills">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedModelId(model.id)}
                  className={`apple-model-btn ${selectedModelId === model.id ? "active" : ""}`}
                >
                  <span className="apple-model-btn-name">{model.name}</span>
                  <span className="apple-model-btn-sub">{model.screen}</span>
                  <span style={{ fontSize: "11px", color: "#ff6b87", marginTop: "2px" }}>
                    {IPHONE18_SHOWCASE.fromPrefix}{model.priceStarts}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color swatches */}
          <div className="apple-titanium-control-group">
            <span className="apple-titanium-label">{IPHONE18_SHOWCASE.colorFinishTitle}</span>
            <div className="apple-color-swatches-grid">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`apple-color-swatch-card ${selectedColor.id === color.id ? "active" : ""}`}
                >
                  <div
                    className="apple-color-dot"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="apple-color-swatch-title">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Color Story */}
          <div className="apple-color-story">
            <h4 className="apple-color-story-title">
              {selectedColor.name} · {selectedColor.enName}
            </h4>
            <p className="apple-color-story-desc">
              {selectedColor.description}
            </p>
          </div>

          {/* Live Model Specs */}
          <div className="apple-mini-specs-grid">
            <div style={{ background: "#141418", padding: "10px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "11px", color: "#86868b", display: "block" }}>{IPHONE18_SHOWCASE.weight}</span>
              <strong style={{ fontSize: "14px", color: "#ffffff" }}>{selectedModel.weight}</strong>
            </div>
            <div style={{ background: "#141418", padding: "10px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "11px", color: "#86868b", display: "block" }}>{IPHONE18_SHOWCASE.batteryLife}</span>
              <strong style={{ fontSize: "14px", color: "#30d158" }}>{selectedModel.battery.split(" ")[2]} {IPHONE18_SHOWCASE.hours}</strong>
            </div>
            <div style={{ background: "#141418", padding: "10px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "11px", color: "#86868b", display: "block" }}>{IPHONE18_SHOWCASE.peakBrightness}</span>
              <strong style={{ fontSize: "14px", color: "#ff6b87" }}>3.000 nits</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { MACBOOK_SHOWCASE } from "@/src/constants/portal/preorder-page";
import Image from "next/image";

export default function HighlightsSection() {
  return (
    <section id="highlights" className="apple-mbp-section">
      <div className="apple-mbp-section-header">
        <span className="apple-mbp-eyebrow">{MACBOOK_SHOWCASE.highlightsEyebrow}</span>
        <h2 className="apple-mbp-section-title">{MACBOOK_SHOWCASE.highlightsTitle}</h2>
        <p className="apple-mbp-section-sub">
          {MACBOOK_SHOWCASE.highlightsText}</p>
      </div>

      <div className="apple-mbp-bento">
        {/* Card 1: Chips */}
        <div className="apple-mbp-bento-card apple-mbp-bento-col-8">
          <div className="apple-mbp-bento-content">
            <span className="apple-mbp-bento-kicker">{MACBOOK_SHOWCASE.chipEyebrow}</span>
            <h3 className="apple-mbp-bento-title">{MACBOOK_SHOWCASE.chipTitle}</h3>
            <p className="apple-mbp-bento-desc">
              {MACBOOK_SHOWCASE.chipText}</p>
          </div>
          <div className="apple-mbp-bento-media">
            <Image
              src="/apple-macbook-pro/chip-m5-family.jpg"
              alt={MACBOOK_SHOWCASE.chipAlt}
              width={720}
              height={320}
              className="apple-mbp-hero-img"
            />
          </div>
        </div>

        {/* Card 2: Battery */}
        <div className="apple-mbp-bento-card apple-mbp-bento-col-4">
          <div className="apple-mbp-bento-content">
            <span className="apple-mbp-bento-kicker">{MACBOOK_SHOWCASE.batteryEyebrow}</span>
            <h3 className="apple-mbp-bento-title">{MACBOOK_SHOWCASE.batteryTitle}</h3>
            <p className="apple-mbp-bento-desc">
              {MACBOOK_SHOWCASE.batteryText}</p>
          </div>
          <div className="apple-mbp-bento-media">
            <Image
              src="/apple-macbook-pro/battery-highlight.jpg"
              alt={MACBOOK_SHOWCASE.batteryAlt}
              width={400}
              height={260}
              className="apple-mbp-hero-img"
            />
          </div>
        </div>

        {/* Card 3: Apple Intelligence */}
        <div className="apple-mbp-bento-card apple-mbp-bento-col-4">
          <div className="apple-mbp-bento-content">
            <span className="apple-mbp-bento-kicker">{MACBOOK_SHOWCASE.aiEyebrow}</span>
            <h3 className="apple-mbp-bento-title">{MACBOOK_SHOWCASE.aiTitle}</h3>
            <p className="apple-mbp-bento-desc">
              {MACBOOK_SHOWCASE.aiText}</p>
          </div>
          <div className="apple-mbp-bento-media">
            <Image
              src="/apple-macbook-pro/ai-highlight.jpg"
              alt={MACBOOK_SHOWCASE.aiAlt}
              width={400}
              height={260}
              className="apple-mbp-hero-img"
            />
          </div>
        </div>

        {/* Card 4: Liquid Retina XDR */}
        <div className="apple-mbp-bento-card apple-mbp-bento-col-8">
          <div className="apple-mbp-bento-content">
            <span className="apple-mbp-bento-kicker">{MACBOOK_SHOWCASE.displayEyebrow}</span>
            <h3 className="apple-mbp-bento-title">{MACBOOK_SHOWCASE.displayTitle}</h3>
            <p className="apple-mbp-bento-desc">
              {MACBOOK_SHOWCASE.displayText}</p>
          </div>
          <div className="apple-mbp-bento-media">
            <Image
              src="/apple-macbook-pro/product-viewer-hero.jpg"
              alt={MACBOOK_SHOWCASE.featureDisplay}
              width={720}
              height={320}
              className="apple-mbp-hero-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

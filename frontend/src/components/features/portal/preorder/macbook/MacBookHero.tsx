"use client";

import { MACBOOK_SHOWCASE } from "@/src/constants/portal/preorder-page";
import Image from "next/image";

export default function MacBookHero() {
  return (
    <section id="overview" className="apple-mbp-hero">
      <div className="apple-mbp-hero-copy">
        <span className="apple-mbp-eyebrow">Apple MacBook Pro</span>
        <h1 className="apple-mbp-hero-title">MacBook Pro</h1>
        <p className="apple-mbp-hero-headline">
          {MACBOOK_SHOWCASE.heroHeadline}</p>
        <p className="apple-mbp-hero-desc">
          {MACBOOK_SHOWCASE.heroText}</p>

        <div className="apple-mbp-hero-actions">
          <a href="#configurator" className="apple-mbp-btn-primary">
            {MACBOOK_SHOWCASE.heroPreorder}</a>
          <a href="#product-viewer" className="apple-mbp-btn-secondary">
            {MACBOOK_SHOWCASE.heroViewSizes}</a>
        </div>
      </div>

      {/* Hero Stage Visual with Screen Glow */}
      <div className="apple-mbp-hero-stage">
        <div className="apple-mbp-hero-screen-glow" />
        <div className="apple-mbp-hero-img-wrap">
          <Image
            src="/apple-macbook-pro/hero-macbook-pro.jpg"
            alt={MACBOOK_SHOWCASE.heroImageAlt}
            width={1080}
            height={580}
            priority
            className="apple-mbp-hero-img"
          />
        </div>
      </div>

      {/* Floating Highlights Row */}
      <div className="apple-mbp-hero-pills">
        <div className="apple-mbp-hero-pill">
          <span className="apple-mbp-hero-pill-icon">⚡</span>
          <span>Ba chip: M5 · M5 Pro · M5 Max</span>
        </div>
        <div className="apple-mbp-hero-pill">
          <span className="apple-mbp-hero-pill-icon">🖥️</span>
          <span>{MACBOOK_SHOWCASE.featureDisplay}</span>
        </div>
        <div className="apple-mbp-hero-pill">
          <span className="apple-mbp-hero-pill-icon">🔋</span>
          <span>{MACBOOK_SHOWCASE.featureBattery}</span>
        </div>
        <div className="apple-mbp-hero-pill">
          <span className="apple-mbp-hero-pill-icon">✦</span>
          <span>{MACBOOK_SHOWCASE.featureAi}</span>
        </div>
        <div className="apple-mbp-hero-pill">
          <span className="apple-mbp-hero-pill-icon">🔌</span>
          <span>{MACBOOK_SHOWCASE.featureThunderbolt}</span>
        </div>
      </div>
    </section>
  );
}

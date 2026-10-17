"use client";

import { IPHONE18_SHOWCASE } from "@/src/constants/portal/preorder-page";
import Image from "next/image";

export default function IPhoneHero() {
  return (
    <header id="overview" className="apple-iphone-hero">
      <div className="apple-iphone-hero-glow" aria-hidden="true" />
      <div className="apple-iphone-hero-copy">
        <span className="apple-iphone-eyebrow">iPhone 18 Pro &amp; iPhone 18 Pro Max</span>
        <h1 className="apple-iphone-hero-title">{IPHONE18_SHOWCASE.heroHeadline}</h1>
        <p className="apple-iphone-hero-headline">
          {IPHONE18_SHOWCASE.heroAperture}<br />
          {IPHONE18_SHOWCASE.heroChip}</p>
        <p className="apple-iphone-hero-desc">
          {IPHONE18_SHOWCASE.heroText}</p>

        <div className="apple-iphone-hero-actions">
          <a href="#configurator" className="apple-iphone-btn-primary">
            {IPHONE18_SHOWCASE.heroPreorder}</a>
          <a href="#camera-aperture" className="apple-iphone-btn-secondary">
            {IPHONE18_SHOWCASE.heroExploreAperture}</a>
        </div>

        <div className="apple-iphone-hero-stage">
          <div className="apple-iphone-hero-img-wrap">
            <Image
              src="/apple-iphone-18-pro/hero-iphone-18-pro.jpg"
              alt={IPHONE18_SHOWCASE.heroImageAlt}
              width={1440}
              height={1080}
              priority
              className="apple-iphone-hero-img"
            />
          </div>
        </div>

        {/* Quick specs pills */}
        <div className="apple-iphone-hero-pills">
          <span className="apple-iphone-hero-pill">
            <span className="apple-iphone-hero-pill-icon">🔘</span>
            {IPHONE18_SHOWCASE.featureAperture}</span>
          <span className="apple-iphone-hero-pill">
            <span className="apple-iphone-hero-pill-icon">⚡</span>
            {IPHONE18_SHOWCASE.featureChip}</span>
          <span className="apple-iphone-hero-pill">
            <span className="apple-iphone-hero-pill-icon">🔭</span>
            {IPHONE18_SHOWCASE.featureZoom}</span>
          <span className="apple-iphone-hero-pill">
            <span className="apple-iphone-hero-pill-icon">🛡️</span>
            {IPHONE18_SHOWCASE.featureTitanium}</span>
          <span className="apple-iphone-hero-pill">
            <span className="apple-iphone-hero-pill-icon">✨</span>
            {IPHONE18_SHOWCASE.featureNewColor}</span>
        </div>
      </div>
    </header>
  );
}

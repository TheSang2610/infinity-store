import Link from "next/link";
import Image from "next/image";
import "@/src/components/features/portal/home/IPhone18ProAdBanner.css";
import { IPHONE18_AD } from "@/src/constants/portal/home";

interface IPhone18ProAdBannerProps {
  variant?: "full" | "compact";
}

export default function IPhone18ProAdBanner({ variant = "full" }: IPhone18ProAdBannerProps) {
  if (variant === "compact") {
    return (
      <aside className="apple-iphone-ad-compact" aria-label={IPHONE18_AD.compactLabel}>
        <div className="apple-iphone-ad-compact-inner">
          <div className="apple-iphone-ad-compact-left">
            <div className="apple-iphone-ad-thumb">
              <Image
                src="/apple-iphone-18-pro/contrast-18pro.jpg"
                alt={IPHONE18_AD.imageAlt}
                fill
                sizes="64px"
                className="apple-iphone-ad-thumb-img"
              />
            </div>
            <div>
              <div className="apple-iphone-ad-compact-tag">
                <span> FLAGSHIP 2026</span>
                <span className="apple-iphone-ad-badge-dot">●</span>
                <span style={{ color: "#ff6b87" }}>{IPHONE18_AD.newColor}</span>
              </div>
              <strong className="apple-iphone-ad-compact-title">
                {IPHONE18_AD.compactText}</strong>
            </div>
          </div>

          <div className="apple-iphone-ad-compact-actions">
            <Link href="/san-pham/iphone-18-pro" className="apple-iphone-ad-btn-secondary">
              Xem iPhone 18 Pro ›
            </Link>
            <Link href="/iphone" className="apple-iphone-ad-btn-primary">
              {IPHONE18_AD.chooseVersion}</Link>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <section className="apple-iphone-ad-billboard" aria-label={IPHONE18_AD.fullLabel}>
      <div className="apple-iphone-ad-halo" aria-hidden="true" />
      
      <div className="apple-iphone-ad-container">
        {/* Left Side: Editorial & Value Proposition */}
        <div className="apple-iphone-ad-copy">
          <div className="apple-iphone-ad-eyebrow">
            <span className="apple-logo-mark"></span>
            <span>{IPHONE18_AD.eyebrow}</span>
          </div>

          <h2 className="apple-iphone-ad-title">
            iPhone 18 Pro
            <span className="apple-iphone-ad-headline">{IPHONE18_AD.headline}</span>
          </h2>

          <p className="apple-iphone-ad-desc">
            {IPHONE18_AD.designPrefix}<strong>{IPHONE18_AD.burgundy}</strong> {IPHONE18_AD.firstTime}<strong>{IPHONE18_AD.aperture}</strong>,
            chip <strong>Apple A20 Pro 2nm</strong> {IPHONE18_AD.coolingZoom}</p>

          {/* Key specs row */}
          <div className="apple-iphone-ad-specs-row">
            <div className="apple-iphone-ad-spec-box">
              <span className="apple-iphone-ad-spec-val">ƒ/1.48–ƒ/4.0</span>
              <span className="apple-iphone-ad-spec-lbl">{IPHONE18_AD.featureAperture}</span>
            </div>
            <div className="apple-iphone-ad-spec-box">
              <span className="apple-iphone-ad-spec-val">A20 Pro</span>
              <span className="apple-iphone-ad-spec-lbl">{IPHONE18_AD.featureChip}</span>
            </div>
            <div className="apple-iphone-ad-spec-box">
              <span className="apple-iphone-ad-spec-val">8× Zoom</span>
              <span className="apple-iphone-ad-spec-lbl">{IPHONE18_AD.featureZoom}</span>
            </div>
            <div className="apple-iphone-ad-spec-box">
              <span className="apple-iphone-ad-spec-val">{IPHONE18_AD.priceFrom}</span>
              <span className="apple-iphone-ad-spec-lbl">{IPHONE18_AD.fourCapacities}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="apple-iphone-ad-actions">
            <Link href="/san-pham/iphone-18-pro" className="apple-iphone-ad-btn-primary">
              Xem iPhone 18 Pro ›
            </Link>
            <Link href="/iphone" className="apple-iphone-ad-btn-secondary">
              {IPHONE18_AD.chooseColorCapacity}</Link>
          </div>

          <div className="apple-iphone-ad-guarantee">
            <span style={{ color: "#30d158" }}>✓</span>
            <span>{IPHONE18_AD.footnote}</span>
          </div>
        </div>

        {/* Right Side: Product Visual Showcase */}
        <div className="apple-iphone-ad-media">
          <Link href="/san-pham/iphone-18-pro" className="apple-iphone-ad-media-link" aria-label={IPHONE18_AD.viewDetails}>
            <div className="apple-iphone-ad-image-wrap">
              <Image
                src="/apple-iphone-18-pro/hero-iphone-18-pro.jpg"
                alt={IPHONE18_AD.lineupLabel}
                width={720}
                height={540}
                priority
                className="apple-iphone-ad-product-img"
              />
              <div className="apple-iphone-ad-float-tag">
                <span>{IPHONE18_AD.variableAperture}</span>
                <strong>{IPHONE18_AD.latestFromApple}</strong>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

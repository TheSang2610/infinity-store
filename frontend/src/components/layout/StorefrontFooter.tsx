"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { hidesStorefrontChrome } from "@/src/constants/shared/internal-routes";
import {
  FOOTER, FOOTER_BRAND_PARTNERS, FOOTER_PAYMENT_PARTNERS, FOOTER_POLICY_LINKS, FOOTER_SERVICE_LINKS,
} from "@/src/constants/shared/footer";
import { useStoreSettings } from "@/src/hooks/store-settings";
import { zaloHref } from "@/src/lib/store-settings";

/** Ky hieu tren nut mang xa hoi; mang khac thi lay chu cai dau. */
const socialIcons: Record<string, string> = { facebook: "f", youtube: "▶", tiktok: "♪", zalo: "Z" };

export default function StorefrontFooter() {
  const pathname = usePathname();
  const [seoExpanded, setSeoExpanded] = useState(false);
  const store = useStoreSettings();
  const hotlines = [
    { label: FOOTER.hotlineSales, phone: store.hotline, hours: store.hotlineHours },
    { label: FOOTER.hotlineSupport, phone: store.supportHotline, hours: store.supportHours },
    { label: FOOTER.hotlineComplaint, phone: store.complaintHotline, hours: store.complaintHours },
  ].filter((item) => item.phone);
  const socialLinks = [
    ...store.socialLinks,
    ...(store.zaloPhone ? [{ label: "Zalo", url: zaloHref(store.zaloPhone) }] : []),
  ];

  if (hidesStorefrontChrome(pathname)) {
    return null;
  }

  return (
    <footer className="cps-footer" role="contentinfo">
      <div className="cps-container">
        {/* 1. Thuong hieu doi tac */}
        <section className="cps-brand-strip" aria-label={FOOTER.brandStripLabel}>
          <div className="cps-brand-strip-title">
            <span>{FOOTER.brandStripTitle}</span>
          </div>
          <div className="cps-brand-pills-row">
            {FOOTER_BRAND_PARTNERS.map((item) => (
              <Link key={item.name} href={item.href} className="cps-brand-pill-item" title={item.name}>
                <span>{item.tag}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 2. Gioi thieu he thong (thu gon / xem them) */}
        <section className="cps-seo-box" aria-label={FOOTER.seoLabel}>
          <h2>{FOOTER.seoTitle}</h2>
          <div className={`cps-seo-content ${seoExpanded ? "is-expanded" : "is-collapsed"}`}>
            <p>
              <strong>{FOOTER.seoIntroBrand}</strong>{FOOTER.seoIntro}
            </p>
            {FOOTER.seoSections.map((section) => (
              <div key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="cps-seo-toggle-btn"
            onClick={() => setSeoExpanded(!seoExpanded)}
            aria-expanded={seoExpanded}
          >
            {seoExpanded ? FOOTER.seoCollapse : FOOTER.seoExpand}
          </button>
        </section>

        {/* 3. Luoi 4 cot */}
        <div className="cps-footer-grid">
          <div className="cps-footer-col">
            <h4>{FOOTER.hotlineTitle}</h4>
            {hotlines.map((item) => (
              <div className="cps-footer-hotline-item" key={item.label}>
                <span>{item.label}: <strong>{item.phone}</strong>{item.hours && ` (${item.hours})`}</span>
              </div>
            ))}
            {store.showrooms.map((showroom, index) => (
              <div style={{ marginTop: index ? "6px" : "12px", lineHeight: "1.5" }} key={`${showroom.name}-${index}`}>
                <span style={{ fontWeight: 700, color: "#1e293b", display: "block" }}>{showroom.name}:</span>
                <span>{showroom.address}</span>
              </div>
            ))}
          </div>

          <div className="cps-footer-col">
            <h4>{FOOTER.policyTitle}</h4>
            <ul className="cps-footer-list">
              {FOOTER_POLICY_LINKS.map((link) => <li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}
            </ul>
          </div>

          <div className="cps-footer-col">
            <h4>{FOOTER.servicesTitle}</h4>
            <ul className="cps-footer-list">
              {FOOTER_SERVICE_LINKS.map((link) => <li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}
            </ul>
          </div>

          <div className="cps-footer-col">
            <h4>{FOOTER.connectTitle}</h4>
            <div className="cps-footer-social-row">
              {socialLinks.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="cps-social-pill" title={link.label} aria-label={link.label}>
                  {socialIcons[link.label.toLowerCase()] ?? link.label.charAt(0)}
                </a>
              ))}
            </div>

            <div className="cps-partner-icons">
              {FOOTER_PAYMENT_PARTNERS.map((partner) => <span className="cps-partner-tag" key={partner}>{partner}</span>)}
            </div>

            <div style={{ marginTop: "14px" }}>
              <span style={{ display: "inline-block", background: "#e0f2fe", color: "#0284c7", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                {FOOTER.certified}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Ban quyen va phap ly */}
        <div className="cps-footer-bottom">
          {store.companyName && (
            <p style={{ margin: "0 0 6px" }}>
              © {new Date().getFullYear()} {store.companyName}.{store.businessLicense && ` ${store.businessLicense}`}
            </p>
          )}
          {store.officeAddress && (
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "11px" }}>
              {FOOTER.officeAddress(store.officeAddress)}{store.hotline && FOOTER.officePhone(store.hotline)}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}

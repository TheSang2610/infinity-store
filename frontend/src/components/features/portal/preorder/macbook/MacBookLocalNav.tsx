"use client";

import { MACBOOK_SHOWCASE } from "@/src/constants/portal/preorder-page";
import Link from "next/link";

export default function MacBookLocalNav() {
  return (
    <nav className="apple-mbp-localnav" aria-label={MACBOOK_SHOWCASE.navLabel}>
      <div className="apple-mbp-localnav-inner">
        <div className="apple-mbp-localnav-title">
          <h2>MacBook Pro</h2>
          <span className="apple-mbp-localnav-badge">{MACBOOK_SHOWCASE.navTagline}</span>
        </div>

        <ul className="apple-mbp-localnav-links">
          <li><a href="#overview">{MACBOOK_SHOWCASE.navOverview}</a></li>
          <li><a href="#highlights">{MACBOOK_SHOWCASE.navHighlights}</a></li>
          <li><a href="#product-viewer">{MACBOOK_SHOWCASE.navDesign}</a></li>
          <li><a href="#performance">{MACBOOK_SHOWCASE.navChip}</a></li>
          <li><a href="#configurator">{MACBOOK_SHOWCASE.navSpecs}</a></li>
          <li><Link href="/dat-truoc?device=iphone" style={{ color: "#ff6b87", fontWeight: 600 }}>📱 iPhone 18 Pro ›</Link></li>
        </ul>

        <a href="#configurator" className="apple-mbp-localnav-cta">
          <span>{MACBOOK_SHOWCASE.navPreorder}</span>
          <small style={{ opacity: 0.85, fontSize: "10px" }}>{MACBOOK_SHOWCASE.navZeroDeposit}</small>
        </a>
      </div>
    </nav>
  );
}

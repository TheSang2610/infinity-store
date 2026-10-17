"use client";

import { IPHONE18_SHOWCASE } from "@/src/constants/portal/preorder-page";
import Link from "next/link";

export default function IPhoneLocalNav() {
  return (
    <nav className="apple-iphone-localnav" aria-label={IPHONE18_SHOWCASE.navLabel}>
      <div className="apple-iphone-localnav-inner">
        <div className="apple-iphone-localnav-title">
          <h2>iPhone 18 Pro</h2>
          <span className="apple-iphone-localnav-badge">{IPHONE18_SHOWCASE.navTagline}</span>
        </div>
        <ul className="apple-iphone-localnav-links">
          <li><a href="#overview">{IPHONE18_SHOWCASE.navOverview}</a></li>
          <li><a href="#finish-design">{IPHONE18_SHOWCASE.navDesign}</a></li>
          <li><a href="#camera-aperture">{IPHONE18_SHOWCASE.navAperture}</a></li>
          <li><a href="#chip-a20pro">Chip A20 Pro</a></li>
          <li><a href="#compare">{IPHONE18_SHOWCASE.navCompare}</a></li>
          <li><a href="#configurator">{IPHONE18_SHOWCASE.navConfig}</a></li>
          <li><Link href="/dat-truoc?device=macbook" style={{ color: "#2997ff", fontWeight: 600 }}>💻 MacBook Pro M5 ›</Link></li>
        </ul>
        <a href="#configurator" className="apple-iphone-localnav-cta">
          {IPHONE18_SHOWCASE.navPreorder}</a>
      </div>
    </nav>
  );
}

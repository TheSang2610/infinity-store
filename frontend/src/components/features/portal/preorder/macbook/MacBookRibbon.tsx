"use client";

import Link from "next/link";
import { MACBOOK_SHOWCASE } from "@/src/constants/portal/preorder-page";

export default function MacBookRibbon() {
  return (
    <header className="apple-global-ribbon" aria-label="Infinity Store Apple Navigation">
      <div className="apple-global-ribbon-inner">
        <Link href="/" className="apple-global-brand" title={MACBOOK_SHOWCASE.homeLabel}>
          <span className="apple-global-brand-apple-mark"></span>
          <span>Infinity Store</span>
        </Link>
        <ul className="apple-global-nav-links">
          <li><Link href="/" className="apple-global-nav-link">{MACBOOK_SHOWCASE.store}</Link></li>
          <li><Link href="/macbook" className="apple-global-nav-link">MacBook</Link></li>
          <li><Link href="/iphone" className="apple-global-nav-link">iPhone</Link></li>
          <li><Link href="/ipad" className="apple-global-nav-link">iPad</Link></li>
          <li><Link href="/phu-kien" className="apple-global-nav-link">{MACBOOK_SHOWCASE.accessories}</Link></li>
          <li><span className="apple-global-nav-link active">MacBook Pro M5</span></li>
          <li><Link href="/dat-truoc?device=iphone" className="apple-global-nav-link" style={{ color: "#ff6b87" }}>📱 iPhone 18 Pro ›</Link></li>
        </ul>
        <Link href="/" className="apple-global-nav-back">
          <span>{MACBOOK_SHOWCASE.backToShop}</span>
        </Link>
      </div>
    </header>
  );
}

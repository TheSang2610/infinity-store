"use client";

import Image from "next/image";
import Link from "next/link";
import type { PointerEvent } from "react";
import { HOME_CATEGORY_BENTO } from "@/src/constants/portal/home";

type Tile = {
  name: string;
  note: string;
  cta: string;
  href: string;
  image: string;
  variant: "hero" | "wide" | "compact";
};

const tiles: Tile[] = [
  { name: "iPhone", note: HOME_CATEGORY_BENTO.iphoneText, cta: HOME_CATEGORY_BENTO.iphoneCta, href: "/iphone", image: "/products/iphone-18/pro-do.png", variant: "hero" },
  { name: "MacBook", note: HOME_CATEGORY_BENTO.macbookText, cta: HOME_CATEGORY_BENTO.macbookCta, href: "/macbook", image: "/hero-products/macbook-air-13-m5-cutout.png", variant: "wide" },
  { name: "Laptop", note: "Gaming & AI, RTX 50 Series.", cta: "Xem laptop", href: "/laptop", image: "/products/expanded/rog-scar18-2025.png", variant: "compact" },
  { name: HOME_CATEGORY_BENTO.cameraTitle, note: "Fujifilm · Sony · DJI.", cta: HOME_CATEGORY_BENTO.cameraCta, href: "/may-anh", image: "/hero-products/fujifilm-xm5-cutout-v3.png", variant: "compact" },
];

/** Vệt sáng theo con trỏ và độ nghiêng nhẹ cho ảnh — chỉ cập nhật biến CSS, không re-render. */
function trackPointer(event: PointerEvent<HTMLAnchorElement>) {
  if (event.pointerType !== "mouse") return;
  const tile = event.currentTarget;
  const rect = tile.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  tile.style.setProperty("--spot-x", `${(x * 100).toFixed(1)}%`);
  tile.style.setProperty("--spot-y", `${(y * 100).toFixed(1)}%`);
  tile.style.setProperty("--tilt-x", `${((0.5 - y) * 6).toFixed(2)}deg`);
  tile.style.setProperty("--tilt-y", `${((x - 0.5) * 8).toFixed(2)}deg`);
}

function resetPointer(event: PointerEvent<HTMLAnchorElement>) {
  const tile = event.currentTarget;
  tile.style.setProperty("--tilt-x", "0deg");
  tile.style.setProperty("--tilt-y", "0deg");
}

export default function HomeCategoryBento() {
  return (
    <section id="shop-categories" className="home-discover cps-container" aria-labelledby="home-discover-title">
      <header className="home-discover-head">
        <p className="shop-eyebrow">{HOME_CATEGORY_BENTO.eyebrow}</p>
        <h2 id="home-discover-title">{HOME_CATEGORY_BENTO.title}</h2>
      </header>
      <div className="home-bento">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={`bento-tile bento-${tile.variant}`}
            onPointerMove={trackPointer}
            onPointerLeave={resetPointer}
          >
            <span className="bento-spotlight" aria-hidden="true" />
            <div className="bento-copy">
              <h3>{tile.name}</h3>
              <p>{tile.note}</p>
              <span className="bento-cta">
                {tile.cta}
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8h9m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </div>
            <div className="bento-media" aria-hidden="true">
              <Image
                src={tile.image}
                alt=""
                fill
                unoptimized
                sizes={tile.variant === "hero" ? "(max-width: 900px) 90vw, 560px" : "(max-width: 900px) 90vw, 380px"}
                style={{ objectFit: "contain" }}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

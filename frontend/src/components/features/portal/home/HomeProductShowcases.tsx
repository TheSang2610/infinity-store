"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import ShopProductCard from "@/src/components/features/portal/catalog/ShopProductCard";
import { HOME_SHOWCASES } from "@/src/constants/portal/home";

export type HomeShowcaseProduct = {
  slug: string;
  name: string;
  category: string;
  image: string;
  badge: string;
  price: string;
  sellingPrice?: string;
  salePrice?: string;
  stock?: number;
  specs: string[];
};

type ProductTab = {
  id: string;
  label: string;
  note: string;
  href: string;
  products: HomeShowcaseProduct[];
};

type ShowcaseProps = {
  eyebrow: string;
  title: string;
  description: string;
  tone: "mobile" | "macbook" | "accessories";
  tabs: ProductTab[];
  offers: string[];
};

function ProductShowcase({
  eyebrow,
  title,
  description,
  tone,
  tabs,
  offers,
}: ShowcaseProps) {
  const availableTabs = useMemo(() => tabs.filter((tab) => tab.products.length > 0), [tabs]);
  const [activeId, setActiveId] = useState(availableTabs[0]?.id ?? "");
  const railRef = useRef<HTMLDivElement>(null);
  const activeTab = useMemo(
    () => availableTabs.find((tab) => tab.id === activeId) ?? availableTabs[0],
    [activeId, availableTabs],
  );

  if (!activeTab || activeTab.products.length === 0) return null;

  function changeTab(id: string) {
    setActiveId(id);
    if (railRef.current) railRef.current.scrollLeft = 0;
  }

  function scroll(direction: number) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.82, behavior: "smooth" });
  }

  return (
    <section className={`home-showcase home-showcase-${tone}`} aria-labelledby={`${tone}-showcase-title`}>
      <div className="shell home-showcase-inner">
        <header className="home-showcase-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <div className="home-showcase-title-row">
              <h2 id={`${tone}-showcase-title`}>{title}</h2>
              <p>{description}</p>
            </div>
          </div>
          <Link className="home-showcase-all" href={activeTab.href}>
            {HOME_SHOWCASES.viewAll}<span aria-hidden="true">→</span>
          </Link>
        </header>

        <div className="home-showcase-tabs" role="tablist" aria-label={HOME_SHOWCASES.tabsLabel(title)}>
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === activeTab.id}
              className={tab.id === activeTab.id ? "is-active" : ""}
              onClick={() => changeTab(tab.id)}
            >
              <span>{tab.label}</span>
              <small>{tab.note}</small>
            </button>
          ))}
        </div>

        <div className="home-showcase-offers" aria-label={HOME_SHOWCASES.offers}>
          <strong>{HOME_SHOWCASES.offers}</strong>
          {offers.map((offer, index) => (
            <span className={index === 0 ? "is-primary" : ""} key={offer}>
              {offer}
            </span>
          ))}
        </div>

        <div className="home-showcase-carousel">
          <button
            className="home-showcase-arrow is-left"
            type="button"
            onClick={() => scroll(-1)}
            aria-label={HOME_SHOWCASES.previous}
          >
            ‹
          </button>
          <div className="home-showcase-rail" ref={railRef}>
            {activeTab.products.map((product) => (
              <div className="home-showcase-slot" key={product.slug}>
                <ShopProductCard product={product} sizes="(max-width: 680px) 46vw, (max-width: 1100px) 30vw, 260px" />
              </div>
            ))}
          </div>
          <button
            className="home-showcase-arrow is-right"
            type="button"
            onClick={() => scroll(1)}
            aria-label={HOME_SHOWCASES.next}
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}

function macbookFamily(product: HomeShowcaseProduct) {
  const identity = `${product.slug} ${product.name}`;
  if (/macbook[\s-]+pro/i.test(identity)) return "pro";
  if (/macbook[\s-]+air/i.test(identity)) return "air";
  return "other";
}

export default function HomeProductShowcases({ products }: { products: HomeShowcaseProduct[] }) {
  const iphones = products.filter((product) => product.category === "iphone");
  const android = products.filter((product) => product.category === "android");
  const macbooks = products.filter((product) => product.category.startsWith("macbook"));
  const macbookPro = macbooks.filter((product) => macbookFamily(product) === "pro");
  const macbookAir = macbooks.filter((product) => macbookFamily(product) === "air");
  const laptop = products.filter((product) => product.category === "laptop");
  const accessories = products.filter((product) => product.category === "phu-kien");
  const audio = products.filter((product) => product.category === "audio");
  const smartwatch = products.filter((product) => product.category === "smartwatch");

  return (
    <div className="home-showcases">
        <ProductShowcase
          eyebrow={HOME_SHOWCASES.phonesEyebrow}
          title={HOME_SHOWCASES.phonesTitle}
          description={HOME_SHOWCASES.phonesText}
          tone="mobile"
          tabs={[
            { id: "iphone", label: HOME_SHOWCASES.iphoneTab, note: HOME_SHOWCASES.appleTab, href: "/iphone", products: iphones },
            { id: "android", label: "Flagship Android", note: HOME_SHOWCASES.androidTab, href: "/android", products: android },
          ]}
          offers={[HOME_SHOWCASES.perkWarranty, HOME_SHOWCASES.perkInstallment, HOME_SHOWCASES.perkDelivery]}
        />
        <ProductShowcase
          eyebrow={HOME_SHOWCASES.computersEyebrow}
          title="Laptop & MacBook"
          description={HOME_SHOWCASES.computersText}
          tone="macbook"
          tabs={[
            { id: "macbook-pro", label: "MacBook Pro", note: HOME_SHOWCASES.macbookTab, href: "/macbook", products: macbookPro },
            { id: "macbook-air", label: "MacBook Air", note: HOME_SHOWCASES.laptopTab, href: "/macbook", products: macbookAir },
            { id: "laptop", label: "Laptop Gaming & AI", note: "NVIDIA RTX 5090 / OLED 240Hz", href: "/laptop", products: laptop },
          ]}
          offers={[HOME_SHOWCASES.perkStudent, HOME_SHOWCASES.perkGift, HOME_SHOWCASES.perkWarranty24]}
        />
        <ProductShowcase
          eyebrow={HOME_SHOWCASES.accessoriesEyebrow}
          title={HOME_SHOWCASES.accessoriesTitle}
          description={HOME_SHOWCASES.accessoriesText}
          tone="accessories"
          tabs={[
            { id: "accessories", label: HOME_SHOWCASES.accessoriesTab, note: HOME_SHOWCASES.accessoriesTabText, href: "/phu-kien", products: accessories },
            { id: "audio", label: HOME_SHOWCASES.audioTab, note: HOME_SHOWCASES.audioTabText, href: "/audio", products: audio },
            { id: "smartwatch", label: HOME_SHOWCASES.watchTab, note: HOME_SHOWCASES.watchTabText, href: "/smartwatch", products: smartwatch },
          ]}
          offers={[HOME_SHOWCASES.perkBundle, HOME_SHOWCASES.perkExchange, HOME_SHOWCASES.perkGenuine]}
        />
    </div>
  );
}

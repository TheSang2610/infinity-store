"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Product } from "@/src/lib/products";
import ProductCard from "@/src/components/features/portal/catalog/ProductCard";
import "@/src/styles/storefront/catalog-refined.css";
import { CATALOG_BROWSER } from "@/src/constants/portal/catalog";

type SortMode = "featured" | "price-asc" | "price-desc";
type PriceBand = "all" | "under-20" | "20-40" | "over-40";
type ConditionFilter = "all" | "new" | "like-new";

const categoryGroups: Partial<Record<Product["category"], Array<{ label: string; value: string }>>> = {
  "may-anh": [
    { label: CATALOG_BROWSER.allCameras, value: "all" },
    { label: "FUJIFILM", value: "fujifilm" },
    { label: "SONY", value: "sony" },
    { label: "CANON", value: "canon" },
    { label: "DJI", value: "dji" },
  ],
  "phu-kien": [
    { label: CATALOG_BROWSER.allAccessories, value: "all" },
    { label: CATALOG_BROWSER.cablesChargers, value: "sac" },
    { label: "Tai nghe & Loa", value: "tai-nghe" },
    { label: CATALOG_BROWSER.powerBanks, value: "pin" },
    { label: CATALOG_BROWSER.cases, value: "op-lung" },
    { label: CATALOG_BROWSER.mouseKeyboard, value: "chuot-ban-phim" },
    { label: CATALOG_BROWSER.bags, value: "tui" },
    { label: CATALOG_BROWSER.appleAccessories, value: "apple" },
  ],
  iphone: [
    { label: CATALOG_BROWSER.allIphone, value: "all" },
    { label: "iPhone 18 Pro Series", value: "18" },
    { label: "iPhone 17", value: "17" },
    { label: "iPhone 16", value: "16" },
    { label: "iPhone 15", value: "15" },
    { label: "iPhone 14", value: "14" },
    { label: "iPhone 13, 12 & SE", value: "legacy" },
  ],
  macbook: [
    { label: CATALOG_BROWSER.allMacbook, value: "all" },
    { label: "MacBook Air", value: "air" },
    { label: "MacBook Pro", value: "pro" },
    { label: "MacBook Neo", value: "neo" },
  ],
  ipad: [
    { label: CATALOG_BROWSER.allIpad, value: "all" },
    { label: "iPad Pro", value: "pro" },
    { label: "iPad Air", value: "air" },
    { label: "iPad mini", value: "mini" },
    { label: CATALOG_BROWSER.ipadStandard, value: "standard" },
  ],
  "mac-mini-studio": [
    { label: CATALOG_BROWSER.allDesktops, value: "all" },
    { label: "Mac mini", value: "mini" },
    { label: "Mac Studio", value: "studio" },
  ],
  imac: [
    { label: CATALOG_BROWSER.allImac, value: "all" },
    { label: "iMac M4", value: "m4" },
    { label: "iMac M3", value: "m3" },
  ],
  laptop: [
    { label: CATALOG_BROWSER.allLaptops, value: "all" },
    { label: "ASUS", value: "asus" },
    { label: "Dell", value: "dell" },
    { label: "HP", value: "hp" },
    { label: "Lenovo", value: "lenovo" },
    { label: "Acer & MSI", value: "acer" },
  ],
};

function matchesGroup(product: Product, category: Product["category"], group: string) {
  if (group === "all") return true;
  const haystack = `${product.slug} ${product.name} ${product.brand || ""}`.toLowerCase();
  if (category === "may-anh") {
    if (group === "all") return true;
    const brandLower = (product.brand || "").toLowerCase();
    if (group === "fujifilm") return brandLower === "fujifilm" || haystack.includes("fuji");
    if (group === "sony") return brandLower === "sony" || haystack.includes("sony");
    if (group === "canon") return brandLower === "canon" || haystack.includes("canon");
    if (group === "dji") return brandLower === "dji" || haystack.includes("dji") || haystack.includes("osmo") || haystack.includes("avata");
    return true;
  }
  if (category === "phu-kien") {
    if (group === "sac") return /sạc|sac|cable|cáp|adapter|anker|baseus|type-c|lightning/i.test(haystack);
    if (group === "tai-nghe") return /tai nghe|earpods|airpods|headphone|soundpeats|marshall|loa|speaker/i.test(haystack);
    if (group === "pin") return /dự phòng|du phong|powerbank|mophie|ugreen/i.test(haystack);
    if (group === "op-lung") return /ốp|op|bao da|case|cover|dán|cường lực|kinh/i.test(haystack);
    if (group === "chuot-ban-phim") return /chuột|bàn phím|keyboard|mouse|logitech|trackpad/i.test(haystack);
    if (group === "tui") return /túi|balo|chống sốc|quai|tomtoc/i.test(haystack);
    if (group === "apple") return /apple|magsafe|airpods|pencil|magic/i.test(haystack);
    return true;
  }
  if (category === "iphone") {
    if (group === "legacy") return /iphone-(12|13|se)|iphone (12|13|se)/.test(haystack);
    if (group === "17" && /iphone-(air|17e)|iphone (air|17e)/.test(haystack)) return true;
    return haystack.includes(`iphone-${group}`) || haystack.includes(`iphone ${group}`);
  }
  if (category === "macbook") return haystack.includes(`macbook-${group}`) || haystack.includes(`macbook ${group}`);
  if (category === "ipad") {
    if (group === "standard") return !/(ipad[\s-]+(pro|air|mini))/.test(haystack);
    return haystack.includes(`ipad-${group}`) || haystack.includes(`ipad ${group}`);
  }
  if (category === "mac-mini-studio") return haystack.includes(`mac-${group}`) || haystack.includes(`mac ${group}`);
  if (category === "imac") return haystack.includes(`-${group}-`) || haystack.includes(` ${group} `);
  if (category === "laptop") return group === "acer" ? /acer|msi/.test(haystack) : haystack.includes(group);
  return true;
}

function numericPrice(product: Product) {
  return Number((product.salePrice || product.sellingPrice || product.price).replace(/\D/g, "")) || 0;
}

function matchesPriceBand(product: Product, band: PriceBand) {
  if (band === "all") return true;
  const price = numericPrice(product);
  if (!price) return false;
  if (band === "under-20") return price < 20_000_000;
  if (band === "20-40") return price >= 20_000_000 && price <= 40_000_000;
  return price > 40_000_000;
}

function subscribeToLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}
const readSearch = () => window.location.search;
const serverSearch = () => "";

export default function CatalogProductBrowser({
  products,
  category,
  initialGroup = "all",
  canManageProducts = false,
}: {
  products: Product[];
  category: Product["category"];
  initialGroup?: string;
  canManageProducts?: boolean;
}) {
  const groups = useMemo(() => categoryGroups[category] ?? [{ label: CATALOG_BROWSER.allProducts, value: "all" }], [category]);
  const search = useSyncExternalStore(subscribeToLocation, readSearch, serverSearch);
  const [selectedGroup, setGroup] = useState<string | null>(null);
  const urlGroup = new URLSearchParams(search).get("group");
  const group = selectedGroup ?? (groups.some((item) => item.value === urlGroup) ? urlGroup! : initialGroup);
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [condition, setCondition] = useState<ConditionFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("featured");

  const hasConditionProducts = useMemo(() => {
    return products.some((p) => Boolean(p.condition));
  }, [products]);

  useEffect(() => {
    function handleFamilySelect(event: Event) {
      const detail = (event as CustomEvent<{ category?: string; group?: string }>).detail;
      if (detail?.category === category && groups.some((item) => item.value === detail.group)) {
        setGroup(detail.group ?? "all");
      }
    }
    window.addEventListener("catalog-family-select", handleFamilySelect);
    return () => window.removeEventListener("catalog-family-select", handleFamilySelect);
  }, [category, groups]);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const searchText = `${product.name} ${product.brand ?? ""} ${product.specs?.join(" ") ?? ""}`.toLocaleLowerCase("vi");
      if (query.trim() && !searchText.includes(query.trim().toLocaleLowerCase("vi"))) return false;
      if (!matchesGroup(product, category, group)) return false;
      if (!matchesPriceBand(product, priceBand)) return false;
      if (condition !== "all") {
        if (condition === "new" && product.condition !== "new") return false;
        if (condition === "like-new" && product.condition !== "like-new") return false;
      }
      return true;
    });
    if (sort === "featured") return filtered;
    return [...filtered].sort((a, b) => sort === "price-asc" ? numericPrice(a) - numericPrice(b) : numericPrice(b) - numericPrice(a));
  }, [category, condition, group, priceBand, products, query, sort]);

  const priceLabels: Record<PriceBand, string> = { all: CATALOG_BROWSER.anyPrice, "under-20": CATALOG_BROWSER.under20m, "20-40": CATALOG_BROWSER.from20to40m, "over-40": CATALOG_BROWSER.over40m };
  const clearFilters = () => { setQuery(""); setGroup("all"); setPriceBand("all"); setCondition("all"); };
  const hasFilters = Boolean(query || group !== "all" || priceBand !== "all" || condition !== "all");

  return (
    <div className="catalog-refined">
      <div className="catalog-discover">
        <div><span className="catalog-eyebrow">{CATALOG_BROWSER.eyebrow}</span><h2>{CATALOG_BROWSER.title}</h2><p>{CATALOG_BROWSER.intro}</p></div>
        <label className="catalog-local-search"><span>{CATALOG_BROWSER.searchLabel}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={CATALOG_BROWSER.searchPlaceholder} /></label>
      </div>
      <div className="catalog-filter-panel">
        <div className="catalog-family-pills" role="group" aria-label={CATALOG_BROWSER.family}>
          {groups.map((item) => <button type="button" key={item.value} aria-pressed={group === item.value} onClick={() => setGroup(item.value)}>{item.label}<span>{products.filter((product) => matchesGroup(product, category, item.value)).length}</span></button>)}
        </div>
        <div className="catalog-filter-controls">
          <label><span>{CATALOG_BROWSER.priceRange}</span><select value={priceBand} onChange={(event) => setPriceBand(event.target.value as PriceBand)}>{Object.entries(priceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {hasConditionProducts && <label><span>{CATALOG_BROWSER.condition}</span><select value={condition} onChange={(event) => setCondition(event.target.value as ConditionFilter)}><option value="all">{CATALOG_BROWSER.allConditions}</option><option value="new">{CATALOG_BROWSER.conditionNew}</option><option value="like-new">{CATALOG_BROWSER.conditionLikeNew}</option></select></label>}
          <label className="catalog-sort-control"><span>{CATALOG_BROWSER.sortBy}</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="featured">{CATALOG_BROWSER.sortFeatured}</option><option value="price-asc">{CATALOG_BROWSER.sortPriceAsc}</option><option value="price-desc">{CATALOG_BROWSER.sortPriceDesc}</option></select></label>
        </div>
      </div>
      <div className="catalog-results-bar">
        <p role="status"><strong>{visibleProducts.length}</strong> {CATALOG_BROWSER.productsCount}<span>/ {products.length} {CATALOG_BROWSER.inCategory}</span></p>
        {hasFilters && <button type="button" onClick={clearFilters}>{CATALOG_BROWSER.clearFilters}</button>}
      </div>
      {hasFilters && <div className="catalog-active-filters" aria-label={CATALOG_BROWSER.activeFilters}>
        {query && <button type="button" onClick={() => setQuery("")} aria-label={CATALOG_BROWSER.clearSearch(query)}>“{query}” ×</button>}
        {group !== "all" && <button type="button" onClick={() => setGroup("all")}>{CATALOG_BROWSER.familyPrefix}{groups.find((item) => item.value === group)?.label} ×</button>}
        {priceBand !== "all" && <button type="button" onClick={() => setPriceBand("all")}>{priceLabels[priceBand]} ×</button>}
        {condition !== "all" && <button type="button" onClick={() => setCondition("all")}>{condition === "new" ? CATALOG_BROWSER.conditionNew : "Like New"} ×</button>}
      </div>}
      {visibleProducts.length ? <div className="product-grid catalog-product-grid catalog-refined-grid">
        {visibleProducts.map((product) => <ProductCard key={product.slug} product={product} canManage={canManageProducts} />)}
      </div> : <div className="catalog-empty-state"><span aria-hidden="true">⌕</span><h3>{CATALOG_BROWSER.emptyTitle}</h3><p>{CATALOG_BROWSER.emptyText}</p><button type="button" onClick={clearFilters}>{CATALOG_BROWSER.viewAll}</button></div>}
    </div>
  );
}

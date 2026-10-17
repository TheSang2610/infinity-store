"use client";

import { INSTALLMENT } from "@/src/constants/portal/installment-page";
import { formatOrderMoney } from "@/src/lib/order-pricing";
import { BRAND_ICONS, CATEGORY_TABS, EnrichedSimulatorProductItem } from "./installment-model";
import Image from "next/image";
import Link from "next/link";
import { MIN_INSTALLMENT_TOTAL } from "@/src/lib/installment";
import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

type DevicePickerPanelProps = {
  setSelectedProduct: Dispatch<SetStateAction<EnrichedSimulatorProductItem | null>>;
  selectedProduct: EnrichedSimulatorProductItem | null;
  amount: number;
  setAmount: Dispatch<SetStateAction<number>>;
  enrichedProducts: { normalizedBrand: string; slug: string; name: string; brand: string; category: string; image: string; badge: string; tagline: string; price: number; originalPrice: number; }[];
  initialCategory: string | undefined;
  defaultProduct: { normalizedBrand: string; slug: string; name: string; brand: string; category: string; image: string; badge: string; tagline: string; price: number; originalPrice: number; };
  initialAmount: number | undefined;
};

export default function DevicePickerPanel({ setSelectedProduct, selectedProduct, amount, setAmount, enrichedProducts, initialCategory, defaultProduct, initialAmount }: DevicePickerPanelProps) {
  const availableBrands = useMemo(() => {
    const map = new Map<string, number>();
    enrichedProducts.forEach((p) => {
      const b = p.normalizedBrand;
      map.set(b, (map.get(b) || 0) + 1);
    });

    const priorityOrder = ["Apple", "ASUS", "Sony", "Fujifilm", "OPPO", "Dell", "Canon", "DJI", "Lenovo", "HP", "MSI"];
    const list = Array.from(map.entries()).sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a[0]);
      const bIdx = priorityOrder.indexOf(b[0]);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return b[1] - a[1];
    });

    return [
      { id: "all", name: INSTALLMENT.allBrands, count: enrichedProducts.length, icon: "✦" },
      ...list.map(([brand, count]) => ({
        id: brand,
        name: brand,
        count,
        icon: BRAND_ICONS[brand] || "✦",
      })),
    ];
  }, [enrichedProducts]);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "all");
  const [customAmountMode, setCustomAmountMode] = useState<boolean>(!defaultProduct && !!initialAmount);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const filteredProducts = useMemo(() => {
    return enrichedProducts.filter((p) => {
      // Brand match
      if (selectedBrand !== "all" && p.normalizedBrand !== selectedBrand) {
        return false;
      }

      // Category match
      if (selectedCategory !== "all") {
        if (selectedCategory === "macbook") {
          const isMac =
            p.category === "macbook" ||
            p.category === "macbook-air" ||
            p.category === "macbook-pro" ||
            p.category === "imac" ||
            p.category === "mac-mini-studio";
          if (!isMac) return false;
        } else if (selectedCategory === "laptop") {
          if (p.category !== "laptop" && p.category !== "laptop-cu") return false;
        } else if (p.category !== selectedCategory) {
          return false;
        }
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.normalizedBrand.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [enrichedProducts, selectedBrand, selectedCategory, searchQuery]);
  const modelDropdownProducts = useMemo(() => {
    if (selectedBrand === "all") return enrichedProducts;
    return enrichedProducts.filter((p) => p.normalizedBrand === selectedBrand);
  }, [enrichedProducts, selectedBrand]);
  function handleSelectProduct(item: EnrichedSimulatorProductItem) {
    setSelectedProduct(item);
    setCustomAmountMode(false);
    setAmount(item.price);
  }
  function handleBrandDropdownChange(newBrand: string) {
    setSelectedBrand(newBrand);
    // If current selected product does not belong to new brand, auto-pick first product of that brand
    if (newBrand !== "all") {
      const firstOfBrand = enrichedProducts.find((p) => p.normalizedBrand === newBrand);
      if (firstOfBrand) {
        handleSelectProduct(firstOfBrand);
      }
    }
  }
  function handleModelDropdownChange(slug: string) {
    if (slug === "custom") {
      setCustomAmountMode(true);
      setSelectedProduct(null);
      return;
    }
    const found = enrichedProducts.find((p) => p.slug === slug);
    if (found) {
      handleSelectProduct(found);
      // Auto-sync brand if needed
      if (selectedBrand !== "all" && found.normalizedBrand !== selectedBrand) {
        setSelectedBrand(found.normalizedBrand);
      }
    }
  }

  return (
    <section className="installment-panel" aria-labelledby="step1-title">
      <div className="installment-panel-head">
        <div>
          <h2 id="step1-title">
            <span className="installment-step-num">1</span>
            {INSTALLMENT.pickDeviceTitle}</h2>
          <div className="installment-panel-subtitle">
            {INSTALLMENT.pickDeviceText}</div>
        </div>

        <button
          type="button"
          className={`installment-cat-btn ${customAmountMode ? "active" : ""}`}
          onClick={() => {
            setCustomAmountMode(true);
            setSelectedProduct(null);
          }}
        >
          {INSTALLMENT.customAmount}</button>
      </div>

      {/* TWO-TIER CASCADING SELECTOR: BƯỚC 1 CHỌN HÃNG -> BƯỚC 2 CHỌN TÊN MÁY */}
      {!customAmountMode && (
        <div className="installment-quick-picker-row">
          {/* 1. Brand Select */}
          <div className="installment-select-group">
            <label htmlFor="brand-select">
              <span>🏢</span> {INSTALLMENT.stepBrand}</label>
            <select
              id="brand-select"
              value={selectedBrand}
              onChange={(e) => handleBrandDropdownChange(e.target.value)}
              className="installment-select-dropdown"
            >
              {availableBrands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.icon} {b.name} ({b.count} {INSTALLMENT.devicesClose}</option>
              ))}
            </select>
          </div>

          {/* 2. Model Select */}
          <div className="installment-select-group">
            <label htmlFor="model-select">
              <span>📱</span> {INSTALLMENT.stepModel}</label>
            <select
              id="model-select"
              value={selectedProduct?.slug || ""}
              onChange={(e) => handleModelDropdownChange(e.target.value)}
              className="installment-select-dropdown"
            >
              <option value="" disabled>
                {INSTALLMENT.chooseModel}</option>
              {modelDropdownProducts.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} - {formatOrderMoney(p.price)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* BRAND PILLS TABS */}
      <div className="installment-category-tabs" role="tablist" aria-label={INSTALLMENT.filterByBrand}>
        {availableBrands.map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={selectedBrand === b.id}
            className={`installment-cat-btn ${selectedBrand === b.id ? "active" : ""}`}
            onClick={() => {
              handleBrandDropdownChange(b.id);
              setCustomAmountMode(false);
            }}
          >
            <span>{b.icon}</span>
            <span>{b.name}</span>
            <span style={{ fontSize: "11px", opacity: 0.65 }}>({b.count})</span>
          </button>
        ))}
      </div>

      {/* CATEGORY SUB-TABS (Only when brand is All or Apple) */}
      {(selectedBrand === "all" || selectedBrand === "Apple") && !customAmountMode && (
        <div
          className="installment-category-tabs"
          style={{ marginBottom: "16px", borderBottom: "1px solid var(--lux-border)", paddingBottom: "12px" }}
        >
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`installment-cat-btn ${selectedCategory === cat.id ? "active" : ""}`}
              style={{ fontSize: "12px", padding: "6px 14px" }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* LIVE SEARCH INPUT */}
      <div className="installment-search-box">
        <span className="installment-search-icon" aria-hidden="true">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={INSTALLMENT.searchPlaceholder}
          className="installment-search-input"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="installment-search-clear"
            title={INSTALLMENT.clearSearch}
          >
            ✕
          </button>
        )}
      </div>

      {/* PRODUCT PICKER GRID */}
      {!customAmountMode && (
        <>
          <div className="installment-product-grid">
            {filteredProducts.map((p) => {
              const isSelected = selectedProduct?.slug === p.slug;
              const monthlyPreview = Math.round((p.price * 0.8) / 12);
              const brandIcon = BRAND_ICONS[p.normalizedBrand] || "✦";

              return (
                <div
                  key={p.slug}
                  className={`installment-product-item ${isSelected ? "is-selected" : ""}`}
                  onClick={() => handleSelectProduct(p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleSelectProduct(p)}
                >
                  <div className="installment-item-thumb">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 160px, 220px"
                      className="installment-item-img"
                      unoptimized={p.image.startsWith("http")}
                    />
                    {p.badge && <span className="installment-item-badge">{p.badge}</span>}
                  </div>

                  <div className="installment-item-info">
                    <span className="installment-item-cat">
                      {brandIcon} {p.normalizedBrand}
                    </span>
                    <strong className="installment-item-name" title={p.name}>
                      {p.name}
                    </strong>
                    <div className="installment-item-price">{formatOrderMoney(p.price)}</div>
                    <div className="installment-item-monthly-estimate">
                      {INSTALLMENT.payFrom}{formatOrderMoney(monthlyPreview)}/th
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 20px", color: "var(--lux-text-secondary)" }}>
              {INSTALLMENT.noResultsPrefix}{selectedBrand !== "all" ? selectedBrand : ""}{" "}
              {searchQuery}&rdquo;.
              <br />
              <button
                type="button"
                className="installment-cat-btn"
                style={{ marginTop: "12px" }}
                onClick={() => {
                  setSelectedBrand("all");
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
              >
                {INSTALLMENT.viewAllBrands}</button>
            </div>
          )}
        </>
      )}

      {/* ACTIVE SELECTED PRODUCT SHOWCASE */}
      {selectedProduct && !customAmountMode && (
        <div className="installment-selected-hero-box">
          <div className="installment-selected-thumb">
            <Image
              src={selectedProduct.image}
              alt={selectedProduct.name}
              fill
              sizes="80px"
              style={{ objectFit: "contain" }}
              unoptimized={selectedProduct.image.startsWith("http")}
            />
          </div>

          <div className="installment-selected-meta">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                style={{
                  background: "rgba(41, 151, 255, 0.2)",
                  color: "var(--lux-blue)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                {BRAND_ICONS[selectedProduct.normalizedBrand] || "✦"} {selectedProduct.normalizedBrand}
              </span>
              <span style={{ fontSize: "11.5px", color: "var(--lux-text-muted)" }}>
                {selectedProduct.category.toUpperCase()}
              </span>
            </div>

            <h3>{selectedProduct.name}</h3>
            <p>{selectedProduct.tagline || INSTALLMENT.genuineSealed(selectedProduct.normalizedBrand)}</p>

            <div className="installment-selected-price">
              {INSTALLMENT.listPrice}{formatOrderMoney(selectedProduct.price)}
            </div>
          </div>

          <Link
            href={`/san-pham/${selectedProduct.slug}`}
            target="_blank"
            className="installment-btn-secondary"
            style={{ width: "auto", padding: "0 16px", height: "38px" }}
          >
            {INSTALLMENT.viewDevice}</Link>
        </div>
      )}

      {/* CUSTOM AMOUNT MODE */}
      {customAmountMode && (
        <div className="installment-custom-amount-card">
          <div>
            <strong style={{ display: "block", fontSize: "14px", color: "#fff", marginBottom: "4px" }}>
              {INSTALLMENT.enterAmount}</strong>
            <span style={{ fontSize: "12px", color: "var(--lux-text-secondary)" }}>
              {INSTALLMENT.rangeFrom}{formatOrderMoney(MIN_INSTALLMENT_TOTAL)} {INSTALLMENT.rangeTo}</span>
          </div>

          <div className="installment-custom-money-input-wrap">
            <input
              type="number"
              min={MIN_INSTALLMENT_TOTAL}
              max={200000000}
              step={500000}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              className="installment-custom-money-input"
            />
            <strong>{INSTALLMENT.currency}</strong>
          </div>
        </div>
      )}
    </section>
  );
}

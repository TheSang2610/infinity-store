"use client";

import { PRODUCT_FORM } from "@/src/constants/admin/components";
import type { ManagedProduct, ProductCategory } from "@/src/types";
import {
  CATEGORY_OPTIONS, CURRENT_MACBOOK_CHIPS, EditableCategory, ProductFieldConfig,
} from "@/src/constants/admin/product-fields";
import { useState } from "react";
import { productSpecValue } from "../product-form-model";
import type { Dispatch, SetStateAction } from "react";

type BasicInfoCardProps = {
  status: "draft" | "active" | "inactive";
  setStatus: Dispatch<SetStateAction<"draft" | "active" | "inactive">>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  category: "iphone" | "android" | "ipad" | "tablet" | "macbook" | "macbook-air" | "macbook-pro" | "mac-mini-studio" | "imac" | "laptop" | "laptop-cu" | "smartwatch" | "audio" | "phu-kien" | "may-anh";
  setCategory: Dispatch<SetStateAction<"iphone" | "android" | "ipad" | "tablet" | "macbook" | "macbook-air" | "macbook-pro" | "mac-mini-studio" | "imac" | "laptop" | "laptop-cu" | "smartwatch" | "audio" | "phu-kien" | "may-anh">>;
  brand: string;
  setBrand: Dispatch<SetStateAction<string>>;
  fieldGroup: EditableCategory;
  modelChip: string;
  setModelChip: Dispatch<SetStateAction<string>>;
  setMatrixVersion: Dispatch<SetStateAction<string>>;
  screenSize: string;
  setScreenSize: Dispatch<SetStateAction<string>>;
  sellingPrice: string;
  setSellingPrice: Dispatch<SetStateAction<string>>;
  stock: string;
  setStock: Dispatch<SetStateAction<string>>;
  tagline: string;
  setTagline: Dispatch<SetStateAction<string>>;
  fieldConfig: ProductFieldConfig;
  product: ManagedProduct | undefined;
  badge: string;
  setBadge: Dispatch<SetStateAction<string>>;
  salePrice: string;
  setSalePrice: Dispatch<SetStateAction<string>>;
  setSpecsText: Dispatch<SetStateAction<string>>;
};

export default function BasicInfoCard({ status, setStatus, name, setName, category, setCategory, brand, setBrand, fieldGroup, modelChip, setModelChip, setMatrixVersion, screenSize, setScreenSize, sellingPrice, setSellingPrice, stock, setStock, tagline, setTagline, fieldConfig, product, badge, setBadge, salePrice, setSalePrice, setSpecsText }: BasicInfoCardProps) {
  const [modelYear, setModelYear] = useState(() => productSpecValue(product, [PRODUCT_FORM.releaseYear, PRODUCT_FORM.yearLabel]) || "");
  function updateModelSpec(label: string, aliases: string[], nextValue: string) {
    setSpecsText((current) => {
      const lines = current.split("\n").map((line) => line.trim()).filter(Boolean);
      const normalizedAliases = aliases.map((alias) => `${alias}:`.toLocaleLowerCase("vi"));
      const index = lines.findIndex((line) => normalizedAliases.some((prefix) => line.toLocaleLowerCase("vi").startsWith(prefix)));
      const nextLine = nextValue.trim() ? `${label}: ${nextValue.trim()}` : "";
      if (index >= 0 && nextLine) lines[index] = nextLine;
      else if (index >= 0) lines.splice(index, 1);
      else if (nextLine) lines.push(nextLine);
      return lines.join("\n");
    });
  }
  function selectModelChip(chip: string) {
    setModelChip(chip);
    setMatrixVersion(chip);
    updateModelSpec("Chip / CPU", ["Chip / CPU", PRODUCT_FORM.chipLabel], chip);
  }

  return (
    <div className="admin-card admin-product-step-card">
      <div className="admin-card-head">
        <div className="admin-product-step-title"><b>01</b><div><span>{PRODUCT_FORM.mainEyebrow}</span><h2>{PRODUCT_FORM.mainTitle}</h2><p>{PRODUCT_FORM.mainText}</p></div></div>
        <label className="admin-product-status"><span>{PRODUCT_FORM.status}</span><select name="status" value={status} onChange={(event) => setStatus(event.target.value as "draft" | "active" | "inactive")}><option value="active">{PRODUCT_FORM.statusActive}</option><option value="draft">{PRODUCT_FORM.statusDraft}</option><option value="inactive">{PRODUCT_FORM.statusInactive}</option></select></label>
      </div>
      <div className="admin-form-grid admin-product-essential-grid">
        <label className="admin-field admin-span-2">{PRODUCT_FORM.modelName}<em>{PRODUCT_FORM.required}</em><input name="name" value={name} onChange={(event) => setName(event.target.value)} required placeholder={PRODUCT_FORM.modelPlaceholder} /></label>
        <label className="admin-field">{PRODUCT_FORM.category}<em>{PRODUCT_FORM.required}</em><select name="category" value={category} onChange={(event) => setCategory(event.target.value as ProductCategory)}>{CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="admin-field">{PRODUCT_FORM.brand}<em>{PRODUCT_FORM.required}</em><input name="brand" value={brand} onChange={(event) => setBrand(event.target.value)} required placeholder="Apple" /></label>
        <label className="admin-field">Chip / CPU<input list={`model-chip-options-${fieldGroup}`} value={modelChip} onChange={(event) => { setModelChip(event.target.value); setMatrixVersion(event.target.value); updateModelSpec("Chip / CPU", ["Chip / CPU", PRODUCT_FORM.chipLabel], event.target.value); }} placeholder="Apple M5 / Intel Core Ultra 7" /></label>
        <label className="admin-field">{PRODUCT_FORM.screenSize}<input value={screenSize} onChange={(event) => { setScreenSize(event.target.value); updateModelSpec(PRODUCT_FORM.screenSize, [PRODUCT_FORM.screenSize], event.target.value); }} placeholder="13.6 inch" /></label>
        <label className="admin-field">{PRODUCT_FORM.releaseYear}<input inputMode="numeric" value={modelYear} onChange={(event) => { setModelYear(event.target.value); updateModelSpec(PRODUCT_FORM.releaseYear, [PRODUCT_FORM.releaseYear, PRODUCT_FORM.yearLabel], event.target.value); }} placeholder="2024" /></label>
        <label className="admin-field">{PRODUCT_FORM.sellingPrice}<em>{PRODUCT_FORM.required}</em><input name="sellingPrice" value={sellingPrice} onChange={(event) => setSellingPrice(event.target.value)} placeholder={PRODUCT_FORM.pricePlaceholder} /></label>
        <label className="admin-field">{PRODUCT_FORM.stock}<input name="stock" type="number" min="0" value={stock} onChange={(event) => setStock(event.target.value)} /></label>
        <label className="admin-field admin-span-2">{PRODUCT_FORM.shortDescription}<input name="tagline" value={tagline} onChange={(event) => setTagline(event.target.value)} placeholder={PRODUCT_FORM.shortDescriptionPlaceholder} /></label>
      </div>
      <datalist id={`model-chip-options-${fieldGroup}`}>{fieldConfig.versionOptions.map((option) => <option key={option} value={option} />)}</datalist>
      {fieldGroup === "macbook" && <section className="admin-macbook-chip-picker" aria-label={PRODUCT_FORM.appleChipLabel}>
        <header><div><span>{PRODUCT_FORM.appleChipEyebrow}</span><strong>{PRODUCT_FORM.appleChipHint}</strong></div><small>{PRODUCT_FORM.appleChipNote}</small></header>
        <div>{CURRENT_MACBOOK_CHIPS.map((chip) => <button className={modelChip === chip.value ? "is-selected" : ""} type="button" aria-pressed={modelChip === chip.value} onClick={() => selectModelChip(chip.value)} key={chip.value}><i>{chip.value.replace("Apple ", "")}</i><span><strong>{chip.value}</strong><small>{chip.family} · {chip.note}</small></span><b>{modelChip === chip.value ? "✓" : "+"}</b></button>)}</div>
      </section>}
      <details className="admin-product-optional">
        <summary><span>{PRODUCT_FORM.advancedTitle}</span><small>{PRODUCT_FORM.advancedText}</small></summary>
        <div className="admin-form-grid">
          <label className="admin-field">SKU<input name="sku" defaultValue={product?.sku} placeholder="MBA-M4-13" /></label>
          <label className="admin-field">{PRODUCT_FORM.badge}<input name="badge" value={badge} onChange={(event) => setBadge(event.target.value)} placeholder={PRODUCT_FORM.badgePlaceholder} /></label>
          <label className="admin-field">{PRODUCT_FORM.costPrice}<input name="costPrice" defaultValue={product?.costPrice} placeholder={PRODUCT_FORM.costPlaceholder} /></label>
          <label className="admin-field">{PRODUCT_FORM.salePrice}<input name="salePrice" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} placeholder={PRODUCT_FORM.salePlaceholder} /></label>
          <label className="admin-field admin-span-2">{PRODUCT_FORM.longDescription}<textarea name="description" rows={4} defaultValue={product?.description ?? product?.tagline} placeholder={PRODUCT_FORM.longDescriptionPlaceholder} /></label>
        </div>
      </details>
    </div>
  );
}

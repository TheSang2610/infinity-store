"use client";

import { PRODUCT_FORM } from "@/src/constants/admin/components";
import type { ManagedProduct } from "@/src/types";

type SeoCardProps = {
  product: ManagedProduct | undefined;
  name: string;
};

export default function SeoCard({ product, name }: SeoCardProps) {
  return (
    <details className="admin-card admin-product-seo">
      <summary><span className="admin-product-step-title"><b>04</b><span><em>{PRODUCT_FORM.publishEyebrow}</em><strong>{PRODUCT_FORM.seoTitle}</strong><small>{PRODUCT_FORM.seoText}</small></span></span><i>＋</i></summary>
      <div className="admin-form-grid">
        <label className="admin-field admin-span-2">{PRODUCT_FORM.seoTitleLabel}<input name="seoTitle" defaultValue={product?.seoTitle} placeholder={name || PRODUCT_FORM.productNameTip} /></label>
        <label className="admin-field admin-span-2">{PRODUCT_FORM.seoDescription}<textarea name="seoDescription" rows={3} defaultValue={product?.seoDescription} /></label>
        <label className="admin-field admin-span-2">{PRODUCT_FORM.source}<input name="source" defaultValue={product?.source} placeholder="https://..." /></label>
        <label className="admin-check"><input type="checkbox" name="featured" defaultChecked={product?.featured} /> {PRODUCT_FORM.featured}</label>
      </div>
    </details>
  );
}

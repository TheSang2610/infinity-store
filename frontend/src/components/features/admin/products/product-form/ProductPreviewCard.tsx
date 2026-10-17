"use client";

import { PRODUCT_FORM } from "@/src/constants/admin/components";
import { useState } from "react";
import { CATEGORY_OPTIONS } from "@/src/constants/admin/product-fields";
import Image from "next/image";
import type { ProductVariant } from "@/src/lib/products";

type ProductPreviewCardProps = {
  status: "draft" | "active" | "inactive";
  badge: string;
  brand: string;
  name: string;
  tagline: string;
  salePrice: string;
  sellingPrice: string;
  stock: string;
  primaryImage: string;
  previews: string[];
  images: string[];
  category: "iphone" | "android" | "ipad" | "tablet" | "macbook" | "macbook-air" | "macbook-pro" | "mac-mini-studio" | "imac" | "laptop" | "laptop-cu" | "smartwatch" | "audio" | "phu-kien" | "may-anh";
  variants: ProductVariant[];
};

export default function ProductPreviewCard({ status, badge, brand, name, tagline, salePrice, sellingPrice, stock, primaryImage, previews, images, category, variants }: ProductPreviewCardProps) {
  const [previewMode, setPreviewMode] = useState<"card" | "detail">("card");
  const previewImage = primaryImage || previews[0] || images[0] || "/products/iphone-16.png";
  const hasProductImage = Boolean(primaryImage || previews.length || images.length);
  const readinessItems = [
    { label: PRODUCT_FORM.productNameTip, ready: Boolean(name.trim()) },
    { label: PRODUCT_FORM.sellingPriceShort, ready: Boolean(sellingPrice.trim()) },
    { label: PRODUCT_FORM.primaryImage, ready: hasProductImage },
    { label: PRODUCT_FORM.categoryLabel, ready: Boolean(category) },
  ];
  const readinessCount = readinessItems.filter((item) => item.ready).length;
  const categoryLabel = CATEGORY_OPTIONS.find(([value]) => value === category)?.[1] ?? category;
  const customerPrice = salePrice.trim() || sellingPrice.trim() || PRODUCT_FORM.contactPrice;
  const previewVariants = variants.filter((variant) => variant.status !== "inactive").slice(0, 4);
  function renderPreviewImage(sizes = "320px") {
    return previewImage.startsWith("blob:") ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={previewImage} alt={name || PRODUCT_FORM.previewAlt} />
    ) : (
      <Image src={previewImage} alt={name || PRODUCT_FORM.previewAlt} fill unoptimized sizes={sizes} />
    );
  }

  return (
    <div className="admin-preview-card">
      <header><span>{PRODUCT_FORM.customerSees}</span><em>{readinessCount}{PRODUCT_FORM.mainItemsSuffix}</em></header>
      <div className="admin-customer-preview-tabs" aria-label={PRODUCT_FORM.previewMode}>
        <button type="button" className={previewMode === "card" ? "is-active" : ""} aria-pressed={previewMode === "card"} onClick={() => setPreviewMode("card")}>{PRODUCT_FORM.previewList}</button>
        <button type="button" className={previewMode === "detail" ? "is-active" : ""} aria-pressed={previewMode === "detail"} onClick={() => setPreviewMode("detail")}>{PRODUCT_FORM.previewDetail}</button>
      </div>

      <div className="admin-customer-preview-stage" data-preview-mode={previewMode}>
        {status !== "active" && <div className="admin-customer-preview-visibility"><strong>{status === "draft" ? PRODUCT_FORM.statusDraft : PRODUCT_FORM.statusInactive}</strong><span>{PRODUCT_FORM.notVisible}</span></div>}

        {previewMode === "card" ? (
          <article className="admin-customer-product-card" aria-label={PRODUCT_FORM.cardPreviewLabel}>
            <div className="admin-customer-card-badges"><b>{badge.trim() || PRODUCT_FORM.newProductBadge}</b><span>{PRODUCT_FORM.installmentBadge}</span></div>
            <div className="admin-customer-card-media">{renderPreviewImage("300px")}</div>
            <div className="admin-customer-card-copy">
              <small>{brand.trim() || categoryLabel} · {categoryLabel}</small>
              <strong>{name.trim() || PRODUCT_FORM.namePlaceholderPreview}</strong>
              {tagline.trim() && <span>{tagline}</span>}
              <div className="admin-customer-card-price"><b>{customerPrice}</b>{salePrice.trim() && sellingPrice.trim() && <del>{sellingPrice}</del>}</div>
              <em>{PRODUCT_FORM.memberDiscount}</em>
              <footer><span>★★★★★</span><small>{Number(stock) > 0 ? PRODUCT_FORM.inStockCount(stock) : PRODUCT_FORM.contactStock}</small></footer>
            </div>
          </article>
        ) : (
          <article className="admin-customer-product-detail" aria-label={PRODUCT_FORM.detailPreviewLabel}>
            <div className="admin-customer-detail-topbar"><span>{PRODUCT_FORM.homeBreadcrumb}{categoryLabel}</span><b>{status === "active" ? PRODUCT_FORM.statusActive : PRODUCT_FORM.notPublished}</b></div>
            <div className="admin-customer-detail-media">{renderPreviewImage("300px")}</div>
            <div className="admin-customer-detail-copy">
              <small>{brand.trim() || categoryLabel}</small>
              <strong>{name.trim() || PRODUCT_FORM.productNameTip}</strong>
              <span>{tagline.trim() || PRODUCT_FORM.descriptionPlaceholderPreview}</span>
              <div><b>{customerPrice}</b>{salePrice.trim() && sellingPrice.trim() && <del>{sellingPrice}</del>}</div>
              {previewVariants.length > 0 && <section><small>{PRODUCT_FORM.configChoices}</small><div>{previewVariants.map((variant) => <em key={variant.id}>{[variant.ram, variant.storage, variant.color].filter(Boolean).join(" · ") || variant.name || PRODUCT_FORM.stepConfig}</em>)}</div></section>}
              <button type="button" tabIndex={-1}>{PRODUCT_FORM.addToCart}</button>
            </div>
          </article>
        )}
      </div>

      <div className="admin-customer-preview-note"><i>✦</i><span><strong>{PRODUCT_FORM.livePreview}</strong><small>{PRODUCT_FORM.livePreviewText}</small></span></div>
      <div className="admin-product-readiness">
        {readinessItems.map((item) => <span className={item.ready ? "is-ready" : ""} key={item.label}><i>{item.ready ? "✓" : "·"}</i>{item.label}</span>)}
      </div>
    </div>
  );
}

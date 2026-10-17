"use client";

import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";
import type { Product } from "@/src/lib/products";
import Image from "next/image";
import Link from "next/link";

type StickyBuyBarProps = {
  stickyVisible: boolean;
  activeImage: string;
  product: Product;
  configurationSummary: string;
  selectedPriceFormatted: string;
  canAddToCart: boolean;
  handleAddToCart: () => void;
  addedToCart: boolean;
  orderHref: string;
  handleBuyNow: (e: React.MouseEvent) => void;
};

export default function StickyBuyBar({ stickyVisible, activeImage, product, configurationSummary, selectedPriceFormatted, canAddToCart, handleAddToCart, addedToCart, orderHref, handleBuyNow }: StickyBuyBarProps) {
  return (
    <aside className={`pdp-sticky-bar ${stickyVisible ? "is-visible" : ""}`} aria-label={PRODUCT_DETAIL.stickyBar} inert={!stickyVisible}>
      <div className="pdp-sticky-inner">
        <div className="pdp-sticky-left">
          <div className="pdp-sticky-thumb">
            <Image src={activeImage} alt="" fill unoptimized style={{ objectFit: "contain" }} sizes="44px" />
          </div>
          <div className="pdp-sticky-info">
            <h4 className="pdp-sticky-title">{product.name}</h4>
            <p className="pdp-sticky-variant">{configurationSummary}</p>
          </div>
        </div>
        <div className="pdp-sticky-right">
          <span className="pdp-sticky-price">{selectedPriceFormatted}</span>
          <button
            type="button"
            className="pdp-sticky-btn-cart"
            disabled={!canAddToCart}
            onClick={handleAddToCart}
          >
            {addedToCart ? PRODUCT_DETAIL.addedShort : PRODUCT_DETAIL.addShort}
          </button>
          <Link
            href={orderHref}
            className={`pdp-sticky-btn-buy ${!canAddToCart ? "is-disabled" : ""}`}
            aria-disabled={!canAddToCart}
            onClick={handleBuyNow}
          >
            {canAddToCart ? "Mua ngay" : PRODUCT_DETAIL.outOfStock}
          </Link>
        </div>
      </div>
    </aside>
  );
}

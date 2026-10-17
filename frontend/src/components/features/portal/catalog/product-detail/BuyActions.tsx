"use client";

import Link from "next/link";
import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";
import { telHref, zaloHref } from "@/src/lib/store-settings";
import { useStoreSettings } from "@/src/hooks/store-settings";

type BuyActionsProps = {
  canAddToCart: boolean;
  orderHref: string;
  handleBuyNow: (e: React.MouseEvent) => void;
  addedToCart: boolean;
  handleAddToCart: () => void;
  installmentHref: string;
};

export default function BuyActions({ canAddToCart, orderHref, handleBuyNow, addedToCart, handleAddToCart, installmentHref }: BuyActionsProps) {
  const store = useStoreSettings();

  return (
    <div className="pdp-cta-block">
      {canAddToCart ? (
        <Link href={orderHref} className="pdp-btn-buy-now" onClick={handleBuyNow}>
          <span>Mua ngay</span>
          <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <button type="button" disabled className="pdp-btn-buy-now is-disabled">
          {PRODUCT_DETAIL.configUnavailable}</button>
      )}

      <div className="pdp-cta-secondary-row">
        <button
          type="button"
          className={`pdp-btn-add-cart ${addedToCart ? "added" : ""}`}
          disabled={!canAddToCart}
          onClick={handleAddToCart}
        >
          <span>{addedToCart ? PRODUCT_DETAIL.added : PRODUCT_DETAIL.addToCart}</span>
        </button>
        <Link href={installmentHref} className="pdp-btn-installment">
          <span>{PRODUCT_DETAIL.installment}</span>
        </Link>
      </div>

      {(store.consultPhone || store.zaloPhone) && (
        <p className="pdp-hotline-consultation">
          {PRODUCT_DETAIL.needAdvice}{store.consultPhone && <> {PRODUCT_DETAIL.callPrefix}<a href={telHref(store.consultPhone)}>{store.consultPhone}</a></>}
          {store.consultPhone && store.zaloPhone && PRODUCT_DETAIL.or}
          {store.zaloPhone && <> <a href={zaloHref(store.zaloPhone)} target="_blank" rel="noreferrer">Chat Zalo 24/7</a></>}
        </p>
      )}
    </div>
  );
}

"use client";

import { CHECKOUT } from "@/src/constants/portal/checkout";
import Image from "next/image";
import Link from "next/link";
import { formatOrderMoney } from "@/src/lib/order-pricing";
import type { Dispatch, SetStateAction } from "react";
import type { CartLine } from "@/src/hooks/cart";
import type { VoucherQuote } from "../checkout-model";

type CartReviewProps = {
  itemCount: number;
  items: CartLine[];
  brands: Record<string, string>;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  subtotal: number;
  includeAppleCare: boolean;
  appleCarePrice: 0 | 990000;
  activeVoucher: VoucherQuote | null;
  isStoreVisit: boolean;
  voucherInput: string;
  setVoucherInput: Dispatch<SetStateAction<string>>;
  applyVoucher: () => Promise<void>;
  voucherMessage: string;
  total: number;
  setActiveStep: Dispatch<SetStateAction<2 | 1 | 3>>;
};

export default function CartReview({ itemCount, items, brands, removeItem, updateQuantity, subtotal, includeAppleCare, appleCarePrice, activeVoucher, isStoreVisit, voucherInput, setVoucherInput, applyVoucher, voucherMessage, total, setActiveStep }: CartReviewProps) {
  return (
    <div className="cart-review">
      <header className="quick-order-heading">
        <span>{CHECKOUT.reviewEyebrow}</span>
        <h1>{CHECKOUT.reviewTitle}</h1>
        <p>{CHECKOUT.reviewText}</p>
      </header>

      <div className="quick-order-layout">
        <section className="quick-order-products" aria-label={CHECKOUT.itemsLabel}>
          <header>
            <h2>{CHECKOUT.itemsTitle}</h2>
            <span>{itemCount} {CHECKOUT.products}</span>
          </header>
          <div className="quick-order-list">
            {items.map((item) => (
              <article className="quick-order-item" key={item.key}>
                <div className="quick-order-image">
                  <Image src={item.image} alt={item.productName} width={130} height={130} unoptimized />
                </div>
                <div className="quick-order-info">
                  <span>{brands[item.productSlug] || "Infinity Store"}</span>
                  <h3>{item.productName}</h3>
                  <p>
                    {[item.ram && `${item.ram} RAM`, item.storage, item.color].filter(Boolean).join(" · ") ||
                      CHECKOUT.standardVersion}
                  </p>
                  <div className="cart-review-links">
                    <Link href={`/san-pham/${item.productSlug}`}>{CHECKOUT.viewProduct}</Link>
                    <button type="button" onClick={() => removeItem(item.key)}>
                      {CHECKOUT.remove}</button>
                  </div>
                </div>
                <div className="quick-order-price">
                  <strong>{formatOrderMoney(item.unitPrice * item.quantity)}</strong>
                  <small>{CHECKOUT.unitPrice}{formatOrderMoney(item.unitPrice)}</small>
                  <div className="quick-order-quantity" aria-label={CHECKOUT.quantityOf(item.productName)}>
                    <button
                      type="button"
                      aria-label={CHECKOUT.decrease}
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                    >
                      −
                    </button>
                    <b>{item.quantity}</b>
                    <button
                      type="button"
                      aria-label={CHECKOUT.increase}
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="quick-order-summary">
          <span className="quick-order-summary-kicker">{CHECKOUT.summaryEyebrow}</span>
          <h2>{CHECKOUT.priceDetails}</h2>
          <dl>
            <div>
              <dt>{CHECKOUT.subtotalOpen}{itemCount} {CHECKOUT.subtotalClose}</dt>
              <dd>{formatOrderMoney(subtotal)}</dd>
            </div>
            {includeAppleCare && (
              <div>
                <dt>{CHECKOUT.appleCare}</dt>
                <dd>+{formatOrderMoney(appleCarePrice)}</dd>
              </div>
            )}
            {activeVoucher && (
              <div className="is-discount">
                <dt>{CHECKOUT.codePrefix}{activeVoucher.code}</dt>
                <dd>−{formatOrderMoney(activeVoucher.discount)}</dd>
              </div>
            )}
            <div>
              <dt>{CHECKOUT.paymentFee}</dt>
              <dd className="is-free">{CHECKOUT.free}</dd>
            </div>
          </dl>
          {!isStoreVisit && (
            <div className="quick-order-voucher">
              <label htmlFor="cart-review-voucher">{CHECKOUT.voucher}</label>
              <div>
                <input
                  id="cart-review-voucher"
                  value={voucherInput}
                  onChange={(event) => setVoucherInput(event.target.value.toUpperCase())}
                  placeholder={CHECKOUT.voucherPlaceholder}
                />
                <button type="button" onClick={applyVoucher} disabled={!voucherInput.trim()}>
                  {CHECKOUT.apply}</button>
              </div>
              {voucherMessage && <p className={activeVoucher ? "is-success" : "is-error"}>{voucherMessage}</p>}
            </div>
          )}
          <div className="quick-order-total">
            <span>{CHECKOUT.total}</span>
            <strong>{formatOrderMoney(total)}</strong>
            <small>{CHECKOUT.totalNote}</small>
          </div>
          <button
            type="button"
            className="quick-order-continue"
            onClick={() => {
              setActiveStep(2);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {CHECKOUT.continue}<span>→</span>
          </button>
          <Link className="quick-order-back" href="/">
            {CHECKOUT.backArrow}</Link>
        </aside>
      </div>
    </div>
  );
}

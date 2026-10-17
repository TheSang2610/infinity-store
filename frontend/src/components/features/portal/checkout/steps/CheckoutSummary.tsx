"use client";

import { CHECKOUT } from "@/src/constants/portal/checkout";
import Image from "next/image";
import { formatOrderMoney } from "@/src/lib/order-pricing";
import type { Dispatch, SetStateAction } from "react";
import type { CartLine } from "@/src/hooks/cart";
import type { VoucherQuote } from "../checkout-model";

type CheckoutSummaryProps = {
  setActiveStep: Dispatch<SetStateAction<1 | 2 | 3>>;
  items: CartLine[];
  isStoreVisit: boolean;
  voucherInput: string;
  setVoucherInput: Dispatch<SetStateAction<string>>;
  applyVoucher: () => Promise<void>;
  voucherMessage: string;
  activeVoucher: VoucherQuote | null;
  itemCount: number;
  subtotal: number;
  includeAppleCare: boolean;
  appleCarePrice: 0 | 990000;
  total: number;
  message: string;
  status: "idle" | "sending" | "error";
};

export default function CheckoutSummary({ setActiveStep, items, isStoreVisit, voucherInput, setVoucherInput, applyVoucher, voucherMessage, activeVoucher, itemCount, subtotal, includeAppleCare, appleCarePrice, total, message, status }: CheckoutSummaryProps) {
  return (
    <aside className="quick-order-summary co-summary">
      <div className="co-summary-head">
        <h2>{CHECKOUT.order}</h2>
        <button type="button" className="co-link" onClick={() => setActiveStep(1)}>
          {CHECKOUT.edit}</button>
      </div>

      <div className="quick-payment-mini-items">
        {items.map((item) => (
          <div key={item.key}>
            <Image src={item.image} alt={item.productName} width={48} height={48} unoptimized />
            <p>
              <strong>{item.productName}</strong>
              <small>
                {[item.storage, item.color].filter(Boolean).join(" · ")} × {item.quantity}
              </small>
            </p>
          </div>
        ))}
      </div>

      {!isStoreVisit && (
        <div className="quick-order-voucher">
          <label htmlFor="checkout-voucher">{CHECKOUT.voucherCode}</label>
          <div>
            <input
              id="checkout-voucher"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
              placeholder={CHECKOUT.voucherPlaceholder}
            />
            <button type="button" onClick={applyVoucher} disabled={!voucherInput.trim()}>
              {CHECKOUT.apply}</button>
          </div>
          {voucherMessage && <p className={activeVoucher ? "is-success" : "is-error"}>{voucherMessage}</p>}
        </div>
      )}

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
          <dt>{isStoreVisit ? CHECKOUT.pickupAt : CHECKOUT.shipping}</dt>
          <dd className="is-free">{isStoreVisit ? CHECKOUT.branchShort : CHECKOUT.free}</dd>
        </div>
      </dl>

      <div className="quick-order-total">
        <span>{isStoreVisit ? CHECKOUT.estimatedTotal : CHECKOUT.total}</span>
        <strong>{formatOrderMoney(total)}</strong>
        <small>{CHECKOUT.totalNote}</small>
      </div>

      {message && (
        <p className="co-error" role="alert">
          {message}
        </p>
      )}

      <button type="submit" className="quick-order-continue" disabled={status === "sending"}>
        {status === "sending" ? CHECKOUT.placing : isStoreVisit ? CHECKOUT.confirmVisit : CHECKOUT.placeOrder}
        <span>→</span>
      </button>

      <ul className="co-trust">
        <li>{CHECKOUT.genuineVna}</li>
        <li>{CHECKOUT.freeReturn}</li>
      </ul>
    </aside>
  );
}

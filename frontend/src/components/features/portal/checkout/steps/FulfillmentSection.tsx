"use client";

import { CHECKOUT } from "@/src/constants/portal/checkout";
import { STORE_VISIT, type VoucherQuote } from "../checkout-model";
import type { Dispatch, SetStateAction } from "react";

type FulfillmentSectionProps = {
  purchaseMode: "online" | "store";
  isStoreVisit: boolean;
  setPurchaseMode: Dispatch<SetStateAction<"online" | "store">>;
  setMessage: Dispatch<SetStateAction<string>>;
  setPaymentMethod: Dispatch<SetStateAction<string>>;
  setVoucher: Dispatch<SetStateAction<VoucherQuote | null>>;
  setVoucherMessage: Dispatch<SetStateAction<string>>;
  bankPayment: string;
};

export default function FulfillmentSection({ purchaseMode, isStoreVisit, setPurchaseMode, setMessage, setPaymentMethod, setVoucher, setVoucherMessage, bankPayment }: FulfillmentSectionProps) {
  function chooseMode(mode: "online" | "store") {
    setPurchaseMode(mode);
    setMessage("");
    if (mode === "store") {
      setPaymentMethod("");
      setVoucher(null);
      setVoucherMessage("");
    } else {
      setPaymentMethod(bankPayment);
    }
  }

  return (
    <section className="co-card" aria-labelledby="co-receive">
      <h2 id="co-receive">
        <span>1</span> {CHECKOUT.fulfillment}</h2>
      <div className="co-choice-grid">
        <label className={`co-choice ${purchaseMode === "online" ? "is-selected" : ""}`}>
          <input
            type="radio"
            name="purchase_mode"
            checked={purchaseMode === "online"}
            onChange={() => chooseMode("online")}
          />
          <span className="co-choice-body">
            <strong>{CHECKOUT.online}</strong>
            <small>{CHECKOUT.onlineText}</small>
          </span>
        </label>
        <label className={`co-choice ${isStoreVisit ? "is-selected" : ""}`}>
          <input
            type="radio"
            name="purchase_mode"
            checked={isStoreVisit}
            onChange={() => chooseMode("store")}
          />
          <span className="co-choice-body">
            <strong>{STORE_VISIT}</strong>
            <small>{CHECKOUT.storeVisitText}</small>
          </span>
        </label>
      </div>
    </section>
  );
}

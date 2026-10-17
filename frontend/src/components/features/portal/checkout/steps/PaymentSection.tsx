"use client";

import { CHECKOUT } from "@/src/constants/portal/checkout";
import type { Dispatch, SetStateAction } from "react";

type PaymentSectionProps = {
  paymentMethod: string;
  setPaymentMethod: Dispatch<SetStateAction<string>>;
  bankPayment: string;
  momoPayment: string;
  applePayment: string;
  installmentPayment: string;
};

export default function PaymentSection({ paymentMethod, setPaymentMethod, bankPayment, momoPayment, applePayment, installmentPayment }: PaymentSectionProps) {
  const paymentOptions = [
    { value: bankPayment, icon: "🏦", title: CHECKOUT.optionBank, desc: CHECKOUT.optionBankText, tag: CHECKOUT.recommended },
    { value: momoPayment, icon: "M", title: CHECKOUT.optionMomo, desc: CHECKOUT.optionMomoText, iconClass: "is-momo" },
    { value: applePayment, icon: "Pay", title: "Apple Pay", desc: CHECKOUT.optionApplePayText, iconClass: "is-apple" },
    { value: installmentPayment, icon: "%", title: CHECKOUT.optionInstallment, desc: CHECKOUT.optionInstallmentText },
  ];

  return (
    <section className="co-card" aria-labelledby="co-payment">
      <div className="co-card-head">
        <h2 id="co-payment">
          <span>3</span> {CHECKOUT.paymentMethod}</h2>
        <em className="co-secure">{CHECKOUT.ssl}</em>
      </div>
      <div className="co-pay-list">
        {paymentOptions.map((option) => (
          <label key={option.value} className={`co-pay ${paymentMethod === option.value ? "is-selected" : ""}`}>
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === option.value}
              onChange={() => setPaymentMethod(option.value)}
            />
            <i className={option.iconClass}>{option.icon}</i>
            <span>
              <strong>
                {option.title}
                {option.tag && <em>{option.tag}</em>}
              </strong>
              <small>{option.desc}</small>
            </span>
          </label>
        ))}
      </div>
      {(paymentMethod === bankPayment || paymentMethod === momoPayment) && (
        <p className="co-hint">{CHECKOUT.qrAfterOrder}</p>
      )}
    </section>
  );
}

"use client";

import { CHECKOUT } from "@/src/constants/portal/checkout";
import Image from "next/image";
import { formatOrderMoney } from "@/src/lib/order-pricing";
import Link from "next/link";
import { useState } from "react";
import { paymentOptionLabel, type Branch } from "../checkout-model";
import type { CartLine } from "@/src/hooks/cart";

type CheckoutSuccessProps = {
  isStoreVisit: boolean;
  orderCode: string;
  paymentMethod: string;
  momoPayment: string;
  countdown: number;
  bankPayment: string;
  bank: { code: string; name: string; accountNumber: string; accountName: string; };
  submittedTotal: number;
  selectedBranch: Branch;
  submittedItems: CartLine[];
  expiresAt: number;
};

export default function CheckoutSuccess({ isStoreVisit, orderCode, paymentMethod, momoPayment, countdown, bankPayment, bank, submittedTotal, selectedBranch, submittedItems, expiresAt }: CheckoutSuccessProps) {
  const [copiedSTK, setCopiedSTK] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  const copyToClipboard = (text: string, type: "stk" | "amount" | "content") => {
    navigator.clipboard.writeText(text);
    if (type === "stk") {
      setCopiedSTK(true);
      setTimeout(() => setCopiedSTK(false), 2000);
    } else if (type === "amount") {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };
  const generatedQRUrl =
  paymentMethod === momoPayment
    ? `/api/momo-qr?orderCode=${encodeURIComponent(orderCode || "ORDER")}&expiresAt=${expiresAt}`
    : `/api/payment-qr?orderCode=${encodeURIComponent(orderCode || "ORDER")}&expiresAt=${expiresAt}`;
  const showQr = !isStoreVisit && (paymentMethod === bankPayment || paymentMethod === momoPayment);
  const doneSteps = isStoreVisit
  ? [CHECKOUT.stepReceived, CHECKOUT.stepCall, CHECKOUT.stepHold, CHECKOUT.stepVisit]
  : [CHECKOUT.stepReceived, showQr ? CHECKOUT.stepPaymentConfirmed : CHECKOUT.stepCall, CHECKOUT.stepPacking, CHECKOUT.stepDelivered];
  const paymentLabel = paymentOptionLabel(paymentMethod);
  const submittedCount = submittedItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="co-page co-done">
      <section className="co-card co-done-hero" aria-labelledby="receipt-title">
        <div className="co-done-check" aria-hidden="true">✓</div>
        <span className="co-done-kicker">{isStoreVisit ? CHECKOUT.visitBookedEyebrow : CHECKOUT.orderPlacedEyebrow}</span>
        <h1 id="receipt-title">{isStoreVisit ? CHECKOUT.visitBookedTitle : CHECKOUT.orderPlacedTitle}</h1>
        <p>
          {isStoreVisit
            ? CHECKOUT.visitBookedText
            : showQr
            ? CHECKOUT.scanQrText
            : CHECKOUT.callbackText}
        </p>

        <div className="co-done-code">
          <span>{CHECKOUT.orderCode}</span>
          <strong>{orderCode}</strong>
          <button type="button" onClick={() => copyToClipboard(orderCode, "content")}>
            {copiedContent ? CHECKOUT.copied : CHECKOUT.copy}
          </button>
        </div>

        <ol className="co-done-steps" aria-label={CHECKOUT.progress}>
          {doneSteps.map((step, index) => (
            <li key={step} className={index === 0 ? "is-done" : ""}>
              <b>{index === 0 ? "✓" : index + 1}</b>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="co-done-grid">
        {showQr ? (
          <section className="co-card co-done-pay" aria-labelledby="co-done-pay">
            <div className="co-card-head">
              <h2 id="co-done-pay">{paymentMethod === momoPayment ? CHECKOUT.scanMomo : CHECKOUT.scanVietQr}</h2>
              <em className={`co-timer ${countdown === 0 ? "is-expired" : ""}`}>
                {countdown === 0 ? CHECKOUT.holdExpired : CHECKOUT.timeLeft(formatTime(countdown))}
              </em>
            </div>
            <div className="co-done-qr">
              <Image src={generatedQRUrl} alt={CHECKOUT.qrAlt(orderCode)} width={220} height={220} unoptimized />
            </div>
            <dl className="co-copy-list">
              {paymentMethod === bankPayment && (
                <div>
                  <dt>{CHECKOUT.accountNumber}</dt>
                  <dd>{bank.accountNumber} · {bank.name}</dd>
                  <button type="button" onClick={() => copyToClipboard(bank.accountNumber, "stk")}>
                    {copiedSTK ? CHECKOUT.copied : CHECKOUT.copyShort}
                  </button>
                </div>
              )}
              <div>
                <dt>{CHECKOUT.amount}</dt>
                <dd>{formatOrderMoney(submittedTotal)}</dd>
                <button type="button" onClick={() => copyToClipboard(String(submittedTotal), "amount")}>
                  {copiedAmount ? CHECKOUT.copied : CHECKOUT.copyShort}
                </button>
              </div>
              <div>
                <dt>{CHECKOUT.transferNote}</dt>
                <dd>{orderCode}</dd>
                <button type="button" onClick={() => copyToClipboard(orderCode, "content")}>
                  {copiedContent ? CHECKOUT.copied : CHECKOUT.copyShort}
                </button>
              </div>
            </dl>
            <p className="co-hint">{CHECKOUT.transferNoteHint}</p>
          </section>
        ) : isStoreVisit && selectedBranch ? (
          <section className="co-card co-done-branch" aria-labelledby="co-done-branch">
            <h2 id="co-done-branch">{CHECKOUT.branch}</h2>
            <strong>{selectedBranch.name}</strong>
            <dl className="co-copy-list">
              <div>
                <dt>{CHECKOUT.address}</dt>
                <dd>{selectedBranch.address}</dd>
              </div>
              {selectedBranch.hours && (
                <div>
                  <dt>{CHECKOUT.hours}</dt>
                  <dd>{selectedBranch.hours}</dd>
                </div>
              )}
              <div>
                <dt>Hotline</dt>
                <dd>
                  <a href={`tel:${selectedBranch.phone.replace(/\s/g, "")}`}>{selectedBranch.phone}</a>
                </dd>
              </div>
            </dl>
            <a
              className="co-done-map"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBranch.address)}`}
              target="_blank"
              rel="noreferrer"
            >
              {CHECKOUT.directions}</a>
          </section>
        ) : (
          <section className="co-card co-done-branch" aria-labelledby="co-done-next">
            <h2 id="co-done-next">{CHECKOUT.nextStep}</h2>
            <p className="co-hint co-hint-plain">
              {CHECKOUT.nextStepPrefix}{paymentLabel.toLowerCase()} {CHECKOUT.nextStepSuffix}</p>
          </section>
        )}

        <aside className="co-card co-done-summary" aria-labelledby="co-done-summary">
          <h2 id="co-done-summary">{CHECKOUT.summary}</h2>
          <div className="quick-payment-mini-items">
            {submittedItems.map((item) => (
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
          <dl className="co-copy-list">
            <div>
              <dt>{CHECKOUT.quantity}</dt>
              <dd>{submittedCount} {CHECKOUT.products}</dd>
            </div>
            <div>
              <dt>{isStoreVisit ? CHECKOUT.method : CHECKOUT.payment}</dt>
              <dd>{isStoreVisit ? CHECKOUT.storeVisit : paymentLabel}</dd>
            </div>
            <div className="is-total">
              <dt>{isStoreVisit ? CHECKOUT.estimatedTotal : CHECKOUT.total}</dt>
              <dd>{formatOrderMoney(submittedTotal)}</dd>
            </div>
          </dl>
          <div className="co-done-actions">
            <Link href="/" className="quick-order-continue">
              {CHECKOUT.continueShopping}<span>→</span>
            </Link>
            <Link href="/member" className="co-done-secondary">
              {CHECKOUT.trackOrder}</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

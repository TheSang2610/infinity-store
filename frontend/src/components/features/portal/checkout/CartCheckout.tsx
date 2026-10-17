"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/src/hooks/cart";
import { useStoreSettings } from "@/src/hooks/store-settings";
import { formatOrderMoney } from "@/src/lib/order-pricing";
import type { Product } from "@/src/lib/products";
import { CHECKOUT_STEP_PARAM } from "@/src/constants/portal/checkout-step";
import { CHECKOUT } from "@/src/constants/portal/checkout";
import { STORE_VISIT, type Branch, type Customer, type VoucherQuote } from "./checkout-model";
import CheckoutSuccess from "./steps/CheckoutSuccess";
import EmptyCart from "./steps/EmptyCart";
import CartReview from "./steps/CartReview";
import FulfillmentSection from "./steps/FulfillmentSection";
import ContactSection from "./steps/ContactSection";
import PaymentSection from "./steps/PaymentSection";
import CheckoutSummary from "./steps/CheckoutSummary";
export default function CartCheckout({
  branches,
  recommendations = [],
  brands = {},
}: {
  branches: Branch[];
  recommendations?: Product[];
  brands?: Record<string, string>;
}) {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { paymentMethods, bank } = useStoreSettings();
  const { bankTransfer: bankPayment, momo: momoPayment, applePay: applePayment, installment: installmentPayment } = paymentMethods;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<"online" | "store">("online");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<VoucherQuote | null>(null);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(bankPayment);

  // Meticulous Add-ons
  const [includeAppleCare, setIncludeAppleCare] = useState(false);
  const [includeVAT, setIncludeVAT] = useState(false);
  const [vatCompany, setVatCompany] = useState("");
  const [vatTaxId, setVatTaxId] = useState("");
  const [vatAddress, setVatAddress] = useState("");

  // Stepper state: 1: Giỏ hàng & Tùy chọn, 2: Nhận hàng, 3: Thanh toán
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  // Submission state
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [submittedTotal, setSubmittedTotal] = useState(0);
  const [submittedItems, setSubmittedItems] = useState<typeof items>([]);

  // Calculate pricing
  const appleCarePrice = includeAppleCare ? 990000 : 0;
  const activeVoucher = purchaseMode === "online" && voucher?.subtotal === subtotal ? voucher : null;
  const total = Math.max(0, subtotal + appleCarePrice - (activeVoucher?.discount ?? 0));
  const selectedBranch = branches.find((branch) => branch.id === branchId) ?? branches[0];

  useEffect(() => {
    void fetch("/api/account/me")
      .then((res) => res.json())
      .then((data) => setCustomer(data.customer))
      .catch(() => undefined);
  }, []);

  // "Mua ngay" chuyển tới /gio-hang?buoc=thanh-toan: khi giỏ đã có hàng thì mở thẳng bước thanh toán (một lần).
  const openedFromBuyNow = useRef(false);
  useEffect(() => {
    if (openedFromBuyNow.current || !items.length) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get(CHECKOUT_STEP_PARAM) !== "thanh-toan") return;
    const task = window.setTimeout(() => {
      openedFromBuyNow.current = true;
      params.delete(CHECKOUT_STEP_PARAM);
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
      setActiveStep(2);
      window.scrollTo({ top: 0 });
    }, 0);
    return () => window.clearTimeout(task);
  }, [items.length]);

  // Countdown timer for QR payment
  useEffect(() => {
    if (activeStep !== 3 && status !== "success") return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeStep, status]);

  async function applyVoucher() {
    setVoucherMessage("");
    try {
      const response = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherInput, subtotal }),
      });
      const result = (await response.json()) as { code?: string; discount?: number; message?: string };
      if (!response.ok) throw new Error(result.message || CHECKOUT.invalidVoucher);
      setVoucher({ code: result.code || "", discount: Number(result.discount) || 0, subtotal });
      setVoucherInput(result.code || voucherInput.toUpperCase());
      setVoucherMessage(CHECKOUT.voucherApplied(formatOrderMoney(Number(result.discount) || 0)));
    } catch (error) {
      setVoucher(null);
      setVoucherMessage(error instanceof Error ? error.message : CHECKOUT.invalidVoucher);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    if (purchaseMode === "store" && !selectedBranch) {
      setStatus("error");
      setMessage(CHECKOUT.chooseBranchError);
      return;
    }
    if (purchaseMode === "online" && !paymentMethod) {
      setStatus("error");
      setMessage(CHECKOUT.choosePaymentError);
      return;
    }

    setStatus("sending");
    setMessage("");
    const data = new FormData(event.currentTarget);

    let finalNote = String(data.get("note") || "");
    if (includeAppleCare) {
      finalNote += CHECKOUT.appleCareNote;
    }
    if (includeVAT && vatTaxId) {
      finalNote += ` [VAT: ${vatCompany} - MST: ${vatTaxId} - Đ/C: ${vatAddress}]`;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: data.get("name"),
          phone: data.get("phone"),
          email: data.get("email"),
          deliveryMethod: purchaseMode === "store" ? STORE_VISIT : CHECKOUT.deliveryHome,
          branchId: purchaseMode === "store" ? branchId : "",
          address: purchaseMode === "online" ? data.get("address") : "",
          paymentMethod: purchaseMode === "online" ? paymentMethod : "",
          note: finalNote,
          voucherCode: activeVoucher?.code || "",
          items: items.map(({ productSlug, ram, storage, color, quantity }) => ({
            productSlug,
            ram,
            storage,
            color,
            quantity,
          })),
        }),
      });

      const result = (await response.json()) as { ok?: boolean; orderCode?: string; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || CHECKOUT.orderFailed);

      setOrderCode(result.orderCode || "");
      setExpiresAt(Date.now() + 10 * 60 * 1000);
      setSubmittedTotal(total);
      setSubmittedItems(items);
      setStatus("success");
      clearCart();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : CHECKOUT.orderFailed);
    }
  }

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const isStoreVisit = purchaseMode === "store";

  // =========================================================================
  // SUCCESS SCREEN
  // =========================================================================
  if (status === "success") {

    return (
      <CheckoutSuccess isStoreVisit={isStoreVisit} orderCode={orderCode} paymentMethod={paymentMethod} momoPayment={momoPayment} countdown={countdown} bankPayment={bankPayment} bank={bank} submittedTotal={submittedTotal} selectedBranch={selectedBranch} submittedItems={submittedItems} expiresAt={expiresAt} />
    );
  }

  // =========================================================================
  // EMPTY CART (Infinity Store STYLE)
  // =========================================================================
  if (!items.length) {
    return (
      <EmptyCart recommendations={recommendations} />
    );
  }

  // =========================================================================
  // STEP 1: REVIEW PRODUCTS & PRICES
  // =========================================================================
  if (activeStep === 1) {
    return (
      <CartReview itemCount={itemCount} items={items} brands={brands} removeItem={removeItem} updateQuantity={updateQuantity} subtotal={subtotal} includeAppleCare={includeAppleCare} appleCarePrice={appleCarePrice} activeVoucher={activeVoucher} isStoreVisit={isStoreVisit} voucherInput={voucherInput} setVoucherInput={setVoucherInput} applyVoucher={applyVoucher} voucherMessage={voucherMessage} total={total} setActiveStep={setActiveStep} />
    );
  }

  return (
    <div className="co-page">
      <header className="quick-order-heading co-heading">
        <span>{CHECKOUT.checkoutEyebrow}</span>
        <h1>{CHECKOUT.checkoutTitle}</h1>
        <p>{CHECKOUT.checkoutText}</p>
      </header>

      <ol className="co-progress" aria-label={CHECKOUT.stepsLabel}>
        <li className="is-done">
          <button type="button" onClick={() => setActiveStep(1)}>
            <b>✓</b> {CHECKOUT.stepCart}</button>
        </li>
        <li className="is-current" aria-current="step">
          <b>2</b> {CHECKOUT.stepDetails}</li>
        <li>
          <b>3</b> {CHECKOUT.stepDone}</li>
      </ol>

      <form onSubmit={submit} className="quick-order-layout co-layout">
        <div className="co-main">
          {/* 1. Receive method */}
          <FulfillmentSection purchaseMode={purchaseMode} isStoreVisit={isStoreVisit} setPurchaseMode={setPurchaseMode} setMessage={setMessage} setPaymentMethod={setPaymentMethod} setVoucher={setVoucher} setVoucherMessage={setVoucherMessage} bankPayment={bankPayment} />

          {/* 2. Contact */}
          <ContactSection customer={customer} isStoreVisit={isStoreVisit} branchId={branchId} setBranchId={setBranchId} branches={branches} selectedBranch={selectedBranch} includeAppleCare={includeAppleCare} setIncludeAppleCare={setIncludeAppleCare} includeVAT={includeVAT} setIncludeVAT={setIncludeVAT} vatCompany={vatCompany} setVatCompany={setVatCompany} vatTaxId={vatTaxId} setVatTaxId={setVatTaxId} vatAddress={vatAddress} setVatAddress={setVatAddress} />

          {/* 3. Payment */}
          {!isStoreVisit ? (
            <PaymentSection paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} bankPayment={bankPayment} momoPayment={momoPayment} applePayment={applePayment} installmentPayment={installmentPayment} />
          ) : (
            <p className="co-hint co-hint-card">
              {CHECKOUT.noPaymentNeeded}</p>
          )}
        </div>

        {/* Summary */}
        <CheckoutSummary setActiveStep={setActiveStep} items={items} isStoreVisit={isStoreVisit} voucherInput={voucherInput} setVoucherInput={setVoucherInput} applyVoucher={applyVoucher} voucherMessage={voucherMessage} activeVoucher={activeVoucher} itemCount={itemCount} subtotal={subtotal} includeAppleCare={includeAppleCare} appleCarePrice={appleCarePrice} total={total} message={message} status={status} />
      </form>
    </div>
  );
}

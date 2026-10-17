"use client";

import { useMemo, useState } from "react";
import {
  calculateCreditCardPlan, calculateInstallmentPlan, CREDIT_CARD_BANKS, FINANCE_COMPANIES,
} from "@/src/lib/installment";
import { normalizeBrand, type EnrichedSimulatorProductItem, type InstallmentSimulatorProps } from "./installment-model";
import InstallmentHero from "./InstallmentHero";
import DevicePickerPanel from "./DevicePickerPanel";
import FinancePlanPanel from "./FinancePlanPanel";
import EstimateCard from "./EstimateCard";
import ConsultRequestForm from "./ConsultRequestForm";
import InstallmentInfo from "./InstallmentInfo";
import ScheduleModal from "./ScheduleModal";

export default function InstallmentSimulator({
  products,
  branches,
  initialSlug,
  initialAmount,
  initialCategory,
}: InstallmentSimulatorProps) {
  // Normalize brand on all products
  const enrichedProducts = useMemo(() => {
    return products.map((p) => ({
      ...p,
      normalizedBrand: normalizeBrand(p.brand),
    }));
  }, [products]);

  // 1. Product & Search State
  const defaultProduct = useMemo(() => {
    if (initialSlug) {
      const found = enrichedProducts.find((p) => p.slug === initialSlug);
      if (found) return found;
    }
    const flagship =
      enrichedProducts.find((p) => p.slug === "iphone-16-pro-max") ||
      enrichedProducts.find((p) => p.slug === "iphone-16-pro") ||
      enrichedProducts.find((p) => p.normalizedBrand === "Apple" && p.price >= 20_000_000) ||
      enrichedProducts.find((p) => p.price >= 20_000_000) ||
      enrichedProducts[0] ||
      null;
    return flagship;
  }, [enrichedProducts, initialSlug]);
  const [selectedProduct, setSelectedProduct] = useState<EnrichedSimulatorProductItem | null>(defaultProduct);
  const [amount, setAmount] = useState<number>(initialAmount || defaultProduct?.price || 24_990_000);

  // 2. Financing Parameters
  const [mode, setMode] = useState<"finance_company" | "credit_card">("finance_company");
  const [companyId, setCompanyId] = useState<string>(FINANCE_COMPANIES[0].id);
  const [bankId, setBankId] = useState<string>(CREDIT_CARD_BANKS[0].id);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [term, setTerm] = useState<number>(12);

  // 3. UI State
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  // Active Financial Partner
  const activeCompany = useMemo(
    () => FINANCE_COMPANIES.find((c) => c.id === companyId) || FINANCE_COMPANIES[0],
    [companyId],
  );
  const activeBank = useMemo(
    () => CREDIT_CARD_BANKS.find((b) => b.id === bankId) || CREDIT_CARD_BANKS[0],
    [bankId],
  );

  // Current Calculation Plan
  const currentPlan = useMemo(() => {
    if (mode === "finance_company") {
      return calculateInstallmentPlan(amount, downPaymentPercent, term, activeCompany.monthlyRate);
    } else {
      const feeRate = activeBank.conversionFeeRate[term] ?? 2.5;
      return calculateCreditCardPlan(amount, downPaymentPercent, term, feeRate);
    }
  }, [mode, amount, downPaymentPercent, term, activeCompany.monthlyRate, activeBank]);

  return (
    <div className="installment-simulator-root">
      {/* 1. HERO SECTION */}
      <InstallmentHero />

      {/* 2. MAIN WORKSPACE */}
      <div className="installment-workspace">
        {/* LEFT COLUMN: PRODUCT SELECTION & CONTROLS */}
        <div className="installment-left-column">
          {/* STEP 1: CASCADING BRAND - MODEL SELECTOR */}
          <DevicePickerPanel setSelectedProduct={setSelectedProduct} selectedProduct={selectedProduct} amount={amount} setAmount={setAmount} enrichedProducts={enrichedProducts} initialCategory={initialCategory} defaultProduct={defaultProduct} initialAmount={initialAmount} />

          {/* STEP 2: FINANCING METHOD & PARAMETERS */}
          <FinancePlanPanel mode={mode} setMode={setMode} downPaymentPercent={downPaymentPercent} setDownPaymentPercent={setDownPaymentPercent} companyId={companyId} setCompanyId={setCompanyId} bankId={bankId} setBankId={setBankId} currentPlan={currentPlan} term={term} setTerm={setTerm} activeBank={activeBank} amount={amount} activeCompany={activeCompany} />
        </div>

        {/* RIGHT COLUMN: REAL-TIME FINANCIAL SUMMARY & ACTION */}
        <aside className="installment-right-column">
          {/* Main Financial Result Card */}
          <EstimateCard mode={mode} activeCompany={activeCompany} currentPlan={currentPlan} selectedProduct={selectedProduct} amount={amount} downPaymentPercent={downPaymentPercent} setShowScheduleModal={setShowScheduleModal} />

          {/* Consultation Lead Capture Form */}
          <ConsultRequestForm branches={branches} />
        </aside>
      </div>

      {/* 3. HOW IT WORKS & FAQS */}
      <InstallmentInfo />

      {/* 4. AMORTIZATION SCHEDULE MODAL */}
      {showScheduleModal && (
        <ScheduleModal setShowScheduleModal={setShowScheduleModal} currentPlan={currentPlan} selectedProduct={selectedProduct} />
      )}
    </div>
  );
}

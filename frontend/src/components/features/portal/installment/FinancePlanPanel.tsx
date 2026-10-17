"use client";

import { INSTALLMENT } from "@/src/constants/portal/installment-page";
import {
  CREDIT_CARD_BANKS, CreditCardBank, DOWN_PAYMENT_OPTIONS, FINANCE_COMPANIES, FinanceCompany, INSTALLMENT_TERMS,
  InstallmentCalculationResult, calculateCreditCardPlan, calculateInstallmentPlan,
} from "@/src/lib/installment";
import Image from "next/image";
import { formatOrderMoney } from "@/src/lib/order-pricing";
import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

type FinancePlanPanelProps = {
  mode: "finance_company" | "credit_card";
  setMode: Dispatch<SetStateAction<"finance_company" | "credit_card">>;
  downPaymentPercent: number;
  setDownPaymentPercent: Dispatch<SetStateAction<number>>;
  companyId: string;
  setCompanyId: Dispatch<SetStateAction<string>>;
  bankId: string;
  setBankId: Dispatch<SetStateAction<string>>;
  currentPlan: InstallmentCalculationResult;
  term: number;
  setTerm: Dispatch<SetStateAction<number>>;
  activeBank: CreditCardBank;
  amount: number;
  activeCompany: FinanceCompany;
};

export default function FinancePlanPanel({ mode, setMode, downPaymentPercent, setDownPaymentPercent, companyId, setCompanyId, bankId, setBankId, currentPlan, term, setTerm, activeBank, amount, activeCompany }: FinancePlanPanelProps) {
  const termOptions = useMemo(() => {
    const supported = mode === "finance_company" ? INSTALLMENT_TERMS : activeBank.supportedTerms;
    return supported.map((t) => {
      if (mode === "finance_company") {
        const plan = calculateInstallmentPlan(amount, downPaymentPercent, t, activeCompany.monthlyRate);
        return { term: t, monthly: plan.monthlyPayment, interest: plan.interestAmount };
      } else {
        const fee = activeBank.conversionFeeRate[t] ?? 2.5;
        const plan = calculateCreditCardPlan(amount, downPaymentPercent, t, fee);
        return { term: t, monthly: plan.monthlyPayment, interest: plan.interestAmount };
      }
    });
  }, [mode, amount, downPaymentPercent, activeCompany.monthlyRate, activeBank]);

  return (
    <section className="installment-panel" aria-labelledby="step2-title">
      <div className="installment-panel-head">
        <div>
          <h2 id="step2-title">
            <span className="installment-step-num">2</span>
            {INSTALLMENT.methodTitle}</h2>
          <div className="installment-panel-subtitle">
            {INSTALLMENT.methodText}</div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="installment-mode-tabs">
        <div
          className={`installment-mode-btn ${mode === "finance_company" ? "active" : ""}`}
          onClick={() => setMode("finance_company")}
          role="button"
          tabIndex={0}
        >
          <div className="installment-mode-top">
            <span className="installment-mode-title">{INSTALLMENT.financeCompany}</span>
            <span className="installment-mode-badge">{INSTALLMENT.financeBadge}</span>
          </div>
          <p className="installment-mode-desc">
            {INSTALLMENT.financeText}</p>
        </div>

        <div
          className={`installment-mode-btn ${mode === "credit_card" ? "active" : ""}`}
          onClick={() => {
            setMode("credit_card");
            if (downPaymentPercent < 0) setDownPaymentPercent(0);
          }}
          role="button"
          tabIndex={0}
        >
          <div className="installment-mode-top">
            <span className="installment-mode-title">{INSTALLMENT.creditCard}</span>
            <span
              className="installment-mode-badge"
              style={{
                color: "var(--lux-blue)",
                borderColor: "rgba(41,151,255,0.4)",
                background: "rgba(41,151,255,0.15)",
              }}
            >
              {INSTALLMENT.creditCardBadge}</span>
          </div>
          <p className="installment-mode-desc">
            {INSTALLMENT.creditCardText}</p>
        </div>
      </div>

      {/* Partner Selector */}
      <div className="installment-param-group">
        <label className="installment-param-label">
          {mode === "finance_company" ? INSTALLMENT.partner : INSTALLMENT.issuingBank}
        </label>

        {mode === "finance_company" ? (
          <div className="installment-partner-grid" style={{ marginTop: "10px" }}>
            {FINANCE_COMPANIES.map((company) => (
              <div
                key={company.id}
                className={`installment-partner-card ${companyId === company.id ? "active" : ""}`}
                onClick={() => setCompanyId(company.id)}
              >
                <div className="installment-partner-logo-box">
                  <Image src={company.logo} alt={company.name} width={40} height={24} unoptimized />
                </div>
                <div>
                  <div className="installment-partner-name">{company.name}</div>
                  <div className="installment-partner-rate">{INSTALLMENT.rateApprox}{company.monthlyRate}%/th</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="installment-partner-grid" style={{ marginTop: "10px" }}>
            {CREDIT_CARD_BANKS.map((bank) => (
              <div
                key={bank.id}
                className={`installment-partner-card ${bankId === bank.id ? "active" : ""}`}
                onClick={() => setBankId(bank.id)}
              >
                <div
                  className="installment-partner-logo-box"
                  style={{ backgroundColor: bank.color, color: "#fff", fontWeight: 800, fontSize: "11px" }}
                >
                  {bank.shortName}
                </div>
                <div>
                  <div className="installment-partner-name">{bank.name}</div>
                  <div className="installment-partner-rate">{INSTALLMENT.zeroRate}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Down Payment Slider & Quick Buttons */}
      <div className="installment-param-group">
        <div className="installment-param-header">
          <span className="installment-param-label">{INSTALLMENT.downPayment}</span>
          <span className="installment-param-value-tag">
            {downPaymentPercent}% ({formatOrderMoney(currentPlan.downPaymentAmount)})
          </span>
        </div>

        <input
          type="range"
          min={mode === "finance_company" ? 10 : 0}
          max={70}
          step={5}
          value={downPaymentPercent}
          onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
          className="installment-range-slider"
        />

        <div className="installment-quick-chips">
          {(mode === "credit_card" ? [0, ...DOWN_PAYMENT_OPTIONS] : [...DOWN_PAYMENT_OPTIONS]).map((percent) => (
            <button
              key={percent}
              type="button"
              className={`installment-chip-btn ${downPaymentPercent === percent ? "active" : ""}`}
              onClick={() => setDownPaymentPercent(percent)}
            >
              {percent === 0 ? INSTALLMENT.zeroDown : `${percent}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Term Length Selector */}
      <div className="installment-param-group">
        <div className="installment-param-header">
          <span className="installment-param-label">{INSTALLMENT.term}</span>
          <span
            className="installment-param-value-tag"
            style={{
              color: "var(--lux-green)",
              background: "rgba(48,209,88,0.12)",
              borderColor: "rgba(48,209,88,0.3)",
            }}
          >
            {term} {INSTALLMENT.monthsTitle}</span>
        </div>

        <div className="installment-term-cards">
          {termOptions.map((item) => (
            <div
              key={item.term}
              className={`installment-term-card ${term === item.term ? "active" : ""}`}
              onClick={() => setTerm(item.term)}
            >
              <span className="installment-term-months">{item.term} {INSTALLMENT.monthsTitle}</span>
              <span className="installment-term-price">{formatOrderMoney(item.monthly)}/th</span>
              <span className="installment-term-badge">
                {item.interest === 0 ? INSTALLMENT.zeroOffer : INSTALLMENT.interestAmount(formatOrderMoney(item.interest))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

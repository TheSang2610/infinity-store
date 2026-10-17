"use client";

import { INSTALLMENT } from "@/src/constants/portal/installment-page";
import { formatOrderMoney } from "@/src/lib/order-pricing";
import type { Dispatch, SetStateAction } from "react";
import type { EnrichedSimulatorProductItem } from "./installment-model";
import { FinanceCompany, InstallmentCalculationResult } from "@/src/lib/installment";

type EstimateCardProps = {
  mode: "finance_company" | "credit_card";
  activeCompany: FinanceCompany;
  currentPlan: InstallmentCalculationResult;
  selectedProduct: EnrichedSimulatorProductItem | null;
  amount: number;
  downPaymentPercent: number;
  setShowScheduleModal: Dispatch<SetStateAction<boolean>>;
};

export default function EstimateCard({ mode, activeCompany, currentPlan, selectedProduct, amount, downPaymentPercent, setShowScheduleModal }: EstimateCardProps) {
  return (
    <div className="installment-result-card">
      <div className="installment-result-eyebrow">
        <span className="installment-result-tag">{INSTALLMENT.estimate}</span>
        <span className="installment-result-pill">
          {mode === "credit_card" ? INSTALLMENT.zeroRateBadge : INSTALLMENT.companyBadge(activeCompany.name)}
        </span>
      </div>

      <div className="installment-main-payment">
        <span className="installment-monthly-number">
          {formatOrderMoney(currentPlan.monthlyPayment)}
        </span>
        <span className="installment-monthly-unit">{INSTALLMENT.perMonth}</span>
      </div>

      <div className="installment-daily-quote">
        {INSTALLMENT.aboutPrefix}<strong>{formatOrderMoney(currentPlan.dailyPayment)} {INSTALLMENT.perDay}</strong> {INSTALLMENT.toOwn}</div>

      {/* Breakdown Table */}
      <table className="installment-breakdown-table">
        <tbody>
          <tr>
            <td>{INSTALLMENT.device}</td>
            <td style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedProduct?.name || INSTALLMENT.custom}
            </td>
          </tr>
          <tr>
            <td>{INSTALLMENT.productValue}</td>
            <td>{formatOrderMoney(amount)}</td>
          </tr>
          <tr>
            <td>{INSTALLMENT.downOpen}{downPaymentPercent}%)</td>
            <td>{formatOrderMoney(currentPlan.downPaymentAmount)}</td>
          </tr>
          <tr>
            <td>{INSTALLMENT.loanAmount}</td>
            <td>{formatOrderMoney(currentPlan.financedAmount)}</td>
          </tr>
          <tr>
            <td>{INSTALLMENT.monthlyPrincipal}</td>
            <td>{formatOrderMoney(currentPlan.monthlyPrincipal)}</td>
          </tr>
          <tr>
            <td>{mode === "credit_card" ? INSTALLMENT.conversionFee : INSTALLMENT.monthlyInterest}</td>
            <td>
              {mode === "credit_card"
                ? formatOrderMoney(currentPlan.interestAmount)
                : formatOrderMoney(currentPlan.monthlyInterest)}
            </td>
          </tr>
          <tr className="highlight">
            <td>{INSTALLMENT.difference}</td>
            <td>+{formatOrderMoney(currentPlan.differenceAmount)}</td>
          </tr>
          <tr className="total-row">
            <td>{INSTALLMENT.totalCost}</td>
            <td>{formatOrderMoney(currentPlan.totalPayment)}</td>
          </tr>
        </tbody>
      </table>

      {/* Action Buttons */}
      <div className="installment-action-buttons">
        <a href="#consult-form" className="installment-btn-primary">
          {INSTALLMENT.applyNow}</a>

        <button
          type="button"
          className="installment-btn-secondary"
          onClick={() => setShowScheduleModal(true)}
        >
          {INSTALLMENT.viewSchedule}</button>
      </div>
    </div>
  );
}

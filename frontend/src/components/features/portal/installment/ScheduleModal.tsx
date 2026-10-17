"use client";

import { INSTALLMENT } from "@/src/constants/portal/installment-page";
import { formatOrderMoney } from "@/src/lib/order-pricing";
import { useMemo } from "react";
import { generateAmortizationSchedule, InstallmentCalculationResult } from "@/src/lib/installment";
import type { Dispatch, SetStateAction } from "react";
import type { EnrichedSimulatorProductItem } from "./installment-model";

type ScheduleModalProps = {
  setShowScheduleModal: Dispatch<SetStateAction<boolean>>;
  currentPlan: InstallmentCalculationResult;
  selectedProduct: EnrichedSimulatorProductItem | null;
};

export default function ScheduleModal({ setShowScheduleModal, currentPlan, selectedProduct }: ScheduleModalProps) {
  const amortizationSchedule = useMemo(() => {
    return generateAmortizationSchedule(
      currentPlan.financedAmount,
      currentPlan.term,
      currentPlan.monthlyPayment,
      currentPlan.interestAmount,
    );
  }, [currentPlan]);

  return (
    <div
      className="installment-schedule-modal"
      role="dialog"
      aria-modal="true"
      onClick={() => setShowScheduleModal(false)}
    >
      <div className="installment-schedule-content" onClick={(e) => e.stopPropagation()}>
        <div className="installment-schedule-header">
          <h3>{INSTALLMENT.scheduleTitleOpen}{currentPlan.term} {INSTALLMENT.monthsClose}</h3>
          <button
            type="button"
            className="installment-schedule-close"
            onClick={() => setShowScheduleModal(false)}
            title={INSTALLMENT.close}
          >
            ✕
          </button>
        </div>

        <div className="installment-schedule-body">
          <p style={{ fontSize: "12.5px", color: "var(--lux-text-secondary)", marginBottom: "16px" }}>
            {INSTALLMENT.devicePrefix}<strong>{selectedProduct?.name || INSTALLMENT.custom}</strong> {INSTALLMENT.loanLabel}{" "}
            <strong>{formatOrderMoney(currentPlan.financedAmount)}</strong> {INSTALLMENT.downLabel}{" "}
            <strong>{formatOrderMoney(currentPlan.downPaymentAmount)}</strong> ({currentPlan.downPaymentPercent}{INSTALLMENT.monthlyLabel}{" "}
            <strong style={{ color: "var(--lux-green)" }}>{formatOrderMoney(currentPlan.monthlyPayment)}</strong>
          </p>

          <table className="installment-schedule-table">
            <thead>
              <tr>
                <th>{INSTALLMENT.period}</th>
                <th>{INSTALLMENT.openingBalance}</th>
                <th>{INSTALLMENT.principal}</th>
                <th>{INSTALLMENT.interestFee}</th>
                <th>{INSTALLMENT.monthlyTotal}</th>
                <th>{INSTALLMENT.remainingBalance}</th>
              </tr>
            </thead>
            <tbody>
              {amortizationSchedule.map((row) => (
                <tr key={row.month}>
                  <td>{INSTALLMENT.monthPrefix}{row.month}</td>
                  <td>{formatOrderMoney(row.beginningBalance)}</td>
                  <td>{formatOrderMoney(row.principalPaid)}</td>
                  <td>{formatOrderMoney(row.interestPaid)}</td>
                  <td style={{ fontWeight: 700, color: "var(--lux-green)" }}>
                    {formatOrderMoney(row.totalMonthly)}
                  </td>
                  <td>{formatOrderMoney(row.endingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "16px", fontSize: "11px", color: "var(--lux-text-muted)" }}>
            {INSTALLMENT.scheduleDisclaimer}</div>
        </div>
      </div>
    </div>
  );
}

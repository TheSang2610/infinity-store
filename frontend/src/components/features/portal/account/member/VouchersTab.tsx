"use client";

import { ACCOUNT_PANEL } from "@/src/constants/portal/account";

type VouchersTabProps = {
  copyCode: (code: string) => void;
  copiedVoucher: string | null;
};

export default function VouchersTab({ copyCode, copiedVoucher }: VouchersTabProps) {
  return (
    <div className="smem-section-card">
      <div className="smem-tab-header">
        <div>
          <h2>{ACCOUNT_PANEL.vouchersTitle}</h2>
          <p>{ACCOUNT_PANEL.vouchersText}</p>
        </div>
      </div>

      <div className="smem-voucher-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {/* Voucher 1 */}
        <div className="smem-voucher-ticket" style={{ padding: "16px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
          <div className="smem-voucher-icon" style={{ width: "48px", height: "48px", fontSize: "22px" }}>📱</div>
          <div className="smem-voucher-content">
            <strong style={{ fontSize: "14px" }}>{ACCOUNT_PANEL.voucherIphoneTitle}</strong>
            <p style={{ fontSize: "13.5px" }}>{ACCOUNT_PANEL.voucherIphoneValue}</p>
            <small>{ACCOUNT_PANEL.voucherIphoneTerms}</small>
          </div>
          <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_IP17_1TR")}>
            {copiedVoucher === "INFINITY_IP17_1TR" ? ACCOUNT_PANEL.copied : ACCOUNT_PANEL.copyCode}
          </button>
        </div>

        {/* Voucher 2 */}
        <div className="smem-voucher-ticket" style={{ padding: "16px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
          <div className="smem-voucher-icon" style={{ width: "48px", height: "48px", fontSize: "22px", background: "#e0f2fe", color: "#0284c7" }}>💻</div>
          <div className="smem-voucher-content">
            <strong style={{ fontSize: "14px" }}>{ACCOUNT_PANEL.voucherLaptopTitle}</strong>
            <p style={{ fontSize: "13.5px" }}>{ACCOUNT_PANEL.voucherLaptopValue}</p>
            <small>{ACCOUNT_PANEL.voucherLaptopTermsLong}</small>
          </div>
          <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_LAPTOP_10")}>
            {copiedVoucher === "INFINITY_LAPTOP_10" ? ACCOUNT_PANEL.copied : ACCOUNT_PANEL.copyCode}
          </button>
        </div>

        {/* Voucher 3 */}
        <div className="smem-voucher-ticket" style={{ padding: "16px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
          <div className="smem-voucher-icon" style={{ width: "48px", height: "48px", fontSize: "22px", background: "#fef3c7", color: "#b45309" }}>🎂</div>
          <div className="smem-voucher-content">
            <strong style={{ fontSize: "14px" }}>{ACCOUNT_PANEL.voucherBirthdayTitle}</strong>
            <p style={{ fontSize: "13.5px" }}>{ACCOUNT_PANEL.voucherBirthdayValue}</p>
            <small>{ACCOUNT_PANEL.voucherBirthdayTerms}</small>
          </div>
          <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_BDAY_500K")}>
            {copiedVoucher === "INFINITY_BDAY_500K" ? ACCOUNT_PANEL.copied : ACCOUNT_PANEL.copyCode}
          </button>
        </div>

        {/* Voucher 4 */}
        <div className="smem-voucher-ticket" style={{ padding: "16px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
          <div className="smem-voucher-icon" style={{ width: "48px", height: "48px", fontSize: "22px", background: "#dcfce7", color: "#15803d" }}>🎁</div>
          <div className="smem-voucher-content">
            <strong style={{ fontSize: "14px" }}>{ACCOUNT_PANEL.voucherWelcomeTitle}</strong>
            <p style={{ fontSize: "13.5px" }}>{ACCOUNT_PANEL.voucherWelcomeValue}</p>
            <small>{ACCOUNT_PANEL.voucherWelcomeTerms}</small>
          </div>
          <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_CHAOMUNG")}>
            {copiedVoucher === "INFINITY_CHAOMUNG" ? ACCOUNT_PANEL.copied : ACCOUNT_PANEL.copyCode}
          </button>
        </div>

        {/* Voucher 5 */}
        <div className="smem-voucher-ticket" style={{ padding: "16px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
          <div className="smem-voucher-icon" style={{ width: "48px", height: "48px", fontSize: "22px", background: "#f3e8ff", color: "#7e22ce" }}>🎧</div>
          <div className="smem-voucher-content">
            <strong style={{ fontSize: "14px" }}>{ACCOUNT_PANEL.voucherAccessoryTitle}</strong>
            <p style={{ fontSize: "13.5px" }}>{ACCOUNT_PANEL.voucherAccessoryValue}</p>
            <small>{ACCOUNT_PANEL.voucherAccessoryTerms}</small>
          </div>
          <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_PK20")}>
            {copiedVoucher === "INFINITY_PK20" ? ACCOUNT_PANEL.copied : ACCOUNT_PANEL.copyCode}
          </button>
        </div>
      </div>
    </div>
  );
}

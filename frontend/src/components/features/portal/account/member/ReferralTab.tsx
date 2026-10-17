"use client";

import { ACCOUNT_PANEL } from "@/src/constants/portal/account";
import { referralLink } from "../account-model";
import { useState } from "react";
import type { Customer } from "../account-model";

type ReferralTabProps = {
  customer: Customer;
};

export default function ReferralTab({ customer }: ReferralTabProps) {
  const [copiedReferral, setCopiedReferral] = useState(false);
  const copyReferral = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  return (
    <div className="smem-section-card">
      <div className="smem-tab-header">
        <div>
          <h2>{ACCOUNT_PANEL.referralTitle}</h2>
          <p>{ACCOUNT_PANEL.referralText}</p>
        </div>
      </div>

      <div className="smem-refer-card">
        <div className="smem-refer-header">
          <span style={{ fontSize: "36px" }}>🎁</span>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>{ACCOUNT_PANEL.referralReward}</h3>
            <p style={{ margin: 0, fontSize: "13.5px", color: "#475569" }}>
              {ACCOUNT_PANEL.referralRewardText}</p>
          </div>
        </div>

        <div className="smem-refer-options" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <div className="smem-refer-option">
            <small style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>{ACCOUNT_PANEL.yourReferralCode}</small>
            <div className="smem-refer-code-box">
              <span className="smem-refer-code">INF-{(customer.username || "MEMBER").toUpperCase()}</span>
              <button
                type="button"
                className="smem-voucher-copy"
                onClick={() => copyReferral(`INF-${(customer.username || "MEMBER").toUpperCase()}`)}
              >
                {copiedReferral ? ACCOUNT_PANEL.copied : ACCOUNT_PANEL.copyCode}
              </button>
            </div>
          </div>

          <div className="smem-refer-option">
            <small style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>{ACCOUNT_PANEL.referralLink}</small>
            <div className="smem-refer-code-box" style={{ background: "#ffffff" }}>
              <span style={{ fontSize: "13px", color: "#0f172a" }}>{referralLink(customer.username)}</span>
              <button
                type="button"
                className="smem-voucher-copy"
                onClick={() => copyReferral(referralLink(customer.username))}
              >
                {copiedReferral ? ACCOUNT_PANEL.copied : "📋 Copy link"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <h4 style={{ fontSize: "15px", margin: "20px 0 14px", color: "#0f172a" }}>{ACCOUNT_PANEL.howItWorks}</h4>
      <div className="smem-refer-steps" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--smem-blue)", marginBottom: "6px" }}>1</div>
          <strong style={{ display: "block", fontSize: "13.5px", marginBottom: "4px" }}>{ACCOUNT_PANEL.stepShareTitle}</strong>
          <small style={{ color: "#64748b", fontSize: "12.5px" }}>{ACCOUNT_PANEL.stepShareText}</small>
        </div>

        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--smem-blue)", marginBottom: "6px" }}>2</div>
          <strong style={{ display: "block", fontSize: "13.5px", marginBottom: "4px" }}>{ACCOUNT_PANEL.stepBuyTitle}</strong>
          <small style={{ color: "#64748b", fontSize: "12.5px" }}>{ACCOUNT_PANEL.stepBuyText}</small>
        </div>

        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--smem-blue)", marginBottom: "6px" }}>3</div>
          <strong style={{ display: "block", fontSize: "13.5px", marginBottom: "4px" }}>{ACCOUNT_PANEL.stepRewardTitle}</strong>
          <small style={{ color: "#64748b", fontSize: "12.5px" }}>{ACCOUNT_PANEL.stepRewardText}</small>
        </div>
      </div>
    </div>
  );
}

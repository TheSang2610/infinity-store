"use client";

import { ACCOUNT_PANEL } from "@/src/constants/portal/account";
import { formatVnd } from "@/src/lib/format";
import type { Customer } from "../account-model";

type TierTabProps = {
  memberTier: "INFINITY DIAMOND" | "INFINITY VIP" | "INFINITY MEMBER";
  totalSpent: number;
  customer: Customer;
  nextTierGoal: { name: string; needed: number; } | null;
};

export default function TierTab({ memberTier, totalSpent, customer, nextTierGoal }: TierTabProps) {
  return (
    <div className="smem-section-card">
      <div className="smem-tab-header">
        <div>
          <h2>{ACCOUNT_PANEL.tierTitle}</h2>
          <p>{ACCOUNT_PANEL.tierText}</p>
        </div>
      </div>

      {/* CURRENT PROGRESS CARD */}
      <div className="smem-tier-progress-card" style={{ background: "linear-gradient(135deg, #0071e3 0%, #034da2 100%)", borderRadius: "14px", padding: "22px 24px", color: "#ffffff", marginBottom: "24px" }}>
        <div className="smem-tier-progress-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span style={{ fontSize: "12px", letterSpacing: "0.08em", opacity: 0.85, textTransform: "uppercase" }}>{ACCOUNT_PANEL.currentTier}</span>
            <h3 style={{ fontSize: "24px", fontWeight: 900, margin: "4px 0" }}>{memberTier}</h3>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>
              {ACCOUNT_PANEL.totalSpentPrefix}<strong>{formatVnd(totalSpent)}</strong>
            </p>
          </div>
          <div className="smem-member-code" style={{ textAlign: "right" }}>
            <span style={{ fontSize: "12px", opacity: 0.85 }}>{ACCOUNT_PANEL.memberCode}</span>
            <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "0.05em" }}>{customer.username.toUpperCase()}</div>
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <div className="smem-tier-progress-label" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", opacity: 0.9 }}>
            <span>{ACCOUNT_PANEL.tierProgress}</span>
            <span>
              {nextTierGoal ? ACCOUNT_PANEL.tierGoal(formatVnd(nextTierGoal.needed), nextTierGoal.name) : ACCOUNT_PANEL.highestTier}
            </span>
          </div>
          <div style={{ height: "8px", background: "rgba(255,255,255,0.25)", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: "#fde047",
                width: `${Math.min(100, (totalSpent / (memberTier === "INFINITY MEMBER" ? 20000000 : 50000000)) * 100)}%`,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* 3 TIERS COMPARISON GRID */}
      <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 14px", color: "#0f172a" }}>{ACCOUNT_PANEL.tierDetails}</h3>
      <div className="smem-tiers-grid">
        {/* TIER 1: MEMBER */}
        <div className={`smem-tier-card ${memberTier === "INFINITY MEMBER" ? "is-current" : ""}`}>
          {memberTier === "INFINITY MEMBER" && <span className="smem-tier-card-badge">{ACCOUNT_PANEL.current}</span>}
          <h3>INFINITY MEMBER</h3>
          <div className="smem-tier-threshold">{ACCOUNT_PANEL.tierMemberFrom}</div>
          <ul className="smem-tier-perks">
            <li><span>🎁</span> <span>{ACCOUNT_PANEL.tierMemberDiscount}</span></li>
            <li><span>🎂</span> <span>{ACCOUNT_PANEL.tierMemberBirthday}</span></li>
            <li><span></span> <span>{ACCOUNT_PANEL.tierMemberShipping}</span></li>
            <li><span>⭐</span> <span>{ACCOUNT_PANEL.tierMemberPoints}</span></li>
            <li><span>🛡️</span> <span>{ACCOUNT_PANEL.tierMemberSupport}</span></li>
          </ul>
        </div>

        {/* TIER 2: VIP */}
        <div className={`smem-tier-card ${memberTier === "INFINITY VIP" ? "is-current" : ""}`}>
          {memberTier === "INFINITY VIP" && <span className="smem-tier-card-badge">{ACCOUNT_PANEL.current}</span>}
          <h3>INFINITY VIP</h3>
          <div className="smem-tier-threshold">{ACCOUNT_PANEL.tierVipFrom}</div>
          <ul className="smem-tier-perks">
            <li><span>🎁</span> <span>{ACCOUNT_PANEL.tierVipDiscount}</span></li>
            <li><span>🎉</span> <span>{ACCOUNT_PANEL.tierVipUpgrade}</span></li>
            <li><span>🎂</span> <span>{ACCOUNT_PANEL.tierVipBirthday}</span></li>
            <li><span>⚡</span> <span>{ACCOUNT_PANEL.tierVipShipping}</span></li>
            <li><span>🛡️</span> <span>{ACCOUNT_PANEL.tierVipWarranty}</span></li>
            <li><span>📦</span> <span>{ACCOUNT_PANEL.tierVipLoaner}</span></li>
          </ul>
        </div>

        {/* TIER 3: DIAMOND */}
        <div className={`smem-tier-card ${memberTier === "INFINITY DIAMOND" ? "is-current" : ""}`}>
          {memberTier === "INFINITY DIAMOND" && <span className="smem-tier-card-badge">{ACCOUNT_PANEL.current}</span>}
          <h3>INFINITY DIAMOND</h3>
          <div className="smem-tier-threshold">{ACCOUNT_PANEL.tierDiamondFrom}</div>
          <ul className="smem-tier-perks">
            <li><span>🎁</span> <span>{ACCOUNT_PANEL.tierDiamondDiscount}</span></li>
            <li><span>🎉</span> <span>{ACCOUNT_PANEL.tierDiamondUpgrade}</span></li>
            <li><span>🎂</span> <span>{ACCOUNT_PANEL.tierDiamondBirthday}</span></li>
            <li><span>👑</span> <span>{ACCOUNT_PANEL.tierDiamondConsultant}</span></li>
            <li><span>✨</span> <span>{ACCOUNT_PANEL.tierDiamondCleaning}</span></li>
            <li><span>✈️</span> <span>{ACCOUNT_PANEL.tierDiamondEvents}</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

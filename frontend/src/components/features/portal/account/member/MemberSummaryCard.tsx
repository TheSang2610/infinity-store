"use client";

import Image from "next/image";
import { ACCOUNT_PANEL } from "@/src/constants/portal/account";
import { formatVnd } from "@/src/lib/format";
import Link from "next/link";
import { useState } from "react";
import type { Customer } from "../account-model";

type MemberSummaryCardProps = {
  avatar: string;
  initials: string;
  customer: Customer;
  memberTier: "INFINITY DIAMOND" | "INFINITY VIP" | "INFINITY MEMBER";
  orderCount: number;
  totalSpent: number;
  nextTierGoal: { name: string; needed: number; } | null;
  storeName: string;
};

export default function MemberSummaryCard({ avatar, initials, customer, memberTier, orderCount, totalSpent, nextTierGoal, storeName }: MemberSummaryCardProps) {
  const [showMaskedPhone, setShowMaskedPhone] = useState(true);
  const rawPhone = customer.phone || "";
  const maskedPhone = showMaskedPhone && rawPhone ? rawPhone.replace(/(\d{3})\d{4}(\d{2,3})/, "$1****$2") : (rawPhone || ACCOUNT_PANEL.notUpdatedShort);

  return (
    <div className="smem-dash-header-card">
      <div className="smem-user-col">
        <div className="smem-dash-avatar">
          {avatar ? <Image src={avatar} alt="" fill style={{ objectFit: "cover" }} unoptimized /> : initials}
        </div>
        <div className="smem-user-info">
          <h3>{customer.name || customer.username || ACCOUNT_PANEL.customer}</h3>
          <div className="smem-phone-row">
            <span className="smem-phone-text">{maskedPhone}</span>
            {rawPhone && (
              <button
                type="button"
                onClick={() => setShowMaskedPhone(!showMaskedPhone)}
                title={showMaskedPhone ? ACCOUNT_PANEL.showPhone : ACCOUNT_PANEL.hidePhone}
                style={{ border: "none", background: "none", cursor: "pointer", padding: "0 2px", color: "#64748b" }}
              >
                {showMaskedPhone ? "👁️" : "🙈"}
              </button>
            )}
            <span className="smem-tier-badge">{memberTier}</span>
          </div>
          <p className="smem-expiry-text">{ACCOUNT_PANEL.nextUpdate}</p>
        </div>
      </div>

      <div className="smem-stat-col">
        <span className="smem-stat-icon">🛒</span>
        <div className="smem-stat-val">
          <strong>{orderCount}</strong>
          <small>{ACCOUNT_PANEL.totalOrders}</small>
        </div>
      </div>

      <div className="smem-stat-col">
        <span className="smem-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>💰</span>
        <div className="smem-spending-val">
          <strong>{formatVnd(totalSpent)}</strong>
          <small>{ACCOUNT_PANEL.totalSpentSince}</small>
          <div className="smem-spending-progress">
            {nextTierGoal ? (
              <>{ACCOUNT_PANEL.spendMorePrefix}{formatVnd(nextTierGoal.needed)} {ACCOUNT_PANEL.toReachTier}<strong>{nextTierGoal.name}</strong></>
            ) : (
              <span>{ACCOUNT_PANEL.highestTierPrefix}<strong>{memberTier}</strong></span>
            )}
          </div>
        </div>
      </div>

      <div className="smem-channel-col">
        <small>{ACCOUNT_PANEL.retailSystem}</small>
        <div className="smem-channel-badge" style={{ background: "transparent", border: "none", padding: 0 }}>
          <Image
            src="/brand/if-techshop-logo.png"
            alt="IF TECHSHOP"
            width={110}
            height={28}
            style={{ objectFit: "contain", height: "26px", width: "auto" }}
            unoptimized
          />
        </div>
        <div style={{ marginTop: "4px" }}>
          <Link href="/" style={{ fontSize: "11px", color: "#0284c7", textDecoration: "none" }}>
            {storeName}
          </Link>
        </div>
      </div>
    </div>
  );
}

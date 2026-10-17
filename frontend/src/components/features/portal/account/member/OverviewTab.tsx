"use client";

import { ACCOUNT_PANEL } from "@/src/constants/portal/account";
import Link from "next/link";
import { formatTimestamp } from "../account-model";
import Image from "next/image";
import { formatVnd } from "@/src/lib/format";
import { FormEvent, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { MemberPurchase } from "../account-model";

type OverviewTabProps = {
  purchases: MemberPurchase[];
  switchTab: (tab: string) => void;
  copyCode: (code: string) => void;
  copiedVoucher: string | null;
  setOrderSearchKeyword: Dispatch<SetStateAction<string>>;
  setOrderStatusFilter: Dispatch<SetStateAction<string>>;
};

export default function OverviewTab({ purchases, switchTab, copyCode, copiedVoucher, setOrderSearchKeyword, setOrderStatusFilter }: OverviewTabProps) {
  const [overviewOrderCode, setOverviewOrderCode] = useState("");
  const handleOrderLookup = (event: FormEvent) => {
    event.preventDefault();
    const orderCode = overviewOrderCode.trim().replace(/^#/, "").toUpperCase();
    setOrderSearchKeyword(orderCode);
    setOrderStatusFilter("all");
    switchTab("orders");
  };

  return (
    <div className="smem-tab-section">
      <div className="smem-sub-grid">
        {/* LEFT: RECENT ORDERS */}
        <div className="smem-panel-card">
          <div className="smem-panel-title">
            <span>{ACCOUNT_PANEL.recentOrders}</span>
            {purchases.length > 0 && (
              <button
                type="button"
                onClick={() => switchTab("orders")}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: "12.5px", color: "#0284c7", fontWeight: 700 }}
              >
                {ACCOUNT_PANEL.viewAllOpen}{purchases.length}) ›
              </button>
            )}
          </div>

          {purchases.length === 0 ? (
            <div className="smem-empty-box" style={{ padding: "32px 16px" }}>
              <div className="smem-empty-icon">📦</div>
              <h3>{ACCOUNT_PANEL.noOrdersTitle}</h3>
              <p>{ACCOUNT_PANEL.noOrdersText}</p>
              <Link href="/" className="smem-cta-btn">
                {ACCOUNT_PANEL.exploreProducts}</Link>
            </div>
          ) : (
            <div className="smem-order-list">
              {purchases.slice(0, 3).map((ord) => {
                const item = ord.items?.[0];
                const isCancelled = ord.status === "cancelled";
                const isCompleted = ord.status === "completed";
                return (
                  <div key={ord.id} className="smem-order-card">
                    <div className="smem-order-header">
                      <div>
                        <span>{ACCOUNT_PANEL.orderPrefix}<strong>{ord.orderCode}</strong></span>
                        <span style={{ margin: "0 6px" }}>•</span>
                        <span>{ACCOUNT_PANEL.orderedOn}{formatTimestamp(ord.createdAt)}</span>
                      </div>
                      <span className={`smem-order-status-badge ${isCancelled ? "status-cancelled" : isCompleted ? "status-completed" : "status-processing"}`}>
                        {isCancelled ? ACCOUNT_PANEL.statusCancelled : isCompleted ? ACCOUNT_PANEL.statusReceived : ACCOUNT_PANEL.statusProcessing}
                      </span>
                    </div>

                    <div className="smem-order-body">
                      <div className="smem-order-thumb">
                        {item?.image ? (
                          <Image src={item.image} alt="" width={44} height={44} unoptimized style={{ objectFit: "contain" }} />
                        ) : (
                          <span>📱</span>
                        )}
                      </div>

                      <div className="smem-order-detail">
                        <h4>{item?.productName || ord.productName}</h4>
                        <div className="smem-order-price">{formatVnd(Number(ord.total))}</div>
                      </div>

                      <div className="smem-order-total">
                        <small style={{ color: "#64748b", display: "block" }}>{ACCOUNT_PANEL.totalPaid}</small>
                        <strong>{formatVnd(Number(ord.total))}</strong>
                        <Link href={`/member/hoa-don/${ord.id}`}>{ACCOUNT_PANEL.viewDetails}</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: USER VOUCHERS */}
        <div className="smem-panel-card">
          <div className="smem-panel-title">
            <span>{ACCOUNT_PANEL.yourOffers}</span>
            <button
              type="button"
              onClick={() => switchTab("vouchers")}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: "12px", color: "var(--smem-red)", fontWeight: 700 }}
            >
              {ACCOUNT_PANEL.viewAllVouchers}</button>
          </div>

          <div className="smem-voucher-list">
            <div className="smem-voucher-ticket">
              <div className="smem-voucher-icon">📱</div>
              <div className="smem-voucher-content">
                <strong>{ACCOUNT_PANEL.voucherIphoneTitle}</strong>
                <p>{ACCOUNT_PANEL.voucherIphoneValue}</p>
                <small>HSD: 31/12/2026</small>
              </div>
              <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_IP17_1TR")}>
                {copiedVoucher === "INFINITY_IP17_1TR" ? ACCOUNT_PANEL.copied : "📋 Copy"}
              </button>
            </div>

            <div className="smem-voucher-ticket">
              <div className="smem-voucher-icon">💻</div>
              <div className="smem-voucher-content">
                <strong>{ACCOUNT_PANEL.voucherLaptopTitle}</strong>
                <p>{ACCOUNT_PANEL.voucherLaptopValue}</p>
                <small>{ACCOUNT_PANEL.voucherLaptopTerms}</small>
              </div>
              <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_LAPTOP_10")}>
                {copiedVoucher === "INFINITY_LAPTOP_10" ? ACCOUNT_PANEL.copied : "📋 Copy"}
              </button>
            </div>

            <div className="smem-voucher-ticket">
              <div className="smem-voucher-icon">🎂</div>
              <div className="smem-voucher-content">
                <strong>{ACCOUNT_PANEL.voucherBirthdayTitle}</strong>
                <p>{ACCOUNT_PANEL.voucherBirthdayValue}</p>
                <small>{ACCOUNT_PANEL.voucherBirthdayMin}</small>
              </div>
              <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_BDAY_500K")}>
                {copiedVoucher === "INFINITY_BDAY_500K" ? ACCOUNT_PANEL.copied : "📋 Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK SERVICES SHORTCUTS */}
      <div className="smem-section-card" style={{ marginTop: "16px" }}>
        <div className="smem-tab-header" style={{ marginBottom: "14px", paddingBottom: "10px" }}>
          <div>
            <h2 style={{ fontSize: "16px" }}>{ACCOUNT_PANEL.perksTitle}</h2>
            <p>{ACCOUNT_PANEL.perksText}</p>
          </div>
        </div>

        <div className="smem-benefit-shortcuts" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          <button
            type="button"
            onClick={() => switchTab("student")}
            style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "14px", borderRadius: "10px", cursor: "pointer", textAlign: "left" }}
          >
            <span style={{ fontSize: "24px" }}>🎓</span>
            <div>
              <strong style={{ display: "block", fontSize: "13.5px", color: "#0f172a" }}>{ACCOUNT_PANEL.studentRegister}</strong>
              <small style={{ color: "#64748b", fontSize: "11.5px" }}>{ACCOUNT_PANEL.studentRegisterText}</small>
            </div>
          </button>

          <button
            type="button"
            onClick={() => switchTab("business")}
            style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "14px", borderRadius: "10px", cursor: "pointer", textAlign: "left" }}
          >
            <span style={{ fontSize: "24px" }}>💼</span>
            <div>
              <strong style={{ display: "block", fontSize: "13.5px", color: "#0f172a" }}>{ACCOUNT_PANEL.businessCustomer}</strong>
              <small style={{ color: "#64748b", fontSize: "11.5px" }}>{ACCOUNT_PANEL.businessCustomerText}</small>
            </div>
          </button>

          <button
            type="button"
            onClick={() => switchTab("warranty")}
            style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "14px", borderRadius: "10px", textDecoration: "none", color: "inherit" }}
          >
            <span style={{ fontSize: "24px" }}>🛡️</span>
            <div>
              <strong style={{ display: "block", fontSize: "13.5px", color: "#0f172a" }}>{ACCOUNT_PANEL.warrantyLookup}</strong>
              <small style={{ color: "#64748b", fontSize: "11.5px" }}>{ACCOUNT_PANEL.warrantyCheckText}</small>
            </div>
          </button>

          <form className="smem-order-lookup-card" onSubmit={handleOrderLookup}>
            <span className="smem-order-lookup-icon" aria-hidden="true">📦</span>
            <div className="smem-order-lookup-content">
              <label htmlFor="member-order-code">{ACCOUNT_PANEL.orderLookup}</label>
              <div className="smem-order-lookup-control">
                <input
                  id="member-order-code"
                  value={overviewOrderCode}
                  onChange={(event) => setOverviewOrderCode(event.target.value)}
                  placeholder="VD: HA12AB34CD56"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={26}
                  required
                  aria-label={ACCOUNT_PANEL.orderLookupPlaceholder}
                />
                <button type="submit">{ACCOUNT_PANEL.lookup}</button>
              </div>
            </div>
          </form>

          <Link
            href="/tra-gop"
            style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "14px", borderRadius: "10px", textDecoration: "none", color: "inherit" }}
          >
            <span style={{ fontSize: "24px" }}>💳</span>
            <div>
              <strong style={{ display: "block", fontSize: "13.5px", color: "#0f172a" }}>{ACCOUNT_PANEL.installment}</strong>
              <small style={{ color: "#64748b", fontSize: "11.5px" }}>{ACCOUNT_PANEL.installmentText}</small>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

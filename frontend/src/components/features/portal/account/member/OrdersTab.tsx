"use client";

import { ACCOUNT_PANEL } from "@/src/constants/portal/account";
import Link from "next/link";
import { formatTimestamp } from "../account-model";
import Image from "next/image";
import { formatVnd } from "@/src/lib/format";
import type { Dispatch, SetStateAction } from "react";
import type { MemberPurchase } from "../account-model";

type OrdersTabProps = {
  orderSearchKeyword: string;
  setOrderSearchKeyword: Dispatch<SetStateAction<string>>;
  purchases: MemberPurchase[];
  orderStatusFilter: string;
  setOrderStatusFilter: Dispatch<SetStateAction<string>>;
  purchasesLoading: boolean;
};

export default function OrdersTab({ orderSearchKeyword, setOrderSearchKeyword, purchases, orderStatusFilter, setOrderStatusFilter, purchasesLoading }: OrdersTabProps) {
  const filteredOrders = purchases.filter((ord) => {
    if (orderStatusFilter !== "all" && ord.status !== orderStatusFilter) {
      if (orderStatusFilter === "processing" && (ord.status === "processing" || ord.status === "confirmed")) return true;
      return false;
    }
    if (orderSearchKeyword.trim()) {
      const q = orderSearchKeyword.trim().toLowerCase();
      const codeMatch = (ord.orderCode || "").toLowerCase().includes(q);
      const prodMatch =
        (ord.productName || "").toLowerCase().includes(q) ||
        (ord.items || []).some((it) => (it.productName || "").toLowerCase().includes(q));
      if (!codeMatch && !prodMatch) return false;
    }
    return true;
  });

  return (
    <div className="smem-section-card">
      <div className="smem-tab-header">
        <div>
          <h2>{ACCOUNT_PANEL.ordersTitle}</h2>
          <p>{ACCOUNT_PANEL.ordersText}</p>
        </div>
        <Link href="/" className="smem-cta-btn" style={{ padding: "8px 16px", fontSize: "12.5px" }}>
          {ACCOUNT_PANEL.buyMore}</Link>
      </div>

      {/* Toolbar: Search + Status tabs */}
      <div className="smem-order-toolbar">
        <div className="smem-order-search">
          <span>🔍</span>
          <input
            placeholder={ACCOUNT_PANEL.ordersSearchPlaceholder}
            value={orderSearchKeyword}
            onChange={(e) => setOrderSearchKeyword(e.target.value)}
          />
          {orderSearchKeyword && (
            <button
              type="button"
              onClick={() => setOrderSearchKeyword("")}
              style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="smem-order-status-tabs">
          {[
            { id: "all", label: ACCOUNT_PANEL.tabWithCount(ACCOUNT_PANEL.tabAll, purchases.length) },
            { id: "pending", label: ACCOUNT_PANEL.tabWithCount(ACCOUNT_PANEL.tabPending, purchases.filter((p) => p.status === "pending").length) },
            { id: "processing", label: ACCOUNT_PANEL.tabWithCount(ACCOUNT_PANEL.tabProcessing, purchases.filter((p) => p.status === "processing" || p.status === "confirmed").length) },
            { id: "shipping", label: ACCOUNT_PANEL.tabWithCount(ACCOUNT_PANEL.tabShipping, purchases.filter((p) => p.status === "shipping").length) },
            { id: "completed", label: ACCOUNT_PANEL.tabWithCount(ACCOUNT_PANEL.tabCompleted, purchases.filter((p) => p.status === "completed").length) },
            { id: "cancelled", label: ACCOUNT_PANEL.tabWithCount(ACCOUNT_PANEL.tabCancelled, purchases.filter((p) => p.status === "cancelled").length) },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              className={`smem-status-tab ${orderStatusFilter === st.id ? "is-active" : ""}`}
              onClick={() => setOrderStatusFilter(st.id)}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      {purchasesLoading ? (
        <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>{ACCOUNT_PANEL.ordersLoading}</div>
      ) : filteredOrders.length > 0 ? (
        <div className="smem-order-list">
          {filteredOrders.map((ord) => {
            const isCancelled = ord.status === "cancelled";
            const isCompleted = ord.status === "completed";
            const isShipping = ord.status === "shipping";
            const items = ord.items && ord.items.length > 0 ? ord.items : [
              {
                productSlug: "",
                productName: ord.productName,
                ram: "",
                storage: "",
                color: "",
                quantity: ord.quantity || 1,
                unitPrice: Number(ord.total),
                image: ""
              }
            ];

            return (
              <div key={ord.id} className="smem-order-card">
                <div className="smem-order-header">
                  <div>
                    <span>{ACCOUNT_PANEL.orderCodePrefix}<strong>{ord.orderCode}</strong></span>
                    <span style={{ margin: "0 6px" }}>•</span>
                    <span>{ACCOUNT_PANEL.orderedOn}{formatTimestamp(ord.createdAt)}</span>
                    {ord.branchName && (
                      <>
                        <span style={{ margin: "0 6px" }}>•</span>
                        <span>{ACCOUNT_PANEL.storePrefix}{ord.branchName}</span>
                      </>
                    )}
                  </div>
                  <span className={`smem-order-status-badge ${isCancelled ? "status-cancelled" : isCompleted ? "status-completed" : isShipping ? "status-shipping" : "status-processing"}`}>
                    {isCancelled ? ACCOUNT_PANEL.statusCancelled : isCompleted ? ACCOUNT_PANEL.statusReceived : isShipping ? ACCOUNT_PANEL.statusShipping : ACCOUNT_PANEL.statusProcessing}
                  </span>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="smem-order-body" style={{ borderBottom: idx < items.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div className="smem-order-thumb">
                      {it.image ? (
                        <Image src={it.image} alt="" width={48} height={48} unoptimized style={{ objectFit: "contain" }} />
                      ) : (
                        <span>📱</span>
                      )}
                    </div>
                    <div className="smem-order-detail">
                      <h4>{it.productName}</h4>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {[it.ram && `RAM ${it.ram}`, it.storage, it.color].filter(Boolean).join(" · ")}
                        {it.quantity > 1 && ACCOUNT_PANEL.quantitySuffix(it.quantity)}
                      </div>
                    </div>
                    <div className="smem-order-price" style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                      {formatVnd(it.unitPrice * (it.quantity || 1))}
                    </div>
                  </div>
                ))}

                <div className="smem-order-summary" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #f1f5f9", marginTop: "8px" }}>
                  <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                    {ACCOUNT_PANEL.paymentPrefix}<strong>{ord.paymentStatus === "paid" ? ACCOUNT_PANEL.paymentPaid : ACCOUNT_PANEL.paymentPending}</strong>
                  </div>
                  <div className="smem-order-summary-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{ACCOUNT_PANEL.totalPaidPrefix}</span>
                      <strong style={{ fontSize: "16px", color: "var(--smem-red)" }}>{formatVnd(Number(ord.total))}</strong>
                    </div>
                    <Link
                      href={`/member/hoa-don/${ord.id}`}
                      style={{ padding: "6px 12px", background: "#f1f5f9", borderRadius: "6px", fontSize: "12px", fontWeight: 700, color: "#0284c7", textDecoration: "none" }}
                    >
                      {ACCOUNT_PANEL.invoiceAndWarranty}</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="smem-empty-box">
          <div className="smem-empty-icon">🛍️</div>
          <h3>{purchases.length === 0 ? ACCOUNT_PANEL.noOrdersTitle : ACCOUNT_PANEL.noOrderFound}</h3>
          <p>
            {purchases.length === 0
              ? ACCOUNT_PANEL.noOrderFoundText
              : ACCOUNT_PANEL.noOrderMatch}
          </p>
          {purchases.length === 0 ? (
            <Link href="/" className="smem-cta-btn">
              {ACCOUNT_PANEL.startShopping}</Link>
          ) : (
            <button
              type="button"
              className="smem-cta-btn"
              onClick={() => { setOrderStatusFilter("all"); setOrderSearchKeyword(""); }}
            >
              {ACCOUNT_PANEL.clearSearch}</button>
          )}
        </div>
      )}
    </div>
  );
}

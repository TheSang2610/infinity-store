"use client";

import { ACCOUNT_PANEL } from "@/src/constants/portal/account";
import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import type { Customer, MemberPurchase } from "../account-model";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type MemberSidebarProps = {
  activeSideTab: string;
  switchTab: (tab: string) => void;
  orderCount: number;
  setCustomer: Dispatch<SetStateAction<Customer | null>>;
  setPurchases: Dispatch<SetStateAction<MemberPurchase[]>>;
  setMessage: Dispatch<SetStateAction<string>>;
  router: AppRouterInstance;
};

export default function MemberSidebar({ activeSideTab, switchTab, orderCount, setCustomer, setPurchases, setMessage, router }: MemberSidebarProps) {
  async function logout() {
    try {
      const response = await fetch("/api/account/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error(ACCOUNT_PANEL.logoutError);
      setCustomer(null);
      setPurchases([]);
      setMessage("");
      window.dispatchEvent(new CustomEvent("huy-account-change", { detail: { customer: null } }));
      router.replace("/member");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : ACCOUNT_PANEL.logoutError);
    }
  }

  return (
    <aside className="smem-dash-sidebar">
      <ul className="smem-side-menu">
        <li className={`smem-side-item ${activeSideTab === "overview" ? "is-active" : ""}`}>
          <button type="button" onClick={() => switchTab("overview")}>
            <span>🏠</span> <span>{ACCOUNT_PANEL.overview}</span>
          </button>
        </li>
        <li className={`smem-side-item ${activeSideTab === "orders" ? "is-active" : ""}`}>
          <button type="button" onClick={() => switchTab("orders")}>
            <span>📑</span> <span>{ACCOUNT_PANEL.orderHistory}</span>
            {orderCount > 0 && (
              <span style={{ marginLeft: "auto", fontSize: "11px", background: "#e0f2fe", color: "#0284c7", padding: "1px 6px", borderRadius: "10px", fontWeight: 700 }}>
                {orderCount}
              </span>
            )}
          </button>
        </li>
        <li className={`smem-side-item ${activeSideTab === "tier" ? "is-active" : ""}`}>
          <button type="button" onClick={() => switchTab("tier")}>
            <span>💎</span> <span>{ACCOUNT_PANEL.tierAndPerks}</span>
          </button>
        </li>
        <li className={`smem-side-item ${activeSideTab === "vouchers" ? "is-active" : ""}`}>
          <button type="button" onClick={() => switchTab("vouchers")}>
            <span>🎟️</span> <span>{ACCOUNT_PANEL.voucherWallet}</span>
            <span style={{ marginLeft: "auto", fontSize: "11px", background: "#fee2e2", color: "var(--smem-red)", padding: "1px 6px", borderRadius: "10px", fontWeight: 700 }}>5</span>
          </button>
        </li>
        <li className={`smem-side-item ${activeSideTab === "address" ? "is-active" : ""}`}>
          <button type="button" onClick={() => switchTab("address")}>
            <span>📍</span> <span>{ACCOUNT_PANEL.addressBook}</span>
          </button>
        </li>
        <li className={`smem-side-item ${activeSideTab === "student" ? "is-active" : ""}`}>
          <button type="button" onClick={() => switchTab("student")}>
            <span>🎓</span> <span>{ACCOUNT_PANEL.studentOffer}</span>
          </button>
        </li>
        <li className={`smem-side-item ${activeSideTab === "business" ? "is-active" : ""}`}>
          <button type="button" onClick={() => switchTab("business")}>
            <span>💼</span> <span>{ACCOUNT_PANEL.businessOffer}</span>
          </button>
        </li>
        <li className={`smem-side-item ${activeSideTab === "refer" ? "is-active" : ""}`}>
          <button type="button" onClick={() => switchTab("refer")}>
            <span>👥</span> <span>{ACCOUNT_PANEL.referral}</span>
            <small style={{ background: "var(--smem-red)", color: "#fff", padding: "1px 5px", borderRadius: "4px", fontSize: "10px", marginLeft: "auto" }}>{ACCOUNT_PANEL.newBadge}</small>
          </button>
        </li>
        <li className={`smem-side-item ${activeSideTab === "profile" ? "is-active" : ""}`}>
          <button type="button" onClick={() => switchTab("profile")}>
            <span>⚙️</span> <span>{ACCOUNT_PANEL.accountInfo}</span>
          </button>
        </li>
        <li className={`smem-side-item ${activeSideTab === "warranty" ? "is-active" : ""}`}>
          <button type="button" onClick={() => switchTab("warranty")}>
            <span>🛡️</span> <span>{ACCOUNT_PANEL.warrantyLookup}</span>
          </button>
        </li>
        <li className="smem-side-item">
          <Link href="/tra-gop">
            <span>�</span> <span>{ACCOUNT_PANEL.installmentSimulator}</span>
          </Link>
        </li>
        <li className="smem-side-item">
          <Link href="/tu-van">
            <span>🏬</span> <span>{ACCOUNT_PANEL.findStore}</span>
          </Link>
        </li>
        <li className="smem-side-item">
          <button type="button" onClick={logout} style={{ color: "#b91c1c" }}>
            <span>🚪</span> <span>{ACCOUNT_PANEL.logout}</span>
          </button>
        </li>
      </ul>
    </aside>
  );
}

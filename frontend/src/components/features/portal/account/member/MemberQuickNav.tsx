"use client";

import { ACCOUNT_PANEL } from "@/src/constants/portal/account";

type MemberQuickNavProps = {
  switchTab: (tab: string) => void;
  activeSideTab: string;
  orderCount: number;
};

export default function MemberQuickNav({ switchTab, activeSideTab, orderCount }: MemberQuickNavProps) {
  return (
    <div className="smem-quick-nav-bar" role="navigation" aria-label={ACCOUNT_PANEL.quickActions}>
      <button type="button" onClick={() => switchTab("overview")} className={`smem-quick-tab ${activeSideTab === "overview" ? "is-active" : ""}`}>
        {ACCOUNT_PANEL.menuOverview}</button>
      <button type="button" onClick={() => switchTab("orders")} className={`smem-quick-tab ${activeSideTab === "orders" ? "is-active" : ""}`}>
        {ACCOUNT_PANEL.menuOrders}{orderCount > 0 ? `(${orderCount})` : ""}
      </button>
      <button type="button" onClick={() => switchTab("warranty")} className={`smem-quick-tab ${activeSideTab === "warranty" ? "is-active" : ""}`}>
        {ACCOUNT_PANEL.menuWarranty}</button>
      <button type="button" onClick={() => switchTab("tier")} className={`smem-quick-tab ${activeSideTab === "tier" ? "is-active" : ""}`}>
        {ACCOUNT_PANEL.menuTier}</button>
      <button type="button" onClick={() => switchTab("vouchers")} className={`smem-quick-tab ${activeSideTab === "vouchers" ? "is-active" : ""}`}>
        {ACCOUNT_PANEL.menuVouchers}<strong style={{ color: activeSideTab === "vouchers" ? "#fff" : "var(--smem-red)" }}>(5)</strong>
      </button>
      <button type="button" onClick={() => switchTab("address")} className={`smem-quick-tab ${activeSideTab === "address" ? "is-active" : ""}`}>
        {ACCOUNT_PANEL.menuAddresses}</button>
      <button type="button" onClick={() => switchTab("student")} className={`smem-quick-tab ${activeSideTab === "student" ? "is-active" : ""}`}>
        {ACCOUNT_PANEL.menuStudent}</button>
      <button type="button" onClick={() => switchTab("business")} className={`smem-quick-tab ${activeSideTab === "business" ? "is-active" : ""}`}>
        {ACCOUNT_PANEL.menuBusiness}</button>
      <button type="button" onClick={() => switchTab("refer")} className={`smem-quick-tab ${activeSideTab === "refer" ? "is-active" : ""}`}>
        {ACCOUNT_PANEL.menuReferral}</button>
      <button type="button" onClick={() => switchTab("profile")} className={`smem-quick-tab ${activeSideTab === "profile" ? "is-active" : ""}`}>
        {ACCOUNT_PANEL.menuAccount}</button>
    </div>
  );
}

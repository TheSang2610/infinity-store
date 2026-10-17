"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useStoreSettings } from "@/src/hooks/store-settings";
import {
  errorMessage, safeReturnTo, type Customer, type MemberPurchase, type SavedAddress, type StudentVerification,
} from "./account-model";
import OverviewTab from "./member/OverviewTab";
import OrdersTab from "./member/OrdersTab";
import WarrantyTab from "./member/WarrantyTab";
import TierTab from "./member/TierTab";
import VouchersTab from "./member/VouchersTab";
import StudentTab from "./member/StudentTab";
import BusinessTab from "./member/BusinessTab";
import AddressTab from "./member/AddressTab";
import ReferralTab from "./member/ReferralTab";
import ProfileTab from "./member/ProfileTab";
import MemberSummaryCard from "./member/MemberSummaryCard";
import MemberQuickNav from "./member/MemberQuickNav";
import MemberSidebar from "./member/MemberSidebar";
import MemberLoginView from "./member/MemberLoginView";

export default function AccountPanel() {
  const { storeName } = useStoreSettings();
  const params = useSearchParams();
  const router = useRouter();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recoveryStep, setRecoveryStep] = useState<"forgot" | "verify" | "reset" | "">("");
  const [message, setMessage] = useState(errorMessage(params.get("error")));
  const [avatarPreview, setAvatarPreview] = useState("");
  const [purchases, setPurchases] = useState<MemberPurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  // Dashboard active tab & hash sync
  const [activeSideTab, setActiveSideTab] = useState(params.get("complete") === "1" ? "profile" : "overview");
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);

  // Address book states
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  // Student & Business form states
  const [studentVerification, setStudentVerification] = useState<StudentVerification | null>(null);
  const [studentSchool, setStudentSchool] = useState("");
  const [studentId, setStudentId] = useState("");
  const [businessRegistered, setBusinessRegistered] = useState(false);

  // Profile update states
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  // Order filters
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearchKeyword, setOrderSearchKeyword] = useState("");

  // Synchronize hash with activeSideTab
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (["overview", "orders", "warranty", "tier", "vouchers", "address", "student", "business", "refer", "profile"].includes(hash)) {
        setActiveSideTab(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const switchTab = (tab: string) => {
    setActiveSideTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  };

  const refresh = useCallback(async () => {
    try {
      const result = await fetch("/api/account/me").then((res) => res.json()) as { customer?: Customer };
      const nextCustomer = result.customer || null;
      setCustomer(nextCustomer);
      if (!nextCustomer) {
        setPurchases([]);
        setStudentVerification(null);
        return;
      }
      setPurchasesLoading(true);
      const [purchaseResult, studentResult] = await Promise.all([
        fetch("/api/account/purchases").then((res) => res.json()) as Promise<{ purchases?: MemberPurchase[] }>,
        fetch("/api/account/student-verification").then((res) => res.json()) as Promise<{ verification?: StudentVerification | null }>,
      ]);
      setPurchases(purchaseResult.purchases || []);
      const verification = studentResult.verification || null;
      setStudentVerification(verification);
      if (verification) {
        setStudentSchool(verification.school);
        setStudentId(verification.studentCode);
      }
    } catch {
      // ignore
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(task);
  }, [refresh]);

  // Load saved local data
  useEffect(() => {
    if (typeof window === "undefined") return;
    const task = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("inf_user_addresses");
        if (saved) {
          setAddresses(JSON.parse(saved));
        }
        // Chua luu dia chi nao thi de trong cho khach tu them (truoc day dien san dia chi cua hang).
        if (localStorage.getItem("inf_business_profile")) setBusinessRegistered(true);
      } catch {}
    }, 0);
    return () => window.clearTimeout(task);
  }, [customer]);

  useEffect(() => {
    if (!customer) return;
    const task = window.setTimeout(() => {
      setProfileName(customer.name || "");
      setProfilePhone(customer.phone || "");
    }, 0);
    return () => window.clearTimeout(task);
  }, [customer]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucher(code);
    setTimeout(() => setCopiedVoucher(null), 2000);
  };

  // =========================================================================
  // VIEW: AUTHENTICATED MEMBER DASHBOARD
  // =========================================================================
  if (customer) {
    const avatar = avatarPreview || customer.avatarUrl;
    const initials = (customer.name || customer.username || "IF")
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "IF";

    const totalSpent = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    const orderCount = purchases.length;
    const memberTier = totalSpent >= 50000000 ? "INFINITY DIAMOND" : totalSpent >= 20000000 ? "INFINITY VIP" : "INFINITY MEMBER";
    const nextTierGoal = totalSpent >= 50000000
      ? null
      : totalSpent >= 20000000
      ? { name: "INFINITY DIAMOND", needed: 50000000 - totalSpent }
      : { name: "INFINITY VIP", needed: 20000000 - totalSpent };

    return (
      <div className="smem-dashboard-wrap">
        <div className="smem-dash-container">
          {/* TOP SUMMARY CARD */}
          <MemberSummaryCard avatar={avatar} initials={initials} customer={customer} memberTier={memberTier} orderCount={orderCount} totalSpent={totalSpent} nextTierGoal={nextTierGoal} storeName={storeName} />

          {/* HORIZONTAL QUICK NAV BAR */}
          <MemberQuickNav switchTab={switchTab} activeSideTab={activeSideTab} orderCount={orderCount} />

          {/* MAIN 2-COLUMN GRID */}
          <div className="smem-dash-main-grid">
            {/* SIDEBAR MENU */}
            <MemberSidebar activeSideTab={activeSideTab} switchTab={switchTab} orderCount={orderCount} setCustomer={setCustomer} setPurchases={setPurchases} setMessage={setMessage} router={router} />

            {/* CONTENT COLUMN */}
            <div className="smem-dash-content">
              {/* TAB 1: TỔNG QUAN (OVERVIEW) */}
              {activeSideTab === "overview" && (
                <OverviewTab purchases={purchases} switchTab={switchTab} copyCode={copyCode} copiedVoucher={copiedVoucher} setOrderSearchKeyword={setOrderSearchKeyword} setOrderStatusFilter={setOrderStatusFilter} />
              )}

              {/* TAB 2: LỊCH SỬ MUA HÀNG (ORDERS) */}
              {activeSideTab === "orders" && (
                <OrdersTab orderSearchKeyword={orderSearchKeyword} setOrderSearchKeyword={setOrderSearchKeyword} purchases={purchases} orderStatusFilter={orderStatusFilter} setOrderStatusFilter={setOrderStatusFilter} purchasesLoading={purchasesLoading} />
              )}

              {/* TRA CỨU BẢO HÀNH NGAY TRONG MEMBER */}
              {activeSideTab === "warranty" && (
                <WarrantyTab purchasesLoading={purchasesLoading} purchases={purchases} />
              )}

              {/* TAB 3: HẠNG THÀNH VIÊN (TIER) */}
              {activeSideTab === "tier" && (
                <TierTab memberTier={memberTier} totalSpent={totalSpent} customer={customer} nextTierGoal={nextTierGoal} />
              )}

              {/* TAB 4: MÃ GIẢM GIÁ (VOUCHERS) */}
              {activeSideTab === "vouchers" && (
                <VouchersTab copyCode={copyCode} copiedVoucher={copiedVoucher} />
              )}

              {/* TAB 5: ƯU ĐÃI HỌC SINH - SINH VIÊN (STUDENT) */}
              {activeSideTab === "student" && (
                <StudentTab studentVerification={studentVerification} setStudentVerification={setStudentVerification} studentSchool={studentSchool} setStudentSchool={setStudentSchool} studentId={studentId} setStudentId={setStudentId} />
              )}

              {/* TAB 6: KHÁCH HÀNG DOANH NGHIỆP (BUSINESS) */}
              {activeSideTab === "business" && (
                <BusinessTab businessRegistered={businessRegistered} setBusinessRegistered={setBusinessRegistered} />
              )}

              {/* TAB 7: SỔ ĐỊA CHỈ (ADDRESS) */}
              {activeSideTab === "address" && (
                <AddressTab addresses={addresses} setAddresses={setAddresses} />
              )}

              {/* TAB 8: GIỚI THIỆU BẠN BÈ (REFER) */}
              {activeSideTab === "refer" && (
                <ReferralTab customer={customer} />
              )}

              {/* TAB 9: THÔNG TIN TÀI KHOẢN (PROFILE) */}
              {activeSideTab === "profile" && (
                <ProfileTab params={params} avatar={avatar} customer={customer} initials={initials} profileName={profileName} setProfileName={setProfileName} profilePhone={profilePhone} setProfilePhone={setProfilePhone} setRecoveryStep={setRecoveryStep} setMessage={setMessage} setAvatarPreview={setAvatarPreview} setCustomer={setCustomer} returnTo={returnTo} router={router} refresh={refresh} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: UNAUTHENTICATED MEMBER LOGIN / REGISTER PORTAL
  // =========================================================================
  return (
    <MemberLoginView recoveryStep={recoveryStep} message={message} setRecoveryStep={setRecoveryStep} setMessage={setMessage} returnTo={returnTo} storeName={storeName} params={params} setCustomer={setCustomer} router={router} refresh={refresh} />
  );
}

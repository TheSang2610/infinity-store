// Kieu du lieu va ham phu cua trang Member (tai khoan khach).
import { ACCOUNT_PANEL } from "@/src/constants/portal/account";

export type Customer = {
  username: string;
  avatarUrl: string;
  name: string;
  email: string;
  phone: string;
  provider: "password" | "google";
  verified: boolean;
  profileComplete: boolean;
};

export type AuthResult = {
  customer?: Customer;
  message?: string;
};

export type MemberPurchase = {
  id: string;
  orderCode: string;
  productName: string;
  items: Array<{
    productSlug: string;
    productName: string;
    ram: string;
    storage: string;
    color: string;
    quantity: number;
    unitPrice: number;
    image: string;
  }>;
  quantity: number;
  total: string;
  status: string;
  paymentStatus: string;
  invoiceStatus: string;
  invoiceNumber: string;
  invoiceDate: string;
  warrantyMonths: number;
  warrantyStartDate: string;
  warrantySerials: string;
  warrantyPolicy: string;
  branchName: string;
  createdAt: number;
};

/** Dia chi giao hang khach tu luu (chi o trinh duyet, localStorage). */
export type SavedAddress = { id: string; name: string; phone: string; address: string; city: string; isDefault: boolean };

export type StudentVerification = {
  id: string;
  school: string;
  studentCode: string;
  graduationYear: string;
  faculty: string;
  documentName: string;
  status: "pending" | "approved" | "rejected";
  reviewNote: string;
  reviewedByName: string;
  createdAt: number;
  updatedAt: number;
  reviewedAt: number;
};

/** Link gioi thieu theo ten mien dang mo (khong viet cung ten mien). Chi goi khi da co khach (phia trinh duyet). */
export function referralLink(username: string) {
  return `${window.location.origin}/?ref=${encodeURIComponent(username)}`;
}

export function errorMessage(error: string | null) {
  if (error === "admin-only") return ACCOUNT_PANEL.staffOnly;
  if (error === "google-config") return ACCOUNT_PANEL.googleNotConfigured;
  if (error === "google") return ACCOUNT_PANEL.googleError;
  return "";
}

export function safeReturnTo(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/api/")
    ? value
    : "/member";
}

export function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export function calculateWarrantyEnd(startDate: string, months: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || months <= 0) return "";
  const date = new Date(`${startDate}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function formatWarrantyDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

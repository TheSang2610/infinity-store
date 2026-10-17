import type { PublicStoreSettings } from "@/src/types";

/** Dung khi chua doc duoc cai dat tu backend: de trong, khong dien so dien thoai/tai khoan gia. */
export const EMPTY_STORE_SETTINGS: PublicStoreSettings = {
  storeName: "", companyName: "", businessLicense: "", officeAddress: "", email: "",
  hotline: "", hotlineHours: "", supportHotline: "", supportHours: "", complaintHotline: "", complaintHours: "",
  consultPhone: "", zaloPhone: "", showrooms: [], socialLinks: [],
  bank: { code: "", name: "", accountNumber: "", accountName: "" },
  momo: { phone: "", accountName: "" },
  invoiceSeller: { name: "", taxCode: "", address: "", phone: "" },
  paymentMethods: { bankTransfer: "", momo: "", applePay: "", installment: "" },
};

/** "028.0000.0000" -> "tel:02800000000". */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function zaloHref(phone: string) {
  return `https://zalo.me/${phone.replace(/\D/g, "")}`;
}

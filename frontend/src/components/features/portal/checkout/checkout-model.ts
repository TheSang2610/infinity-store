import { CHECKOUT } from "@/src/constants/portal/checkout";

export const STORE_VISIT = CHECKOUT.deliveryStoreVisit;

export type Customer = { name: string; email: string; phone: string };
export type VoucherQuote = { code: string; discount: number; subtotal: number };
export type Branch = { id: string; name: string; address: string; phone: string; hours: string };

/** Ten ngan cua phuong thuc thanh toan (ten day du co so tai khoan lay tu cai dat cua hang). */
export function paymentOptionLabel(method: string) {
  if (method.startsWith("Chuyển khoản")) return CHECKOUT.optionBank;
  if (method.startsWith("MoMo")) return CHECKOUT.optionMomo;
  if (method.startsWith("Apple Pay")) return "Apple Pay";
  if (method.startsWith("Trả góp")) return CHECKOUT.optionInstallment;
  return method || CHECKOUT.notSelected;
}

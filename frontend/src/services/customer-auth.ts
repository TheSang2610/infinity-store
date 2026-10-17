import "server-only";
import { api } from "@/src/services/api";
import type { Customer } from "@/src/types";

/** Khach dang dang nhap (doc tu backend bang cookie cua trinh duyet). */
export async function currentCustomer() {
  try {
    return (await api<{ customer: Customer | null }>("/account/me")).customer ?? undefined;
  } catch {
    return undefined;
  }
}

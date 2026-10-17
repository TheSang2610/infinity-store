"use server";

import { redirect } from "next/navigation";
import { portalPathForRole } from "@/src/services/admin-auth";
import { apiWithCookies } from "@/src/services/api";
import type { AdminUser } from "@/src/types";

export async function loginAdminAction(formData: FormData) {
  const returnTo = safeReturnTo(fieldValue(formData, "returnTo"));
  let user: AdminUser | undefined;
  try {
    // Backend dat cookie phien "admin" (va xoa cookie khach); apiWithCookies chuyen ve trinh duyet.
    user = (await apiWithCookies<{ user: AdminUser }>("/admin/session", {
      method: "POST",
      body: { username: fieldValue(formData, "username"), password: fieldValue(formData, "password") },
    })).user;
  } catch {
    user = undefined;
  }
  redirect(user ? portalPathForRole(user.role) : `/admin-login?error=invalid&returnTo=${encodeURIComponent(returnTo)}`);
}

export async function logoutAdminAction() {
  await apiWithCookies("/admin/session", { method: "DELETE" }).catch(() => undefined);
  redirect("/admin-login?status=signed-out");
}

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
  try {
    const url = new URL(value, "https://huy.local");
    if (url.origin !== "https://huy.local") return "/admin";
    if (!url.pathname.startsWith("/admin") || url.pathname === "/admin-login") return "/admin";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin";
  }
}

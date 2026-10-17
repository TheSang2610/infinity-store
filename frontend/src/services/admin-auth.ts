import "server-only";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/src/services/api";
import type { AdminUser } from "@/src/types";

// Kiem tra dang nhap quan tri cho trang va server action. Backend luon kiem lai quyen
// o tung API - cac ham o day chi de chuyen huong/an nut cho dung.

export function portalPathForRole(role: AdminUser["role"]) {
  if (role === "owner") return "/admin";
  if (role === "manager") return "/manager";
  return "/staff";
}

/** Giu ten ham cu; chuyen huong trong cung ten mien nen khong can URL tuyet doi. */
export function adminRedirectUrl(path: string) {
  return path;
}

export function canManageProducts(user?: Pick<AdminUser, "role">) {
  return user?.role === "owner" || user?.role === "manager";
}

export function canManageEmployee(
  user: Pick<AdminUser, "role" | "branchId" | "branch">,
  employee: Pick<AdminUser, "branchId" | "branch">,
) {
  if (user.role === "owner") return true;
  if (user.role !== "manager") return false;
  if (user.branchId && employee.branchId) return user.branchId === employee.branchId;
  return Boolean(user.branch && employee.branch && normalizeBranch(user.branch) === normalizeBranch(employee.branch));
}

export async function currentAdminUser(): Promise<AdminUser | undefined> {
  try {
    return (await api<{ user: AdminUser }>("/admin/me")).user;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return undefined;
    throw error;
  }
}

export async function requireAdminPage(returnTo = "/admin") {
  const user = await currentAdminUser();
  if (user) return user;
  redirect(`/admin-login?returnTo=${encodeURIComponent(returnTo)}`);
}

export async function requireOwnerPage(returnTo = "/admin/staff") {
  const user = await requireAdminPage(returnTo);
  if (user.role !== "owner") redirect("/admin?error=owner-required");
  return user;
}

export async function requireHrManagerPage(returnTo = "/admin/hr") {
  const user = await requireAdminPage(returnTo);
  if (user.role !== "owner" && user.role !== "manager") redirect("/admin?error=hr-manager-required");
  return user;
}

export async function requireInventoryPage(returnTo = "/admin/inventory") {
  const user = await requireAdminPage(returnTo);
  if (user.role !== "owner" && user.role !== "manager" && user.role !== "inventory") {
    redirect(`${portalPathForRole(user.role)}?error=inventory-required`);
  }
  return user;
}

/** Dung trong server action: chua dang nhap thi bao loi (backend se tu choi lan nua). */
export async function requireAdminAction() {
  const user = await currentAdminUser();
  if (!user) throw new Error("Bạn cần đăng nhập trang quản lý.");
  return user;
}

export async function requireOwnerAction() {
  const user = await requireAdminAction();
  if (user.role !== "owner") throw new Error("Chỉ tài khoản Giám đốc được thực hiện chức năng này.");
  return user;
}

export async function requireHrManagerAction() {
  const user = await requireAdminAction();
  if (user.role !== "owner" && user.role !== "manager") throw new Error("Chỉ Giám đốc hoặc quản lý chi nhánh được cập nhật hồ sơ nhân viên.");
  return user;
}

export async function requireInventoryAction() {
  const user = await requireAdminAction();
  if (user.role !== "owner" && user.role !== "manager" && user.role !== "inventory") {
    throw new Error("Chỉ Giám đốc, quản lý chi nhánh hoặc nhân viên kho được điều chỉnh tồn kho.");
  }
  return user;
}

function normalizeBranch(value: string) {
  return value.trim().toLocaleLowerCase("vi-VN").replace(/\s+/g, " ");
}

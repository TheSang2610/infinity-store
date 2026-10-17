import type { CookieOptions, NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { forbidden, unauthorized } from "../utils/http";
import { adminUserFromSession } from "../repositories/admin-user.repository";
import { customerFromSession } from "../repositories/customer.repository";
import type { AdminRole, AdminUser, Customer } from "../types";

// Ten cookie giu nhu ban cu de khach/nhan vien dang dang nhap khong bi dang xuat khi chuyen.
export const CUSTOMER_COOKIE = "huy_customer";
export const CUSTOMER_VERIFICATION_COOKIE = "huy_customer_verification";
export const CUSTOMER_PASSWORD_RESET_COOKIE = "huy_customer_password_reset";
export const GOOGLE_STATE_COOKIE = "huy_google_state";
export const GOOGLE_RETURN_TO_COOKIE = "huy_google_return_to";
export const ADMIN_COOKIE = "admin";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function sessionCookie(maxAgeMs = THIRTY_DAYS_MS): CookieOptions {
  return { httpOnly: true, sameSite: "lax", secure: env.isProduction, path: "/", maxAge: maxAgeMs };
}

export function shortCookie(maxAgeMs = 10 * 60 * 1000): CookieOptions {
  return sessionCookie(maxAgeMs);
}

export function clearCookie(res: Response, name: string) {
  res.clearCookie(name, { httpOnly: true, sameSite: "lax", secure: env.isProduction, path: "/" });
}

declare module "express-serve-static-core" {
  interface Request {
    customer?: Customer;
    admin?: AdminUser;
  }
}

/** Gan khach dang dang nhap (neu co) vao req.customer, khong chan request. */
export async function loadCustomer(req: Request, _res: Response, next: NextFunction) {
  req.customer = await customerFromSession(req.cookies?.[CUSTOMER_COOKIE]);
  next();
}

export function requireCustomer(req: Request, _res: Response, next: NextFunction) {
  if (!req.customer) throw unauthorized();
  next();
}

/**
 * Chan request neu chua dang nhap trang quan ly, hoac vai tro khong nam trong `roles`.
 * Khong truyen roles = moi nhan vien dang hoat dong.
 */
export function requireAdmin(...roles: AdminRole[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const admin = await adminUserFromSession(req.cookies?.[ADMIN_COOKIE]);
    if (!admin) throw unauthorized("Vui lòng đăng nhập trang quản lý.");
    if (roles.length && !roles.includes(admin.role)) throw forbidden();
    req.admin = admin;
    next();
  };
}

// Nhom quyen dung lai o nhieu route (giong ban cu).
export const OWNER_ONLY: AdminRole[] = ["owner"];
export const MANAGERS: AdminRole[] = ["owner", "manager"];
export const INVENTORY_STAFF: AdminRole[] = ["owner", "manager", "inventory"];
/** Nhan vien kho chi duoc sua so luong tai trang kho, khong sua san pham. */
export const CATALOG_EDITORS: AdminRole[] = ["owner", "manager", "sales", "consultant", "warranty", "repair"];

/** Quan ly chi thao tac nhan vien cung chi nhanh; Giam doc thao tac tat ca. */
export function canManageEmployee(user: Pick<AdminUser, "role" | "branchId" | "branch">, employee: Pick<AdminUser, "branchId" | "branch">) {
  if (user.role === "owner") return true;
  if (user.role !== "manager") return false;
  if (user.branchId && employee.branchId) return user.branchId === employee.branchId;
  return Boolean(user.branch && employee.branch && normalizeBranch(user.branch) === normalizeBranch(employee.branch));
}

/** Quyen thao tac mot don: Giam doc; quan ly cua chi nhanh; nhan vien ban/bao hanh/sua chua duoc giao don. */
export function canOperateOrder(user: AdminUser, order: { branchId: string; assignedAdminId: string }) {
  return user.role === "owner"
    || (user.role === "manager" && order.branchId === user.branchId)
    || ((user.role === "sales" || user.role === "warranty" || user.role === "repair") && order.assignedAdminId === user.id);
}

/** Don ma mot nhan vien duoc xem trong danh sach. */
export function canSeeOrder(user: AdminUser, order: { branchId: string; assignedAdminId: string }) {
  if (user.role === "owner") return true;
  if (user.role === "manager") return order.branchId === user.branchId;
  return order.assignedAdminId === user.id;
}

function normalizeBranch(value: string) {
  return value.trim().toLocaleLowerCase("vi-VN").replace(/\s+/g, " ");
}

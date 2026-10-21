import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { badRequest, forbidden, nonNegativeInt, notFound, text } from "../utils/http";
import {
  ADMIN_COOKIE, canOperateOrder, canSeeOrder, clearCookie, CUSTOMER_COOKIE, readCookie, sessionCookie,
} from "../middlewares/auth";
import type { AdminRole, AdminUser, OrderInvoiceInput, VoucherType } from "../types";
import {
  getBranchById, getBranches, createBranch, setBranchActive, updateBranch,
} from "../repositories/branch.repository";
import { deleteCustomerSession, findCustomers } from "../repositories/customer.repository";
import {
  getManagedOrderById, getManagedOrders, getReportingOrders, updateOrderAssignment, updateOrderInvoice,
  updateOrderPaymentStatus, updateOrderStatus,
} from "../repositories/order.repository";
import { saveAdminProduct } from "../services/admin-product.service";
import { getProductViewStats } from "../repositories/product-view.repository";
import { deleteProducts, setProductActive } from "../repositories/product.repository";
import { getManagedProductById, getManagedProducts } from "../services/product.service";
import { deleteVoucher, findAllVouchers, saveVoucher, setVoucherActive } from "../repositories/voucher.repository";
import * as adminUsers from "../repositories/admin-user.repository";

async function loadOperableOrder(id: string, user: AdminUser) {
  const order = await getManagedOrderById(id);
  if (!order) throw notFound("Không tìm thấy đơn hàng.");
  if (!canOperateOrder(user, order)) throw forbidden("Bạn không có quyền thao tác đơn hàng này.");
  return order;
}

const INVOICE_STATUSES = ["not_created", "draft", "ready", "issued", "cancelled"];

const TAX_RATES = [0, 5, 8, 10];

const CREATABLE_ROLES: AdminRole[] = ["manager", "sales", "consultant", "warranty", "repair", "inventory"];

const branchInput = (body: Record<string, unknown> = {}) => ({
  code: text(body.code), name: text(body.name), address: text(body.address), phone: text(body.phone), hours: text(body.hours),
});

export async function login(req: Request, res: Response) {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const user = await adminUsers.authenticateAdminUser(text(req.body?.username), password);
  if (!user) throw badRequest("Tên đăng nhập hoặc mật khẩu không đúng.");
  // Dang nhap nhan vien thi dang xuat tai khoan khach tren cung trinh duyet (giong ban cu).
  await deleteCustomerSession(readCookie(req, CUSTOMER_COOKIE)).catch(() => undefined);
  clearCookie(res, CUSTOMER_COOKIE);
  res.cookie(ADMIN_COOKIE, await adminUsers.createAdminSession(user.id), sessionCookie());
  res.json({ ok: true, user });
}

export async function logout(req: Request, res: Response) {
  await adminUsers.deleteAdminSession(req.cookies?.[ADMIN_COOKIE]);
  clearCookie(res, ADMIN_COOKIE);
  res.json({ ok: true });
}

export function getCurrentAdmin(req: Request, res: Response) {
  res.json({ user: req.admin });
}

export async function listReportingOrders(req: Request, res: Response) {
  const user = req.admin!;
  res.json({ orders: (await getReportingOrders()).filter((order) => canSeeOrder(user, order)) });
}

export async function getProductViewReport(_req: Request, res: Response) {
  res.json(await getProductViewStats());
}

export async function listProducts(_req: Request, res: Response) {
  res.json({ products: await getManagedProducts() });
}

export async function getProduct(req: Request, res: Response) {
  const product = await getManagedProductById(String(req.params.id));
  if (!product) throw notFound("Không tìm thấy sản phẩm.");
  res.json({ product });
}

export async function saveProduct(req: Request, res: Response) {
  const files = Array.isArray(req.files) ? req.files : [];
  res.json({ ok: true, ...(await saveAdminProduct(req.body ?? {}, files)) });
}

export async function toggleProductActive(req: Request, res: Response) {
  await setProductActive(String(req.params.id), req.body?.active === true);
  res.json({ ok: true });
}

export async function removeProducts(req: Request, res: Response) {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id: unknown): id is string => typeof id === "string") : [];
  if (!ids.length) throw badRequest("Chưa chọn sản phẩm cần xóa.");
  await deleteProducts(ids);
  res.json({ ok: true });
}

export async function listOrders(req: Request, res: Response) {
  const user = req.admin!;
  res.json({ orders: (await getManagedOrders()).filter((order) => canSeeOrder(user, order)) });
}

export async function getOrder(req: Request, res: Response) {
  const order = await getManagedOrderById(String(req.params.id));
  if (!order || !canSeeOrder(req.admin!, order)) throw notFound("Không tìm thấy đơn hàng.");
  res.json({ order, canOperate: canOperateOrder(req.admin!, order) });
}

export async function changeOrderStatus(req: Request, res: Response) {
  const order = await loadOperableOrder(String(req.params.id), req.admin!);
  await updateOrderStatus(order.id, text(req.body?.status));
  res.json({ ok: true });
}

export async function changeOrderPaymentStatus(req: Request, res: Response) {
  const order = await loadOperableOrder(String(req.params.id), req.admin!);
  await updateOrderPaymentStatus(order.id, text(req.body?.paymentStatus));
  res.json({ ok: true });
}

export async function assignOrder(req: Request, res: Response) {
  const user = req.admin!;
  const order = await getManagedOrderById(String(req.params.id));
  if (!order) throw notFound("Không tìm thấy đơn hàng.");
  if (user.role === "manager" && order.branchId && order.branchId !== user.branchId) {
    throw forbidden("Bạn không có quyền điều chuyển đơn của chi nhánh khác.");
  }
  const branchId = user.role === "manager" ? user.branchId : text(req.body?.branchId);
  const branch = (await getBranches(false)).find((item) => item.id === branchId);
  if (!branch) throw badRequest("Vui lòng chọn chi nhánh đang hoạt động.");
  const adminUserId = text(req.body?.adminUserId);
  const staff = adminUserId ? (await adminUsers.getAdminUsers()).find((item) => item.id === adminUserId && item.active) : undefined;
  if (adminUserId && (!staff || staff.branchId !== branch.id || staff.role === "inventory")) {
    throw badRequest("Nhân viên phụ trách đơn phải đang hoạt động, thuộc chi nhánh đã chọn và không thuộc bộ phận kho.");
  }
  await updateOrderAssignment(order.id, { branchId: branch.id, branchName: branch.name, adminUserId: staff?.id ?? "", adminUserName: staff?.name ?? "" });
  res.json({ ok: true });
}

export async function saveOrderInvoice(req: Request, res: Response) {
  const order = await loadOperableOrder(String(req.params.id), req.admin!);
  const body = req.body ?? {};
  const field = (key: string) => text(body[key], 1000);
  const taxRate = Number(body.invoiceTaxRate);
  const invoice: OrderInvoiceInput = {
    invoiceStatus: INVOICE_STATUSES.includes(field("invoiceStatus")) ? field("invoiceStatus") : "draft",
    invoiceNumber: field("invoiceNumber"),
    invoiceTemplateCode: field("invoiceTemplateCode"),
    invoiceSeries: field("invoiceSeries"),
    invoiceDate: field("invoiceDate"),
    invoiceBuyerType: field("invoiceBuyerType") === "company" ? "company" : "individual",
    invoiceBuyerName: field("invoiceBuyerName"),
    invoiceCompanyName: field("invoiceCompanyName"),
    invoiceTaxCode: field("invoiceTaxCode").replace(/[^0-9-]/g, ""),
    invoiceAddress: field("invoiceAddress"),
    invoiceEmail: field("invoiceEmail"),
    invoiceSellerName: field("invoiceSellerName"),
    invoiceSellerTaxCode: field("invoiceSellerTaxCode").replace(/[^0-9-]/g, ""),
    invoiceSellerAddress: field("invoiceSellerAddress"),
    invoiceSellerPhone: field("invoiceSellerPhone"),
    invoiceTaxRate: TAX_RATES.includes(taxRate) ? taxRate : 0,
    invoiceTaxIncluded: body.invoiceTaxIncluded === true,
    invoiceNote: field("invoiceNote"),
    warrantyMonths: Math.min(120, Math.max(0, Number(body.warrantyMonths) || 0)),
    warrantyStartDate: field("warrantyStartDate"),
    warrantySerials: field("warrantySerials"),
    warrantyPolicy: field("warrantyPolicy"),
  };
  await updateOrderInvoice(order.id, invoice);
  res.json({ ok: true });
}

export async function listCustomers(_req: Request, res: Response) {
  res.json({ customers: await findCustomers() });
}

export async function listVouchers(_req: Request, res: Response) {
  res.json({ vouchers: await findAllVouchers() });
}

export async function submitVoucher(req: Request, res: Response) {
  const body = req.body ?? {};
  await saveVoucher({
    id: text(body.id) || randomUUID(),
    code: text(body.code),
    type: text(body.type) as VoucherType,
    value: nonNegativeInt(body.value),
    minOrder: nonNegativeInt(body.minOrder),
    maxDiscount: nonNegativeInt(body.maxDiscount),
    usageLimit: nonNegativeInt(body.usageLimit),
    startsAt: nonNegativeInt(body.startsAt),
    expiresAt: nonNegativeInt(body.expiresAt),
    active: body.active === true,
  });
  res.json({ ok: true });
}

export async function toggleVoucherActive(req: Request, res: Response) {
  await setVoucherActive(String(req.params.id), req.body?.active === true);
  res.json({ ok: true });
}

export async function removeVoucher(req: Request, res: Response) {
  await deleteVoucher(String(req.params.id));
  res.json({ ok: true });
}

export async function listStaff(_req: Request, res: Response) {
  res.json({ users: await adminUsers.getAdminUsers() });
}

export async function createStaff(req: Request, res: Response) {
  const actor = req.admin!;
  const requestedRole = text(req.body?.role) as AdminRole;
  const role: AdminRole = CREATABLE_ROLES.includes(requestedRole) ? requestedRole : "sales";
  const branches = await getBranches(false);
  const serviceBranch = branches.find((item) => item.code.toUpperCase().startsWith("BH") || item.name.toLocaleUpperCase("vi-VN").includes("BẢO HÀNH"));
  const serviceRole = role === "warranty" || role === "repair";
  const branch = serviceRole ? serviceBranch : branches.find((item) => item.id === (actor.role === "manager" ? actor.branchId : text(req.body?.branchId)));
  if (serviceRole && !serviceBranch) throw badRequest("Chưa có chi nhánh bảo hành đang hoạt động.");
  if (!branch) throw badRequest("Vui lòng chọn một chi nhánh đang hoạt động.");
  if (actor.role === "manager" && serviceRole && actor.branchId !== serviceBranch?.id) {
    throw badRequest("Nhân viên bảo hành và sửa chữa chỉ được tạo tại chi nhánh bảo hành.");
  }
  if (actor.role === "manager" && role === "manager") throw forbidden("Quản lý chi nhánh chỉ được thêm nhân sự cấp dưới.");
  await adminUsers.createAdminUser({
    username: text(req.body?.username),
    name: text(req.body?.name),
    password: typeof req.body?.password === "string" ? req.body.password : "",
    role,
    branch: branch.name,
    branchId: branch.id,
  });
  res.json({ ok: true, branchId: branch.id });
}

export async function toggleStaffActive(req: Request, res: Response) {
  const target = await adminUsers.getAdminUserById(String(req.params.id));
  if (!target) throw notFound("Không tìm thấy tài khoản nhân viên.");
  if (target.id === req.admin!.id) throw badRequest("Không thể tự khóa tài khoản đang dùng.");
  await adminUsers.setAdminUserActive(target.id, req.body?.active === true);
  res.json({ ok: true });
}

export async function listBranches(req: Request, res: Response) {
  res.json({ branches: await getBranches(req.query.active !== "1") });
}

export async function getBranch(req: Request, res: Response) {
  const branch = await getBranchById(String(req.params.id));
  if (!branch) throw notFound("Không tìm thấy chi nhánh.");
  res.json({ branch });
}

export async function addBranch(req: Request, res: Response) {
  await createBranch(branchInput(req.body));
  res.json({ ok: true });
}

export async function editBranch(req: Request, res: Response) {
  await updateBranch(String(req.params.id), branchInput(req.body));
  res.json({ ok: true });
}

export async function toggleBranchActive(req: Request, res: Response) {
  await setBranchActive(String(req.params.id), req.body?.active === true);
  res.json({ ok: true });
}

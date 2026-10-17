"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/src/services/api";

// Server action trang quan tri san pham/don hang: chi chuyen du lieu form sang backend.
// Kiem tra quyen va du lieu nam o backend; o day chi chon trang chuyen tiep va thong bao.

export async function saveAdminProductAction(formData: FormData) {
  const id = value(formData, "id");
  let target: string;
  try {
    const saved = await api<{ id: string; slug: string }>("/admin/products", { method: "POST", body: formData });
    refreshAdminAndStore(saved.slug);
    target = value(formData, "mode") === "another" ? "/admin/products/new?status=saved" : `/admin/products/${saved.id}?status=saved`;
  } catch (error) {
    // Dang sua thi o lai trang sua, khong day sang form tao moi lam mat ngu canh.
    const base = id ? `/admin/products/${encodeURIComponent(id)}` : "/admin/products/new";
    target = `${base}?error=${encodeURIComponent(message(error, "Không thể lưu sản phẩm."))}`;
  }
  redirect(target);
}

export async function toggleAdminProductAction(formData: FormData) {
  const id = value(formData, "id");
  if (id) await api(`/admin/products/${encodeURIComponent(id)}/active`, { method: "PATCH", body: { active: value(formData, "active") === "true" } });
  refreshAdminAndStore(value(formData, "slug"));
  redirect("/admin/products?status=updated");
}

export async function bulkDeleteProductsAction(formData: FormData) {
  const ids = formData.getAll("ids").filter((item): item is string => typeof item === "string");
  await api("/admin/products/delete", { method: "POST", body: { ids } });
  revalidatePath("/admin/products");
  redirect("/admin/products?status=deleted");
}

export async function changeOrderStatusAction(formData: FormData) {
  const id = value(formData, "id");
  redirect(await updateOrder(id, "status", "PATCH", { status: value(formData, "status") }, "updated"));
}

export async function changeOrderPaymentStatusAction(formData: FormData) {
  const id = value(formData, "id");
  redirect(await updateOrder(id, "payment-status", "PATCH", { paymentStatus: value(formData, "paymentStatus") }, "updated"));
}

export async function assignOrderAction(formData: FormData) {
  const id = value(formData, "id");
  if (!id) redirect("/admin/orders");
  revalidatePath("/admin/reports");
  redirect(await updateOrder(id, "assignment", "PATCH", { branchId: value(formData, "branchId"), adminUserId: value(formData, "adminUserId") }, "assigned"));
}

export async function saveOrderInvoiceAction(formData: FormData) {
  const id = value(formData, "id");
  if (!id) redirect("/admin/orders");
  const fields = [
    "invoiceStatus", "invoiceNumber", "invoiceTemplateCode", "invoiceSeries", "invoiceDate", "invoiceBuyerType",
    "invoiceBuyerName", "invoiceCompanyName", "invoiceTaxCode", "invoiceAddress", "invoiceEmail", "invoiceSellerName",
    "invoiceSellerTaxCode", "invoiceSellerAddress", "invoiceSellerPhone", "invoiceNote", "warrantyStartDate",
    "warrantySerials", "warrantyPolicy",
  ];
  const body: Record<string, unknown> = Object.fromEntries(fields.map((key) => [key, value(formData, key)]));
  body.invoiceTaxRate = Number(value(formData, "invoiceTaxRate"));
  body.invoiceTaxIncluded = formData.get("invoiceTaxIncluded") === "on";
  body.warrantyMonths = Number(value(formData, "warrantyMonths"));
  redirect(await updateOrder(id, "invoice", "PUT", body, "invoice-saved"));
}

/** Goi API cap nhat don roi tra ve trang chi tiet don kem thong bao ket qua. */
async function updateOrder(id: string, part: string, method: "PATCH" | "PUT", body: Record<string, unknown>, status: string) {
  const page = `/admin/orders/${encodeURIComponent(id)}`;
  try {
    await api(`${page}/${part}`, { method, body });
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(page);
    return `${page}?status=${status}`;
  } catch (error) {
    return `${page}?error=${encodeURIComponent(message(error, "Không thể cập nhật đơn hàng."))}`;
  }
}

function refreshAdminAndStore(slug: string) {
  // Trang cua hang doc du lieu moi lan tai; chi can lam moi trang quan tri va trang san pham.
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/san-pham/${slug}`);
}

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

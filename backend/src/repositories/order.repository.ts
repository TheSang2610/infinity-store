import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, inArray, like, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { bankPaymentEvents, ORDER_STATUSES, orders, PAYMENT_STATUSES } from "../db/schema";
import { badRequest } from "../utils/http";
import type { ManagedOrder, OrderInput, OrderInvoiceInput } from "../types";
import { BANK_TRANSFER_PREFIX, NO_PAYMENT } from "../constants/payment";

type OrderRow = typeof orders.$inferSelect;


/** Ma don do may chu sinh: tien to + 10 ky tu hex in hoa (khop mau doi soat ngan hang). */
export function generateOrderCode(prefix: "HA" | "DT" = "HA") {
  return `${prefix}${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

export async function createOrder(input: OrderInput) {
  const prefix = input.orderCode.startsWith("DT") ? "DT" : "HA";
  // Ma trung (rat hiem) thi sinh ma khac, toi da 5 lan.
  for (let attempt = 0; ; attempt += 1) {
    const orderCode = attempt === 0 && input.orderCode ? input.orderCode : generateOrderCode(prefix);
    try {
      return await insertOrder({ ...input, orderCode });
    } catch (error) {
      if (!isUniqueViolation(error, "orders_order_code_unique") || attempt >= 5) throw error;
    }
  }
}

async function insertOrder(input: OrderInput) {
  const id = randomUUID();
  const createdAt = Date.now();
  const paymentStatus = input.paymentMethod === NO_PAYMENT ? "not_required" : "unpaid";

  await getDb().insert(orders).values({
    ...input,
    id,
    status: "pending",
    paymentStatus,
    total: money(input.total),
    discount: money(input.discount),
    downPaymentAmount: money(input.downPaymentAmount),
    financedAmount: money(input.financedAmount),
    monthlyPayment: money(input.monthlyPayment),
    estimatedInterest: money(input.estimatedInterest),
    customerId: input.customerId || null,
    branchId: input.branchId || null,
    createdAt,
  });

  // Khach co the chuyen khoan truoc khi bam dat hang: doi chieu tien da ve.
  if (input.paymentMethod.startsWith(BANK_TRANSFER_PREFIX)) await applyMatchingPayment(input.orderCode, money(input.total));

  const [saved] = await getDb().select({ status: orders.status, paymentStatus: orders.paymentStatus })
    .from(orders).where(eq(orders.id, id)).limit(1);
  return { id, orderCode: input.orderCode, createdAt, status: saved?.status ?? "pending", paymentStatus: saved?.paymentStatus ?? paymentStatus };
}

export async function getManagedOrders(limit = 100) {
  const rows = await getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  return rows.map(toOrder);
}

/** Bao cao doanh thu can nhieu don hon trang danh sach. */
export async function getReportingOrders() {
  return getManagedOrders(2000);
}

export async function getManagedOrderById(id: string) {
  const [row] = await getDb().select().from(orders).where(eq(orders.id, id)).limit(1);
  return row ? toOrder(row) : undefined;
}

export async function getCustomerOrders(customerId: string, limit = 50) {
  if (!customerId) return [];
  const rows = await getDb().select().from(orders).where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt)).limit(Math.min(100, Math.max(1, limit)));
  return rows.map(toOrder);
}

export async function getCustomerOrderById(id: string, customerId: string) {
  if (!id || !customerId) return undefined;
  const [row] = await getDb().select().from(orders).where(and(eq(orders.id, id), eq(orders.customerId, customerId))).limit(1);
  return row ? toOrder(row) : undefined;
}

/** Tra cuu bao hanh: phai dung ca ma don lan so dien thoai. */
export async function getWarrantyOrder(orderCodeInput: string, phoneInput: string) {
  const orderCode = orderCodeInput.trim().toUpperCase();
  const phone = normalizeLookupPhone(phoneInput);
  if (!/^[A-Z0-9-]{6,25}$/.test(orderCode) || phone.length < 9) return undefined;
  const [row] = await getDb().select().from(orders).where(eq(orders.orderCode, orderCode)).limit(1);
  if (!row || normalizeLookupPhone(row.phone) !== phone) return undefined;
  return toOrder(row);
}

export async function updateOrderStatus(id: string, status: string) {
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) throw badRequest("Trạng thái đơn hàng không hợp lệ.");
  await getDb().update(orders).set({ status }).where(eq(orders.id, id));
}

export async function updateOrderPaymentStatus(id: string, paymentStatus: string) {
  if (!(PAYMENT_STATUSES as readonly string[]).includes(paymentStatus)) throw badRequest("Trạng thái thanh toán không hợp lệ.");
  await getDb().update(orders).set({ paymentStatus }).where(eq(orders.id, id));
}

export async function updateOrderAssignment(id: string, input: { branchId: string; branchName: string; adminUserId: string; adminUserName: string }) {
  await getDb().update(orders).set({
    branchId: input.branchId || null,
    branchName: input.branchName,
    assignedAdminId: input.adminUserId || null,
    assignedAdminName: input.adminUserName,
  }).where(eq(orders.id, id));
}

export async function updateOrderInvoice(id: string, input: OrderInvoiceInput) {
  await getDb().update(orders).set(input).where(eq(orders.id, id));
}

export async function getOrderStatusByCode(orderCode: string) {
  const [row] = await getDb().select({ status: orders.status, paymentStatus: orders.paymentStatus })
    .from(orders).where(eq(orders.orderCode, orderCode)).limit(1);
  return row;
}

export async function getOrderPaymentByCode(orderCode: string) {
  const [row] = await getDb().select({ total: orders.total, paymentMethod: orders.paymentMethod })
    .from(orders).where(eq(orders.orderCode, orderCode)).limit(1);
  return row;
}

/** Ghi giao dich ngan hang (bo qua neu da nhan) roi danh dau don da thanh toan. */
export async function recordBankPayment(input: { id: string; orderCode: string; amount: number; description: string; accountNumber: string }) {
  const amount = Math.max(0, Math.floor(input.amount));
  await getDb().insert(bankPaymentEvents).values({ ...input, amount, createdAt: Date.now() }).onConflictDoNothing();
  return markOrderPaidByCode(input.orderCode, amount);
}

async function applyMatchingPayment(orderCode: string, total: number) {
  if (!orderCode || total <= 0) return false;
  const [payment] = await getDb().select({ amount: bankPaymentEvents.amount }).from(bankPaymentEvents)
    .where(and(eq(bankPaymentEvents.orderCode, orderCode), gte(bankPaymentEvents.amount, total)))
    .orderBy(desc(bankPaymentEvents.createdAt)).limit(1);
  return payment ? markOrderPaidByCode(orderCode, payment.amount) : false;
}

/** Chi danh dau khi don chon chuyen khoan va tien chuyen du so tien don. */
async function markOrderPaidByCode(orderCode: string, amount: number) {
  const updated = await getDb().update(orders)
    .set({
      paymentStatus: "paid",
      status: sql`CASE WHEN ${orders.status} = 'pending' THEN 'confirmed' ELSE ${orders.status} END`,
    })
    .where(and(
      eq(orders.orderCode, orderCode),
      like(orders.paymentMethod, `${BANK_TRANSFER_PREFIX}%`),
      sql`${orders.total} > 0`,
      sql`${orders.total} <= ${amount}`,
    ))
    .returning({ id: orders.id });
  return updated.length > 0;
}

export async function countOrders(where: { branchIds?: string[] } = {}) {
  const rows = await getDb().select({ count: sql<number>`count(*)::int` }).from(orders)
    .where(where.branchIds ? inArray(orders.branchId, where.branchIds) : undefined);
  return rows[0]?.count ?? 0;
}

function toOrder(row: OrderRow): ManagedOrder {
  return {
    ...row,
    orderCode: row.orderCode || row.id.slice(0, 12).toUpperCase(),
    status: row.status === "new" ? "pending" : row.status,
    total: moneyText(row.total),
    shippingFee: moneyText(row.shippingFee),
    discount: moneyText(row.discount),
    downPaymentAmount: moneyText(row.downPaymentAmount),
    financedAmount: moneyText(row.financedAmount),
    monthlyPayment: moneyText(row.monthlyPayment),
    estimatedInterest: moneyText(row.estimatedInterest),
    customerId: row.customerId ?? "",
    branchId: row.branchId ?? "",
    assignedAdminId: row.assignedAdminId ?? "",
  };
}

/** Tien luu dang so nguyen VND; giao dien dung chuoi chu so, rong = chua co gia tri. */
function money(value: string | number | undefined) {
  const amount = Math.floor(Number(value) || 0);
  return amount > 0 ? amount : 0;
}

function moneyText(value: number) {
  return value > 0 ? String(value) : "";
}

function normalizeLookupPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("84") && digits.length >= 11 ? `0${digits.slice(2)}` : digits;
}

function isUniqueViolation(error: unknown, constraint: string) {
  const cause = (error as { cause?: { code?: string; constraint?: string } })?.cause ?? (error as { code?: string; constraint?: string });
  return cause?.code === "23505" && (!cause.constraint || cause.constraint === constraint);
}

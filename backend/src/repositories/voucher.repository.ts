import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { vouchers } from "../db/schema";
import { badRequest, formatMoney } from "../utils/http";
import type { Voucher, VoucherType } from "../types";

type VoucherRow = typeof vouchers.$inferSelect;

export type VoucherInput = Omit<Voucher, "usedCount" | "createdAt">;

export async function findAllVouchers() {
  const rows = await getDb().select().from(vouchers).orderBy(desc(vouchers.createdAt));
  return rows.map(toVoucher);
}

export async function saveVoucher(input: VoucherInput) {
  const code = normalizeCode(input.code);
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) throw badRequest("Mã voucher chỉ gồm 3–24 chữ cái, số, gạch ngang hoặc gạch dưới.");
  if (input.type !== "percent" && input.type !== "fixed") throw badRequest("Loại voucher chưa hợp lệ.");
  if (input.type === "percent" && (input.value < 1 || input.value > 100)) throw badRequest("Phần trăm giảm phải từ 1 đến 100.");
  if (input.type === "fixed" && input.value < 1) throw badRequest("Số tiền giảm phải lớn hơn 0.");
  if ([input.minOrder, input.maxDiscount, input.usageLimit].some((amount) => !Number.isFinite(amount) || amount < 0)) {
    throw badRequest("Giá trị tối thiểu, giảm tối đa và số lượt không được âm.");
  }
  if (input.expiresAt > 0 && input.expiresAt < input.startsAt) throw badRequest("Ngày hết hạn phải sau ngày bắt đầu.");

  const [sameCode] = await getDb().select({ id: vouchers.id }).from(vouchers).where(eq(vouchers.code, code)).limit(1);
  if (sameCode && sameCode.id !== input.id) throw badRequest("Mã voucher đã tồn tại.");

  const values = {
    code,
    type: input.type,
    value: input.value,
    minOrder: input.minOrder,
    maxDiscount: input.maxDiscount,
    usageLimit: input.usageLimit,
    startsAt: input.startsAt,
    expiresAt: input.expiresAt,
    active: input.active,
  };
  await getDb().insert(vouchers).values({ id: input.id, ...values, usedCount: 0, createdAt: Date.now() })
    .onConflictDoUpdate({ target: vouchers.id, set: values });
}

export async function setVoucherActive(id: string, active: boolean) {
  await getDb().update(vouchers).set({ active }).where(eq(vouchers.id, id));
}

export async function deleteVoucher(id: string) {
  await getDb().delete(vouchers).where(eq(vouchers.id, id));
}

/** Tinh so tien giam; nem loi kem ly do neu voucher khong dung duoc. */
export async function validateVoucher(codeInput: string, subtotal: number) {
  const code = normalizeCode(codeInput);
  if (!code) return { code: "", discount: 0 };
  const [row] = await getDb().select().from(vouchers).where(eq(vouchers.code, code)).limit(1);
  if (!row) throw badRequest("Voucher không tồn tại.");
  const voucher = toVoucher(row);
  const now = Date.now();
  if (!voucher.active) throw badRequest("Voucher đã tạm ngừng.");
  if (voucher.startsAt > 0 && now < voucher.startsAt) throw badRequest("Voucher chưa đến thời gian sử dụng.");
  if (voucher.expiresAt > 0 && now > voucher.expiresAt) throw badRequest("Voucher đã hết hạn.");
  if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) throw badRequest("Voucher đã hết lượt sử dụng.");
  if (subtotal < voucher.minOrder) throw badRequest(`Đơn hàng chưa đạt giá trị tối thiểu ${formatMoney(voucher.minOrder)}.`);
  const rawDiscount = voucher.type === "percent" ? Math.floor(subtotal * voucher.value / 100) : voucher.value;
  const discount = Math.min(subtotal, voucher.maxDiscount > 0 ? Math.min(rawDiscount, voucher.maxDiscount) : rawDiscount);
  return { code: voucher.code, discount };
}

/**
 * Giu mot luot voucher. Dieu kien gioi han va thoi han nam ngay trong cau UPDATE
 * nen hai don dat cung luc khong vuot qua usage_limit duoc.
 */
export async function redeemVoucher(codeInput: string) {
  const code = normalizeCode(codeInput);
  if (!code) return;
  const now = Date.now();
  const updated = await getDb().update(vouchers)
    .set({ usedCount: sql`${vouchers.usedCount} + 1` })
    .where(sql`${vouchers.code} = ${code} AND ${vouchers.active}
      AND (${vouchers.usageLimit} = 0 OR ${vouchers.usedCount} < ${vouchers.usageLimit})
      AND (${vouchers.startsAt} = 0 OR ${vouchers.startsAt} <= ${now})
      AND (${vouchers.expiresAt} = 0 OR ${vouchers.expiresAt} >= ${now})`)
    .returning({ id: vouchers.id });
  if (!updated.length) throw badRequest("Voucher đã hết lượt sử dụng hoặc không còn hiệu lực.");
}

export async function releaseVoucher(codeInput: string) {
  const code = normalizeCode(codeInput);
  if (!code) return;
  await getDb().update(vouchers)
    .set({ usedCount: sql`GREATEST(${vouchers.usedCount} - 1, 0)` })
    .where(eq(vouchers.code, code));
}

function toVoucher(row: VoucherRow): Voucher {
  return {
    id: row.id,
    code: row.code,
    type: (row.type === "fixed" ? "fixed" : "percent") as VoucherType,
    value: row.value,
    minOrder: row.minOrder,
    maxDiscount: row.maxDiscount,
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    startsAt: row.startsAt,
    expiresAt: row.expiresAt,
    active: row.active,
    createdAt: row.createdAt,
  };
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

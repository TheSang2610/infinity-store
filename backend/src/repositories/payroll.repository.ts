import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { employeePayrollRecords } from "../db/schema";
import { badRequest } from "../utils/http";
import type { PayrollRecord } from "../types";

type PayrollRow = typeof employeePayrollRecords.$inferSelect;

export async function getPayrollRecords(month: string) {
  const rows = await getDb().select().from(employeePayrollRecords)
    .where(eq(employeePayrollRecords.payrollMonth, cleanMonth(month)))
    .orderBy(desc(employeePayrollRecords.updatedAt));
  return rows.map(toRecord);
}

export async function getPayrollRecord(adminUserId: string, month: string) {
  const [row] = await getDb().select().from(employeePayrollRecords)
    .where(and(eq(employeePayrollRecords.adminUserId, adminUserId), eq(employeePayrollRecords.payrollMonth, cleanMonth(month)))).limit(1);
  return row ? toRecord(row) : undefined;
}

/** Thuc linh = luong co ban + thuong - BHXH - thue TNCN (khong am). Giu ngay tra luong lan dau. */
export async function savePayrollRecord(input: {
  adminUserId: string; payrollMonth: string; baseSalary: number; bonusAmount: number;
  socialInsuranceAmount: number; personalIncomeTaxAmount: number; workDays: number; status: string; note: string;
}) {
  const payrollMonth = cleanMonth(input.payrollMonth);
  if (!input.adminUserId || !payrollMonth) throw badRequest("Nhân viên hoặc tháng lương không hợp lệ.");
  const status = input.status === "paid" ? "paid" : "draft";
  const existing = await getPayrollRecord(input.adminUserId, payrollMonth);
  const now = Date.now();
  const baseSalary = money(input.baseSalary);
  const bonusAmount = money(input.bonusAmount);
  const socialInsuranceAmount = money(input.socialInsuranceAmount);
  const personalIncomeTaxAmount = money(input.personalIncomeTaxAmount);
  const values = {
    baseSalary,
    bonusAmount,
    socialInsuranceAmount,
    personalIncomeTaxAmount,
    payableAmount: Math.max(0, baseSalary + bonusAmount - socialInsuranceAmount - personalIncomeTaxAmount),
    workDays: Math.min(31, Math.max(0, Math.floor(input.workDays) || 0)),
    status,
    paidAt: status === "paid" ? existing?.paidAt || now : 0,
    note: input.note.trim().replace(/\s+/g, " ").slice(0, 300),
    updatedAt: now,
  };
  await getDb().insert(employeePayrollRecords).values({ id: randomUUID(), adminUserId: input.adminUserId, payrollMonth, ...values })
    .onConflictDoUpdate({ target: [employeePayrollRecords.adminUserId, employeePayrollRecords.payrollMonth], set: values });
}

function toRecord(row: PayrollRow): PayrollRecord {
  return { ...row, status: row.status === "paid" ? "paid" : "draft" };
}

function cleanMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : "";
}

function money(value: number) {
  return Math.max(0, Math.min(10_000_000_000, Math.round(Number.isFinite(value) ? value : 0)));
}

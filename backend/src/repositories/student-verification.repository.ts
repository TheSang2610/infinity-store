import { randomUUID } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { customers, studentVerifications } from "../db/schema";
import { badRequest, notFound } from "../utils/http";
import type { StudentVerification, StudentVerificationStatus } from "../types";

const withCustomer = {
  verification: studentVerifications,
  customerName: customers.name,
  customerEmail: customers.email,
  customerPhone: customers.phone,
};

function baseQuery() {
  return getDb().select(withCustomer).from(studentVerifications).innerJoin(customers, eq(customers.id, studentVerifications.customerId));
}

export async function getStudentVerificationForCustomer(customerId: string) {
  const [row] = await baseQuery().where(eq(studentVerifications.customerId, customerId)).limit(1);
  return row ? toVerification(row) : undefined;
}

export async function getStudentVerification(id: string) {
  const [row] = await baseQuery().where(eq(studentVerifications.id, id)).limit(1);
  return row ? toVerification(row) : undefined;
}

/** Ho so cho duyet len dau, roi bi tu choi, roi da duyet. */
export async function getStudentVerifications() {
  const rows = await baseQuery()
    .orderBy(sql`CASE ${studentVerifications.status} WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END`, desc(studentVerifications.updatedAt))
    .limit(500);
  return rows.map(toVerification);
}

/** Nop (hoac nop lai) ho so: moi lan nop lai tro ve trang thai cho duyet. */
export async function submitStudentVerification(input: {
  customerId: string; school: string; studentCode: string; graduationYear: string; faculty: string;
  documentKey: string; documentName: string; documentType: string;
}) {
  const now = Date.now();
  const values = {
    school: clean(input.school, 180),
    studentCode: clean(input.studentCode, 80),
    graduationYear: clean(input.graduationYear, 20),
    faculty: clean(input.faculty, 160),
    documentKey: input.documentKey,
    documentName: clean(input.documentName, 180),
    documentType: clean(input.documentType, 100),
    status: "pending",
    reviewNote: "",
    reviewedBy: "",
    reviewedByName: "",
    updatedAt: now,
    reviewedAt: 0,
  };
  await getDb().insert(studentVerifications).values({ id: randomUUID(), customerId: input.customerId, createdAt: now, ...values })
    .onConflictDoUpdate({ target: studentVerifications.customerId, set: values });
  return getStudentVerificationForCustomer(input.customerId);
}

export async function reviewStudentVerification(input: { id: string; status: "approved" | "rejected"; note: string; reviewerId: string; reviewerName: string }) {
  const current = await getStudentVerification(input.id);
  if (!current) throw notFound("Không tìm thấy hồ sơ sinh viên.");
  const note = clean(input.note, 500);
  if (input.status === "rejected" && note.length < 3) throw badRequest("Vui lòng nhập lý do từ chối để Member có thể bổ sung hồ sơ.");
  const now = Date.now();
  await getDb().update(studentVerifications).set({
    status: input.status, reviewNote: note, reviewedBy: input.reviewerId,
    reviewedByName: clean(input.reviewerName, 120), reviewedAt: now, updatedAt: now,
  }).where(eq(studentVerifications.id, input.id));
  return getStudentVerification(input.id);
}

function toVerification(row: { verification: typeof studentVerifications.$inferSelect; customerName: string; customerEmail: string; customerPhone: string }): StudentVerification {
  const { verification } = row;
  const status: StudentVerificationStatus = verification.status === "approved" || verification.status === "rejected" ? verification.status : "pending";
  return { ...verification, status, customerName: row.customerName, customerEmail: row.customerEmail, customerPhone: row.customerPhone };
}

function clean(value: string, max: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

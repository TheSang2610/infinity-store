import { randomUUID } from "node:crypto";
import { and, asc, between, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { adminUsers, employeeAttendance, employeeProfiles } from "../db/schema";
import { decryptHr, encryptHr } from "../utils/hr-crypto";
import { badRequest } from "../utils/http";
import type { AttendanceRecord, EmployeeDirectoryEntry, EmployeeProfile, PayrollEmployee } from "../types";
import { normalizeRole } from "./admin-user.repository";

type UserRow = typeof adminUsers.$inferSelect;
type ProfileRow = typeof employeeProfiles.$inferSelect;

const ROLE_ORDER = sql`CASE ${adminUsers.role} WHEN 'manager' THEN 0 WHEN 'sales' THEN 1 WHEN 'consultant' THEN 2
  WHEN 'inventory' THEN 3 WHEN 'warranty' THEN 4 WHEN 'repair' THEN 5 ELSE 6 END`;
export const ATTENDANCE_STATUSES = ["present", "late", "leave", "absent"];
/** Vao ca sau gio nay tinh la di muon. */
const LATE_AFTER = "09:00";

export async function getEmployeeDirectory(): Promise<EmployeeDirectoryEntry[]> {
  const today = vietnamDate();
  const rows = await getDb().select({ user: adminUsers, profile: employeeProfiles, todayStatus: employeeAttendance.status, todayCheckIn: employeeAttendance.checkIn })
    .from(adminUsers)
    .leftJoin(employeeProfiles, eq(employeeProfiles.adminUserId, adminUsers.id))
    .leftJoin(employeeAttendance, and(eq(employeeAttendance.adminUserId, adminUsers.id), eq(employeeAttendance.workDate, today)))
    .orderBy(ROLE_ORDER, desc(adminUsers.active), asc(adminUsers.name));
  return Promise.all(rows.map(async (row) => {
    const profile = await toProfile(row.user, row.profile);
    const fields = [profile.dateOfBirth, profile.joinedDate, profile.citizenId, profile.permanentAddress, profile.bankName,
      profile.bankAccountName, profile.bankAccountNumber, profile.monthlySalary > 0 ? "1" : ""];
    return {
      ...profile,
      profileScore: Math.round(fields.filter(Boolean).length / fields.length * 100),
      todayStatus: row.todayStatus ?? "",
      todayCheckIn: row.todayCheckIn ?? "",
      citizenIdMasked: maskValue(profile.citizenId),
      bankAccountMasked: maskValue(profile.bankAccountNumber),
    };
  }));
}

/** Danh sach tinh luong: chi lo 4 so cuoi tai khoan ngan hang. */
export async function getPayrollEmployeeDirectory(): Promise<PayrollEmployee[]> {
  const rows = await getDb().select({ user: adminUsers, profile: employeeProfiles }).from(adminUsers)
    .leftJoin(employeeProfiles, eq(employeeProfiles.adminUserId, adminUsers.id))
    .where(eq(adminUsers.active, true))
    .orderBy(ROLE_ORDER, asc(adminUsers.name));
  return Promise.all(rows.map(async ({ user, profile }) => {
    const bankAccountNumber = await decryptHr(profile?.bankAccountNumberEncrypted ?? "");
    return {
      adminUserId: user.id,
      name: user.name,
      role: normalizeRole(user.role),
      branchId: user.branchId ?? "",
      branch: user.branch,
      monthlySalary: profile?.monthlySalary ?? 0,
      bankName: profile?.bankName ?? "",
      bankAccountMasked: maskValue(bankAccountNumber),
      hasBankAccount: Boolean(bankAccountNumber),
    };
  }));
}

export async function getEmployeeProfile(adminUserId: string) {
  const [row] = await getDb().select({ user: adminUsers, profile: employeeProfiles }).from(adminUsers)
    .leftJoin(employeeProfiles, eq(employeeProfiles.adminUserId, adminUsers.id))
    .where(eq(adminUsers.id, adminUserId)).limit(1);
  return row ? toProfile(row.user, row.profile) : undefined;
}

export async function saveEmployeeProfile(input: Omit<EmployeeProfile, "username" | "role" | "branchId" | "branch" | "active" | "updatedAt">) {
  const name = cleanText(input.name, 100);
  if (name.length < 2) throw badRequest("Vui lòng nhập họ tên nhân viên.");
  const values = {
    dateOfBirth: cleanDate(input.dateOfBirth),
    joinedDate: cleanDate(input.joinedDate),
    citizenIdEncrypted: await encryptHr(input.citizenId.replace(/\D/g, "").slice(0, 20)),
    permanentAddressEncrypted: await encryptHr(cleanText(input.permanentAddress, 500)),
    temporaryAddressEncrypted: await encryptHr(cleanText(input.temporaryAddress, 500)),
    photoKey: input.photoKey.slice(0, 180),
    bankName: cleanText(input.bankName, 100),
    bankAccountNameEncrypted: await encryptHr(cleanText(input.bankAccountName, 120)),
    bankAccountNumberEncrypted: await encryptHr(input.bankAccountNumber.replace(/\s/g, "").slice(0, 40)),
    monthlySalary: Math.max(0, Math.floor(input.monthlySalary) || 0),
    updatedAt: Date.now(),
  };
  await getDb().transaction(async (tx) => {
    await tx.update(adminUsers).set({ name }).where(eq(adminUsers.id, input.adminUserId));
    await tx.insert(employeeProfiles).values({ adminUserId: input.adminUserId, ...values })
      .onConflictDoUpdate({ target: employeeProfiles.adminUserId, set: values });
  });
}

export async function getEmployeePhotoKey(adminUserId: string) {
  const [row] = await getDb().select({ photoKey: employeeProfiles.photoKey }).from(employeeProfiles)
    .where(eq(employeeProfiles.adminUserId, adminUserId)).limit(1);
  return row?.photoKey ?? "";
}

// ---- Cham cong ----

function attendanceQuery() {
  return getDb().select({ attendance: employeeAttendance, employeeName: adminUsers.name, branch: adminUsers.branch })
    .from(employeeAttendance).innerJoin(adminUsers, eq(adminUsers.id, employeeAttendance.adminUserId));
}

export async function getEmployeeAttendance(adminUserId: string, limit = 120) {
  const rows = await attendanceQuery().where(eq(employeeAttendance.adminUserId, adminUserId))
    .orderBy(desc(employeeAttendance.workDate)).limit(Math.min(366, Math.max(1, limit)));
  return rows.map(toAttendance);
}

export async function getAttendanceForMonth(month: string) {
  const normalized = /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : vietnamDate().slice(0, 7);
  const [year, monthNumber] = normalized.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const rows = await attendanceQuery()
    .where(between(employeeAttendance.workDate, `${normalized}-01`, `${normalized}-${String(lastDay).padStart(2, "0")}`))
    .orderBy(desc(employeeAttendance.workDate), asc(adminUsers.name));
  return rows.map(toAttendance);
}

export async function getAttendanceForDate(workDate: string) {
  const rows = await attendanceQuery().where(eq(employeeAttendance.workDate, cleanDate(workDate))).orderBy(asc(adminUsers.name));
  return rows.map(toAttendance);
}

export async function saveAttendance(input: { adminUserId: string; workDate: string; checkIn: string; checkOut: string; status: string; note: string; recordedBy: string }) {
  const now = Date.now();
  const values = {
    checkIn: cleanTime(input.checkIn),
    checkOut: cleanTime(input.checkOut),
    status: ATTENDANCE_STATUSES.includes(input.status) ? input.status : "present",
    note: cleanText(input.note, 300),
    recordedBy: cleanText(input.recordedBy, 120),
    updatedAt: now,
  };
  await getDb().insert(employeeAttendance).values({
    id: randomUUID(), adminUserId: input.adminUserId, workDate: cleanDate(input.workDate) || vietnamDate(), createdAt: now, ...values,
  }).onConflictDoUpdate({ target: [employeeAttendance.adminUserId, employeeAttendance.workDate], set: values });
}

/** Nhan vien tu cham cong vao/ra trong ngay (sau khi da xac thuc bang passkey). */
export async function employeeCheck(adminUserId: string, mode: "in" | "out", recordedBy: string) {
  const now = new Date();
  const workDate = vietnamDate(now);
  const time = vietnamTime(now);
  const [existing] = await getDb().select().from(employeeAttendance)
    .where(and(eq(employeeAttendance.adminUserId, adminUserId), eq(employeeAttendance.workDate, workDate))).limit(1);
  if (mode === "in") {
    if (existing?.checkIn) throw badRequest("Bạn đã chấm công vào hôm nay.");
    await saveAttendance({
      adminUserId, workDate, checkIn: time, checkOut: existing?.checkOut ?? "",
      status: time > LATE_AFTER ? "late" : "present", note: existing?.note ?? "", recordedBy,
    });
    return;
  }
  if (!existing?.checkIn) throw badRequest("Bạn cần chấm công vào trước khi chấm công ra.");
  if (existing.checkOut) throw badRequest("Bạn đã chấm công ra hôm nay.");
  await saveAttendance({ adminUserId, workDate, checkIn: existing.checkIn, checkOut: time, status: existing.status, note: existing.note, recordedBy });
}

async function toProfile(user: UserRow, profile: ProfileRow | null): Promise<EmployeeProfile> {
  return {
    adminUserId: user.id,
    name: user.name,
    username: user.username,
    role: normalizeRole(user.role),
    branchId: user.branchId ?? "",
    branch: user.branch,
    active: user.active,
    dateOfBirth: profile?.dateOfBirth ?? "",
    joinedDate: profile?.joinedDate ?? "",
    citizenId: await decryptHr(profile?.citizenIdEncrypted ?? ""),
    permanentAddress: await decryptHr(profile?.permanentAddressEncrypted ?? ""),
    temporaryAddress: await decryptHr(profile?.temporaryAddressEncrypted ?? ""),
    photoKey: profile?.photoKey ?? "",
    bankName: profile?.bankName ?? "",
    bankAccountName: await decryptHr(profile?.bankAccountNameEncrypted ?? ""),
    bankAccountNumber: await decryptHr(profile?.bankAccountNumberEncrypted ?? ""),
    monthlySalary: profile?.monthlySalary ?? 0,
    updatedAt: profile?.updatedAt ?? 0,
  };
}

function toAttendance(row: { attendance: typeof employeeAttendance.$inferSelect; employeeName: string; branch: string }): AttendanceRecord {
  return { ...row.attendance, employeeName: row.employeeName, branch: row.branch };
}

function cleanText(value: string, limit: number) {
  return value.trim().replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").slice(0, limit);
}
function cleanDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}
function cleanTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "";
}
function maskValue(value: string) {
  return value ? `${"•".repeat(Math.max(4, value.length - 4))}${value.slice(-4)}` : "Chưa cập nhật";
}
export function vietnamDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
function vietnamTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

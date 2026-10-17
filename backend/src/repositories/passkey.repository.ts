import { randomUUID } from "node:crypto";
import { and, count, desc, eq, lte, or } from "drizzle-orm";
import { getDb } from "../db/client";
import { employeeAttendanceChallenges, employeeAttendancePasskeys } from "../db/schema";
import { badRequest } from "../utils/http";
import type { AttendancePasskey } from "../types";

const MAX_DEVICES = 5;
const CHALLENGE_MS = 5 * 60 * 1000;

export async function getAttendancePasskeys(adminUserId: string): Promise<AttendancePasskey[]> {
  return getDb().select().from(employeeAttendancePasskeys)
    .where(eq(employeeAttendancePasskeys.adminUserId, adminUserId))
    .orderBy(desc(employeeAttendancePasskeys.createdAt));
}

export async function saveAttendancePasskey(input: Omit<AttendancePasskey, "createdAt" | "lastUsedAt">) {
  const [{ total }] = await getDb().select({ total: count() }).from(employeeAttendancePasskeys)
    .where(eq(employeeAttendancePasskeys.adminUserId, input.adminUserId));
  if (total >= MAX_DEVICES) throw badRequest(`Mỗi nhân viên chỉ được đăng ký tối đa ${MAX_DEVICES} thiết bị.`);
  await getDb().insert(employeeAttendancePasskeys).values({
    ...input,
    transports: input.transports.slice(0, 8),
    deviceType: input.deviceType.slice(0, 30),
    createdAt: Date.now(),
    lastUsedAt: 0,
  }).onConflictDoNothing();
}

export async function updateAttendancePasskeyCounter(id: string, adminUserId: string, counter: number) {
  await getDb().update(employeeAttendancePasskeys).set({ counter: Math.max(0, counter), lastUsedAt: Date.now() })
    .where(and(eq(employeeAttendancePasskeys.id, id), eq(employeeAttendancePasskeys.adminUserId, adminUserId)));
}

export async function revokeAttendancePasskeys(adminUserId: string) {
  await getDb().transaction(async (tx) => {
    await tx.delete(employeeAttendancePasskeys).where(eq(employeeAttendancePasskeys.adminUserId, adminUserId));
    await tx.delete(employeeAttendanceChallenges).where(eq(employeeAttendanceChallenges.adminUserId, adminUserId));
  });
}

/** Moi nhan vien chi giu mot challenge dang cho (5 phut), tranh dung lai challenge cu. */
export async function createAttendanceChallenge(adminUserId: string, kind: "registration" | "authentication", challenge: string) {
  const id = randomUUID();
  const now = Date.now();
  await getDb().transaction(async (tx) => {
    await tx.delete(employeeAttendanceChallenges).where(or(
      lte(employeeAttendanceChallenges.expiresAt, now),
      eq(employeeAttendanceChallenges.adminUserId, adminUserId),
    ));
    await tx.insert(employeeAttendanceChallenges).values({ id, adminUserId, kind, challenge, expiresAt: now + CHALLENGE_MS, createdAt: now });
  });
  return id;
}

/** Lay va xoa challenge (dung mot lan); het han thi tra chuoi rong. */
export async function consumeAttendanceChallenge(id: string, adminUserId: string, kind: "registration" | "authentication") {
  const [row] = await getDb().delete(employeeAttendanceChallenges)
    .where(and(eq(employeeAttendanceChallenges.id, id), eq(employeeAttendanceChallenges.adminUserId, adminUserId), eq(employeeAttendanceChallenges.kind, kind)))
    .returning({ challenge: employeeAttendanceChallenges.challenge, expiresAt: employeeAttendanceChallenges.expiresAt });
  return row && row.expiresAt > Date.now() ? row.challenge : "";
}

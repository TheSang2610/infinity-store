import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { adminUsers, branches, liveChatConversations, orders, workTasks } from "../db/schema";
import { badRequest, notFound } from "../utils/http";
import type { Branch } from "../types";

export type BranchInput = { code: string; name: string; address: string; phone: string; hours: string };

const staffCount = sql<number>`(SELECT count(*)::int FROM ${adminUsers} u WHERE u.branch_id = ${branches.id} AND u.active)`;

export async function getBranches(includeInactive = true): Promise<Branch[]> {
  const rows = await getDb().select({ branch: branches, staffCount }).from(branches)
    .where(includeInactive ? undefined : eq(branches.active, true))
    .orderBy(desc(branches.active), asc(branches.createdAt));
  return rows.map(({ branch, staffCount: count }) => ({ ...branch, staffCount: Number(count) }));
}

export async function getBranchById(id: string): Promise<Branch | undefined> {
  const [row] = await getDb().select({ branch: branches, staffCount }).from(branches).where(eq(branches.id, id)).limit(1);
  return row ? { ...row.branch, staffCount: Number(row.staffCount) } : undefined;
}

export async function createBranch(input: BranchInput) {
  const values = cleanInput(input);
  const [exists] = await getDb().select({ id: branches.id }).from(branches).where(eq(branches.code, values.code)).limit(1);
  if (exists) throw badRequest("Mã chi nhánh đã tồn tại.");
  await getDb().insert(branches).values({ id: randomUUID(), ...values, active: true, createdAt: Date.now() });
}

/** Doi ten chi nhanh thi dong bo ten luu kem o nhan vien, don hang, cong viec va cuoc chat. */
export async function updateBranch(id: string, input: BranchInput) {
  const values = cleanInput(input);
  const db = getDb();
  const [current] = await db.select({ id: branches.id }).from(branches).where(eq(branches.id, id)).limit(1);
  if (!current) throw notFound("Chi nhánh không còn tồn tại.");
  const [duplicate] = await db.select({ id: branches.id }).from(branches)
    .where(and(eq(branches.code, values.code), ne(branches.id, id))).limit(1);
  if (duplicate) throw badRequest("Mã chi nhánh đã được sử dụng.");

  await db.transaction(async (tx) => {
    await tx.update(branches).set(values).where(eq(branches.id, id));
    await tx.update(adminUsers).set({ branch: values.name }).where(eq(adminUsers.branchId, id));
    await tx.update(orders).set({ branchName: values.name }).where(eq(orders.branchId, id));
    await tx.update(workTasks).set({ branchName: values.name }).where(eq(workTasks.branchId, id));
    await tx.update(liveChatConversations).set({ branchName: values.name }).where(eq(liveChatConversations.branchId, id));
  });
}

export async function setBranchActive(id: string, active: boolean) {
  await getDb().update(branches).set({ active }).where(eq(branches.id, id));
}

function cleanInput(input: BranchInput) {
  const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
  const name = input.name.trim().replace(/\s+/g, " ").slice(0, 100);
  const address = input.address.trim().replace(/\s+/g, " ").slice(0, 180);
  const phone = input.phone.replace(/\D/g, "").slice(0, 11);
  const hours = input.hours.trim().slice(0, 30) || "08:00–22:00";
  if (code.length < 2 || name.length < 2 || address.length < 5) throw badRequest("Vui lòng nhập đầy đủ mã, tên và địa chỉ chi nhánh.");
  return { code, name, address, phone, hours };
}

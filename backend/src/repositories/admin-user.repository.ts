import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { adminUsers, adminUserSessions } from "../db/schema";
import { createPasswordHash, hashToken, randomToken, verifyPassword } from "../utils/crypto";
import { badRequest } from "../utils/http";
import { ADMIN_ROLES, type AdminRole, type AdminUser } from "../types";

type AdminUserRow = typeof adminUsers.$inferSelect;

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

/** Giam doc dung id co dinh "owner" (giong tai khoan ao cua ban cu) de du lieu cu tro toi van dung. */
export const OWNER_ID = "owner";

/** Thu tu hien thi trong danh sach nhan vien. */
const ROLE_ORDER = sql`CASE ${adminUsers.role} WHEN 'owner' THEN -1 WHEN 'manager' THEN 0 WHEN 'sales' THEN 1 WHEN 'consultant' THEN 2
  WHEN 'inventory' THEN 3 WHEN 'warranty' THEN 4 WHEN 'repair' THEN 5 ELSE 6 END`;

export async function createAdminUser(input: { username: string; name: string; password: string; role: AdminRole; branch: string; branchId?: string }) {
  const username = input.username.trim().toLowerCase();
  const name = input.name.trim().replace(/\s+/g, " ").slice(0, 100);
  const branch = input.branch.trim().replace(/\s+/g, " ").slice(0, 120);
  const branchId = (input.branchId ?? "").trim().slice(0, 50);
  if (!/^[a-z0-9._-]{4,32}$/.test(username)) throw badRequest("Tên đăng nhập gồm 4–32 chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.");
  if (name.length < 2) throw badRequest("Vui lòng nhập tên nhân viên.");
  if (input.password.length < 8) throw badRequest("Mật khẩu phải có ít nhất 8 ký tự.");
  if (input.role === "owner") throw badRequest("Không tạo thêm tài khoản Giám đốc.");
  if (await findByUsername(username)) throw badRequest("Tên đăng nhập nhân viên đã tồn tại.");

  const { hash, salt } = await createPasswordHash(input.password);
  const id = randomUUID();
  await getDb().insert(adminUsers).values({
    id, username, name, passwordHash: hash, passwordSalt: salt,
    role: normalizeRole(input.role), branch, branchId: branchId || null, active: true, createdAt: Date.now(),
  });
  return id;
}

/** Tao hoac dat lai mat khau tai khoan Giam doc. Chi chay trong lenh seed. */
export async function upsertOwner(username: string, password: string) {
  if (password.length < 8) throw new Error("OWNER_PASSWORD phải có ít nhất 8 ký tự.");
  const { hash, salt } = await createPasswordHash(password);
  await getDb().insert(adminUsers).values({
    id: OWNER_ID, username: username.toLowerCase(), name: "Giám đốc", passwordHash: hash, passwordSalt: salt,
    role: "owner", branch: "Toàn hệ thống", branchId: null, active: true, createdAt: Date.now(),
  }).onConflictDoUpdate({
    target: adminUsers.id,
    set: { username: username.toLowerCase(), passwordHash: hash, passwordSalt: salt, role: "owner", active: true },
  });
}

export async function authenticateAdminUser(usernameInput: string, password: string) {
  const row = await findByUsername(usernameInput.trim().toLowerCase());
  if (!row || !row.active || !(await verifyPassword(password, row.passwordSalt, row.passwordHash))) return undefined;
  return toAdminUser(row);
}

export async function createAdminSession(adminUserId: string) {
  const token = randomToken();
  const now = Date.now();
  await getDb().insert(adminUserSessions).values({
    id: randomUUID(), adminUserId, tokenHash: hashToken(token), expiresAt: now + SESSION_MS, createdAt: now,
  });
  return token;
}

export async function adminUserFromSession(token?: string) {
  if (!token) return undefined;
  const [row] = await getDb().select({ user: adminUsers }).from(adminUserSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminUserSessions.adminUserId))
    .where(and(eq(adminUserSessions.tokenHash, hashToken(token)), gt(adminUserSessions.expiresAt, Date.now()), eq(adminUsers.active, true)))
    .limit(1);
  return row ? toAdminUser(row.user) : undefined;
}

export async function deleteAdminSession(token?: string) {
  if (!token) return;
  await getDb().delete(adminUserSessions).where(eq(adminUserSessions.tokenHash, hashToken(token)));
}

export async function getAdminUsers() {
  const rows = await getDb().select().from(adminUsers).orderBy(ROLE_ORDER, desc(adminUsers.active), asc(adminUsers.name));
  return rows.map(toAdminUser);
}

export async function getAdminUserById(id: string) {
  const [row] = await getDb().select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  return row ? toAdminUser(row) : undefined;
}

/** Khoa tai khoan thi dang xuat luon moi phien dang mo cua nguoi do. */
export async function setAdminUserActive(id: string, active: boolean) {
  if (id === OWNER_ID && !active) throw badRequest("Không thể khóa tài khoản Giám đốc.");
  const db = getDb();
  await db.update(adminUsers).set({ active }).where(eq(adminUsers.id, id));
  if (!active) await db.delete(adminUserSessions).where(eq(adminUserSessions.adminUserId, id));
}

async function findByUsername(username: string) {
  const [row] = await getDb().select().from(adminUsers).where(sql`lower(${adminUsers.username}) = ${username.toLowerCase()}`).limit(1);
  return row;
}

function toAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: normalizeRole(row.role),
    branch: row.branch,
    branchId: row.branchId ?? "",
    active: row.active,
    createdAt: row.createdAt,
  };
}

export function normalizeRole(value: string): AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(value) ? value as AdminRole : "sales";
}

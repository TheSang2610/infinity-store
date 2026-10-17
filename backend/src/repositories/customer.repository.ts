import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "../db/client";
import { customerPasswordResetSessions, customers, customerSessions, customerVerificationSessions } from "../db/schema";
import { createPasswordHash, hashToken, randomToken, verifyPassword } from "../utils/crypto";
import { badRequest } from "../utils/http";
import type { Customer } from "../types";
import { PUBLIC_IMAGE_PREFIX } from "../services/file-storage.service";

type CustomerRow = typeof customers.$inferSelect;

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const VERIFICATION_MS = 10 * 60 * 1000;
const PASSWORD_RESET_MS = 15 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;

export async function registerCustomer(input: { username: string; name: string; email: string; phone: string; password: string }) {
  const username = input.username.trim().toLowerCase();
  const name = cleanName(input.name);
  const email = normalizeEmail(input.email);
  const phone = input.phone.replace(/\s+/g, "").trim();
  if (!/^[a-z0-9._]{4,24}$/.test(username)) throw badRequest("Tên đăng nhập gồm 4–24 chữ thường, số, dấu chấm hoặc gạch dưới.");
  if (name.length < 2) throw badRequest("Vui lòng nhập họ tên hợp lệ.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw badRequest("Email chưa hợp lệ.");
  if (!/^[0-9+]{9,15}$/.test(phone)) throw badRequest("Số điện thoại chưa hợp lệ.");
  if (input.password.length < 8) throw badRequest("Mật khẩu phải có ít nhất 8 ký tự.");

  const db = getDb();
  if (await findRow(eq(customers.email, email))) throw badRequest("Email này đã được đăng ký.");
  if (await findRow(sql`lower(${customers.username}) = ${username}`)) throw badRequest("Tên đăng nhập đã được sử dụng.");

  const id = randomUUID();
  const { hash, salt } = await createPasswordHash(input.password);
  await db.insert(customers).values({
    id, username, name, email, phone,
    passwordHash: hash, passwordSalt: salt,
    provider: "password", emailVerified: true, profileCompleted: true,
    createdAt: Date.now(),
  });
  return (await findCustomerById(id))!;
}

export async function authenticateCustomer(identifierInput: string, password: string) {
  const identifier = identifierInput.trim().toLowerCase();
  const row = await findRow(or(sql`lower(${customers.username}) = ${identifier}`, eq(customers.email, normalizeEmail(identifier))));
  if (!row || !(await verifyPassword(password, row.passwordSalt, row.passwordHash))) {
    throw badRequest("Tên đăng nhập, email hoặc mật khẩu không đúng.");
  }
  return toCustomer(row);
}

export async function upsertGoogleCustomer(input: { googleSub: string; email: string; name: string; emailVerified: boolean }) {
  const email = normalizeEmail(input.email);
  if (!input.googleSub || !/^\S+@\S+\.\S+$/.test(email) || !input.emailVerified) {
    throw badRequest("Google chưa xác minh được địa chỉ email của tài khoản.");
  }
  const existing = (await findRow(eq(customers.googleSub, input.googleSub))) ?? (await findRow(eq(customers.email, email)));
  const db = getDb();
  if (existing) {
    const name = existing.name || cleanName(input.name);
    await db.update(customers).set({
      googleSub: input.googleSub,
      provider: "google",
      emailVerified: true,
      name,
      profileCompleted: Boolean(existing.phone && name),
    }).where(eq(customers.id, existing.id));
    return (await findCustomerById(existing.id))!;
  }
  const id = randomUUID();
  await db.insert(customers).values({
    id, name: cleanName(input.name), email, phone: "",
    passwordHash: "", passwordSalt: "",
    provider: "google", googleSub: input.googleSub,
    emailVerified: true, profileCompleted: false,
    createdAt: Date.now(),
  });
  return (await findCustomerById(id))!;
}

export async function updateCustomerProfile(customerId: string, input: { name: string; phone: string }) {
  const name = cleanName(input.name);
  const phone = input.phone.replace(/[\s().-]/g, "").trim();
  if (name.length < 2) throw badRequest("Vui lòng nhập họ tên hợp lệ.");
  if (!/^\+?[0-9]{9,15}$/.test(phone)) throw badRequest("Số điện thoại chưa hợp lệ.");
  await getDb().update(customers).set({ name, phone, profileCompleted: true }).where(eq(customers.id, customerId));
  return findCustomerById(customerId);
}

export async function updateCustomerAvatar(customerId: string, avatarUrl: string) {
  if (avatarUrl && !avatarUrl.startsWith(PUBLIC_IMAGE_PREFIX)) throw badRequest("Đường dẫn ảnh đại diện chưa hợp lệ.");
  await getDb().update(customers).set({ avatarUrl }).where(eq(customers.id, customerId));
  return findCustomerById(customerId);
}

export async function markCustomerVerified(customerId: string, channel: "email" | "sms") {
  await getDb().update(customers)
    .set(channel === "sms" ? { phoneVerified: true } : { emailVerified: true })
    .where(eq(customers.id, customerId));
  return findCustomerById(customerId);
}

export async function createVerificationSession(customer: Customer) {
  const channel = customer.verificationChannel;
  const destination = channel === "sms" ? customer.phone : customer.email;
  const token = randomToken();
  const now = Date.now();
  const db = getDb();
  await db.delete(customerVerificationSessions).where(eq(customerVerificationSessions.customerId, customer.id));
  await db.insert(customerVerificationSessions).values({
    id: randomUUID(), customerId: customer.id, tokenHash: hashToken(token),
    channel, destination, expiresAt: now + VERIFICATION_MS, createdAt: now,
  });
  return { token, channel, destination };
}

export async function verificationFromToken(token?: string) {
  if (!token) return undefined;
  const [row] = await getDb().select().from(customerVerificationSessions)
    .where(and(eq(customerVerificationSessions.tokenHash, hashToken(token)), gt(customerVerificationSessions.expiresAt, Date.now())))
    .limit(1);
  if (!row) return undefined;
  const customer = await findCustomerById(row.customerId);
  return customer
    ? { id: row.id, customer, channel: row.channel === "sms" ? "sms" as const : "email" as const, destination: row.destination }
    : undefined;
}

export async function deleteVerificationSession(id: string) {
  await getDb().delete(customerVerificationSessions).where(eq(customerVerificationSessions.id, id));
}

// ---- Quen mat khau: gui OTP -> xac minh -> dat mat khau moi ----

export async function customerForPasswordReset(identifierInput: string) {
  const identifier = identifierInput.trim().toLowerCase();
  if (identifier.length < 4 || identifier.length > 160) return undefined;
  const phone = identifier.replace(/[\s().-]/g, "");
  const row = await findRow(and(
    ne(customers.passwordHash, ""),
    or(sql`lower(${customers.username}) = ${identifier}`, eq(customers.email, normalizeEmail(identifier)), eq(customers.phone, phone)),
  ));
  return row ? toCustomer(row) : undefined;
}

export async function createPasswordResetSession(customer: Customer, channel: "email" | "sms") {
  const destination = channel === "sms" ? customer.phone : customer.email;
  const token = randomToken();
  const now = Date.now();
  await getDb().transaction(async (tx) => {
    await tx.delete(customerPasswordResetSessions).where(eq(customerPasswordResetSessions.customerId, customer.id));
    await tx.insert(customerPasswordResetSessions).values({
      id: randomUUID(), customerId: customer.id, tokenHash: hashToken(token), channel, destination,
      expiresAt: now + PASSWORD_RESET_MS, verifiedAt: 0, attempts: 0, createdAt: now,
    });
  });
  return { token, destination, channel };
}

export async function passwordResetFromToken(token?: string) {
  if (!token) return undefined;
  const [row] = await getDb().select().from(customerPasswordResetSessions).where(and(
    eq(customerPasswordResetSessions.tokenHash, hashToken(token)),
    gt(customerPasswordResetSessions.expiresAt, Date.now()),
    lt(customerPasswordResetSessions.attempts, MAX_RESET_ATTEMPTS),
  )).limit(1);
  if (!row) return undefined;
  const customer = await findCustomerById(row.customerId);
  return customer ? {
    id: row.id,
    customer,
    channel: row.channel === "sms" ? "sms" as const : "email" as const,
    destination: row.destination,
    verifiedAt: row.verifiedAt,
    attempts: row.attempts,
  } : undefined;
}

export async function recordPasswordResetAttempt(id: string) {
  await getDb().update(customerPasswordResetSessions)
    .set({ attempts: sql`${customerPasswordResetSessions.attempts} + 1` })
    .where(eq(customerPasswordResetSessions.id, id));
}

export async function markPasswordResetVerified(id: string) {
  await getDb().update(customerPasswordResetSessions).set({ verifiedAt: Date.now() }).where(eq(customerPasswordResetSessions.id, id));
}

/** Dat mat khau moi; dang xuat moi thiet bi cua khach va huy phien dat lai. */
export async function resetCustomerPassword(resetId: string, customerId: string, password: string) {
  if (password.length < 8 || password.length > 128) throw badRequest("Mật khẩu mới phải có từ 8 đến 128 ký tự.");
  const [pending] = await getDb().select({ id: customerPasswordResetSessions.id }).from(customerPasswordResetSessions).where(and(
    eq(customerPasswordResetSessions.id, resetId),
    eq(customerPasswordResetSessions.customerId, customerId),
    gt(customerPasswordResetSessions.verifiedAt, 0),
    gt(customerPasswordResetSessions.expiresAt, Date.now()),
  )).limit(1);
  if (!pending) throw badRequest("Phiên đổi mật khẩu không hợp lệ hoặc đã hết hạn.");
  const { hash, salt } = await createPasswordHash(password);
  await getDb().transaction(async (tx) => {
    await tx.update(customers).set({ passwordHash: hash, passwordSalt: salt }).where(eq(customers.id, customerId));
    await tx.delete(customerSessions).where(eq(customerSessions.customerId, customerId));
    await tx.delete(customerPasswordResetSessions).where(eq(customerPasswordResetSessions.customerId, customerId));
  });
  return findCustomerById(customerId);
}

export async function createCustomerSession(customerId: string) {
  const token = randomToken();
  const now = Date.now();
  await getDb().insert(customerSessions).values({
    id: randomUUID(), customerId, tokenHash: hashToken(token), expiresAt: now + SESSION_MS, createdAt: now,
  });
  return token;
}

export async function customerFromSession(token?: string) {
  if (!token) return undefined;
  const [row] = await getDb().select({ customer: customers }).from(customerSessions)
    .innerJoin(customers, eq(customers.id, customerSessions.customerId))
    .where(and(eq(customerSessions.tokenHash, hashToken(token)), gt(customerSessions.expiresAt, Date.now())))
    .limit(1);
  return row ? toCustomer(row.customer) : undefined;
}

export async function deleteCustomerSession(token?: string) {
  if (!token) return;
  await getDb().delete(customerSessions).where(eq(customerSessions.tokenHash, hashToken(token)));
}

export async function findCustomers(limit = 300) {
  const rows = await getDb().select().from(customers).orderBy(desc(customers.createdAt)).limit(limit);
  return rows.map(toCustomer);
}

export async function findCustomerById(id: string) {
  const row = await findRow(eq(customers.id, id));
  return row ? toCustomer(row) : undefined;
}

async function findRow(where: SQL | undefined) {
  const [row] = await getDb().select().from(customers).where(where).limit(1);
  return row;
}

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatarUrl,
    name: row.name,
    email: row.email,
    phone: row.phone,
    provider: row.provider === "google" ? "google" : "password",
    verified: row.emailVerified || row.phoneVerified || row.provider === "google",
    emailVerified: row.emailVerified,
    phoneVerified: row.phoneVerified,
    profileComplete: row.profileCompleted && Boolean(row.name && row.phone),
    verificationChannel: row.verificationChannel === "sms" ? "sms" : "email",
    createdAt: row.createdAt,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function cleanName(name: string) {
  return name.trim().replace(/\s+/g, " ").slice(0, 120);
}

import { createHash, pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

// Giu dung tham so cua ban cu (PBKDF2-SHA256, 120.000 vong, muoi hex 16 byte)
// de mat khau cua khach va nhan vien chuyen tu D1 sang van dang nhap duoc.
const PBKDF2_ITERATIONS = 120_000;

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export async function hashPassword(password: string, saltHex: string) {
  const key = await pbkdf2Async(password, Buffer.from(saltHex, "hex"), PBKDF2_ITERATIONS, 32, "sha256");
  return key.toString("hex");
}

export async function createPasswordHash(password: string) {
  const salt = randomToken(16);
  return { salt, hash: await hashPassword(password, salt) };
}

export async function verifyPassword(password: string, saltHex: string, expectedHash: string) {
  if (!saltHex || !expectedHash) return false;
  return safeEqual(await hashPassword(password, saltHex), expectedHash);
}

/** Bam token phien truoc khi luu, lo CSDL cung khong dung lai duoc cookie. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

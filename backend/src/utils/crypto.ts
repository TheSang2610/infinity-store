import { createHash, pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

// Hash mat khau PBKDF2-SHA256, muoi hex 16 byte (cot password_salt rieng).
// - Dang moi:  "v2$<so vong>$<hex>"  (ghi phien ban + so vong de sau nay tang ma khong lam ai mat dang nhap).
// - Dang cu:   "<hex>" tran, 120.000 vong: mat khau chuyen tu ban D1 / tao truoc 18/10/2026. Van dang nhap
//   duoc; dang nhap dung la bam lai sang dang moi (xem passwordNeedsRehash).
const LEGACY_ITERATIONS = 120_000;
/** Muc OWASP khuyen nghi cho PBKDF2-SHA256. */
export const PASSWORD_ITERATIONS = 600_000;
const VERSION = "v2";

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

async function derive(password: string, saltHex: string, iterations: number) {
  const key = await pbkdf2Async(password, Buffer.from(saltHex, "hex"), iterations, 32, "sha256");
  return key.toString("hex");
}

/** Tach hash da luu thanh so vong + phan hex; undefined neu sai dinh dang. */
function parseStoredHash(stored: string) {
  if (/^[0-9a-f]{64}$/i.test(stored)) return { iterations: LEGACY_ITERATIONS, hex: stored, versioned: false };
  const match = /^v2\$(\d{5,7})\$([0-9a-f]{64})$/i.exec(stored);
  if (!match) return undefined;
  return { iterations: Number(match[1]), hex: match[2], versioned: true };
}

export async function hashPassword(password: string, saltHex: string, iterations = PASSWORD_ITERATIONS) {
  return `${VERSION}$${iterations}$${await derive(password, saltHex, iterations)}`;
}

export async function createPasswordHash(password: string) {
  const salt = randomToken(16);
  return { salt, hash: await hashPassword(password, salt) };
}

export async function verifyPassword(password: string, saltHex: string, storedHash: string) {
  const parsed = parseStoredHash(storedHash);
  if (!saltHex || !parsed) return false;
  return safeEqual(await derive(password, saltHex, parsed.iterations), parsed.hex.toLowerCase());
}

/** Hash dang cu hoac it vong hon muc hien tai: nen bam lai ngay sau khi dang nhap dung. */
export function passwordNeedsRehash(storedHash: string) {
  const parsed = parseStoredHash(storedHash);
  return !parsed || !parsed.versioned || parsed.iterations < PASSWORD_ITERATIONS;
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

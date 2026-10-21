import { lt, sql } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { getDb } from "../db/client";
import { rateLimitBuckets } from "../db/schema";
import { HttpError } from "../utils/http";

// Chuyen tu worker/api-security.ts cua ban Cloudflare:
// - chan request ghi (POST/PUT/PATCH/DELETE) den tu trang web khac (chong CSRF),
// - gioi han tan suat theo IP (dang nhap/OTP 5 lan/15 phut, API thuong 60-180 lan/phut).
// Dang nhap / OTP dem trong CSDL (bang rate_limit_buckets) de moi may chu Vercel thay cung mot con so;
// API thuong dem trong bo nho tung may chu, du chan spam co ban.

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const AUTH_PATHS = new Set([
  "/api/account/login", "/api/account/register", "/api/account/google/start", "/api/account/google/callback",
  "/api/account/password/forgot", "/api/account/password/reset", "/api/account/password/verify",
  "/api/account/verification/resend", "/api/account/verification/check", "/api/admin/session",
]);
/** Webhook ngan hang xac thuc bang secret rieng, khong qua kiem tra origin. */
const ORIGIN_EXEMPT = new Set(["/api/payments/casso"]);

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  // Du lieu theo phien dang nhap: khong cho proxy / trinh duyet luu lai. Route nao can cache tu dat lai sau.
  if (req.path.startsWith("/api/account/") || req.path.startsWith("/api/admin/")) res.set("Cache-Control", "no-store");
  next();
}

/** Trinh duyet gui kem Origin/Sec-Fetch-Site; request ghi tu ten mien la thi tu choi. */
export function sameOriginWrites(req: Request, _res: Response, next: NextFunction) {
  if (!MUTATING.has(req.method) || ORIGIN_EXEMPT.has(fullPath(req))) return next();
  const site = req.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") throw new HttpError(403, "Yêu cầu không hợp lệ.");
  const origin = req.get("origin");
  if (origin && !allowedOrigins().includes(origin)) throw new HttpError(403, "Yêu cầu không hợp lệ.");
  next();
}

function allowedOrigins() {
  return [new URL(env.frontendUrl).origin, ...env.passkeyOrigins.map((item) => new URL(item).origin)];
}

const buckets = new Map<string, { count: number; resetAt: number }>();

type Hit = { count: number; resetAt: number };

/** Dem trong bo nho may chu nay. */
function hitMemory(key: string, windowMs: number, now: number): Hit {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    if (buckets.size > 50_000) pruneBuckets(now);
    return fresh;
  }
  bucket.count += 1;
  return bucket;
}

/**
 * Dem trong CSDL: moi may chu Vercel thay cung mot con so. Mot cau lenh upsert nen hai request
 * cung luc khong dem trung. CSDL loi thi lui ve dem trong bo nho, khong chan nham ca trang dang nhap.
 */
async function hitShared(key: string, windowMs: number, now: number): Promise<Hit> {
  try {
    const resetAt = now + windowMs;
    const [row] = await getDb()
      .insert(rateLimitBuckets)
      .values({ key, count: 1, resetAt })
      .onConflictDoUpdate({
        target: rateLimitBuckets.key,
        set: {
          count: sql`case when ${rateLimitBuckets.resetAt} <= ${now} then 1 else ${rateLimitBuckets.count} + 1 end`,
          resetAt: sql`case when ${rateLimitBuckets.resetAt} <= ${now} then ${resetAt} else ${rateLimitBuckets.resetAt} end`,
        },
      })
      .returning({ count: rateLimitBuckets.count, resetAt: rateLimitBuckets.resetAt });
    // Don dong het han thinh thoang, khong can job rieng.
    if (Math.random() < 0.02) await getDb().delete(rateLimitBuckets).where(lt(rateLimitBuckets.resetAt, now)).catch(() => undefined);
    return row;
  } catch {
    return hitMemory(key, windowMs, now);
  }
}

export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  const pathname = fullPath(req);
  // Camera goi /api/face/detect lien tuc de ve khung mat (chi quan ly dung) nen khong gioi han.
  // Cham cong / dang ky / xac minh van theo gioi han thuong: may chu khuon mat da bo gioi han cho backend.
  if (pathname === "/api/face/detect") return next();
  // DELETE /api/admin/session la dang xuat: khong tinh vao luot dang nhap 5 lan/15 phut.
  const isAuth = AUTH_PATHS.has(pathname) && req.method !== "DELETE";
  const policy = isAuth
    ? { limit: 5, windowMs: 15 * 60 * 1000, scope: `auth:${pathname}` }
    : pathname === "/api/payments/casso"
      ? { limit: 120, windowMs: 60 * 1000, scope: "webhook" }
      : { limit: MUTATING.has(req.method) ? 60 : 180, windowMs: 60 * 1000, scope: `api:${req.method}` };
  const key = `${policy.scope}:${clientIp(req)}`;
  const now = Date.now();
  // Chi dang nhap / OTP dem trong CSDL (de do mat khau la thu can chan that chat); API thuong dem
  // trong bo nho de khong them mot truy van CSDL vao moi request.
  const bucket = isAuth ? await hitShared(key, policy.windowMs, now) : hitMemory(key, policy.windowMs, now);
  if (bucket.count > policy.limit) {
    res.set("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
    throw new HttpError(429, "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.");
  }
  next();
}

/**
 * IP that cua khach. Frontend goi backend tu may chu Next (server component, server action)
 * nen IP nhin thay la IP cua frontend; frontend gui kem IP khach trong x-client-ip va khoa
 * INTERNAL_API_SECRET de backend biet tin duoc. Khong co khoa thi dung IP ket noi.
 */
export function clientIp(req: Request) {
  const secret = env.internalApiSecret;
  if (secret && req.get("x-internal-key") === secret && req.get("x-client-ip")) return String(req.get("x-client-ip"));
  return req.ip || req.socket.remoteAddress || "unknown";
}

function pruneBuckets(now: number) {
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_JSON_DEPTH = 8;
const MAX_JSON_KEYS = 200;

/**
 * Tu choi JSON lon nhon hoac nguy hiem (khoa __proto__, long qua sau, qua nhieu truong)
 * - ban Cloudflare cu kiem o worker truoc khi vao ung dung.
 */
export function safeJsonBody(req: Request, _res: Response, next: NextFunction) {
  if (!req.body || typeof req.body !== "object") return next();
  let keys = 0;
  const visit = (value: unknown, depth: number): void => {
    if (!value || typeof value !== "object") return;
    if (depth > MAX_JSON_DEPTH) throw new HttpError(400, "Dữ liệu gửi lên lồng quá sâu.");
    for (const key of Object.keys(value)) {
      if (FORBIDDEN_KEYS.has(key)) throw new HttpError(400, "Dữ liệu gửi lên không hợp lệ.");
      if (++keys > MAX_JSON_KEYS) throw new HttpError(400, "Dữ liệu gửi lên có quá nhiều trường.");
      visit((value as Record<string, unknown>)[key], depth + 1);
    }
  };
  visit(req.body, 0);
  next();
}

/** Duong dan day du: middleware gan duoi "/api" thi req.path khong con tien to "/api". */
function fullPath(req: Request) {
  return `${req.baseUrl}${req.path}`;
}

/** Chi dung trong test. */
/** Cho test: xoa ca bo dem trong bo nho lan trong CSDL. */
export async function resetRateLimits() {
  buckets.clear();
  await Promise.resolve().then(() => getDb().delete(rateLimitBuckets)).catch(() => undefined);
}

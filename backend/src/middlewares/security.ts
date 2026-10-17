import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { HttpError } from "../utils/http";

// Chuyen tu worker/api-security.ts cua ban Cloudflare:
// - chan request ghi (POST/PUT/PATCH/DELETE) den tu trang web khac (chong CSRF),
// - gioi han tan suat theo IP (dang nhap/OTP 5 lan/15 phut, API thuong 60-180 lan/phut).
// Bo dem nam trong bo nho tung may chu: tren Vercel moi instance dem rieng, du chan spam
// co ban; can chat hon thi chuyen bo dem sang Postgres hoac Redis.

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
  if (req.path.startsWith("/api/account/")) res.set("Cache-Control", "no-store");
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

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const pathname = fullPath(req);
  // Camera goi /api/face/detect lien tuc de ve khung mat (chi quan ly dung) nen khong gioi han.
  // Cham cong / dang ky / xac minh van theo gioi han thuong: may chu khuon mat da bo gioi han cho backend.
  if (pathname === "/api/face/detect") return next();
  // DELETE /api/admin/session la dang xuat: khong tinh vao luot dang nhap 5 lan/15 phut.
  const policy = AUTH_PATHS.has(pathname) && req.method !== "DELETE"
    ? { limit: 5, windowMs: 15 * 60 * 1000, scope: `auth:${pathname}` }
    : pathname === "/api/payments/casso"
      ? { limit: 120, windowMs: 60 * 1000, scope: "webhook" }
      : { limit: MUTATING.has(req.method) ? 60 : 180, windowMs: 60 * 1000, scope: `api:${req.method}` };
  const client = clientIp(req);
  const key = `${policy.scope}:${client}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + policy.windowMs });
    if (buckets.size > 50_000) pruneBuckets(now);
    return next();
  }
  bucket.count += 1;
  if (bucket.count > policy.limit) {
    res.set("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
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
export function resetRateLimits() {
  buckets.clear();
}

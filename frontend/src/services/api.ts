import "server-only";
import { cookies, headers } from "next/headers";

// Goi backend tu phia may chu Next (server component, server action).
// Trinh duyet thi goi thang "/api/..." - next.config.ts chuyen tiep sang backend.

const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET ?? "";
if (!INTERNAL_API_SECRET && process.env.NODE_ENV === "production") {
  console.error("Thiếu INTERNAL_API_SECRET: backend sẽ tính mọi khách chung một IP và chặn nhầm vì quá tần suất.");
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Object thi gui JSON, FormData thi gui multipart nguyen ven. */
  body?: unknown;
};

/** Goi API kem cookie cua nguoi dang xem trang; loi tra ve thanh ApiError co thong diep tieng Viet. */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  return readJson<T>(await send(path, options));
}

/** Nhu api() nhung chuyen cookie backend dat (dang nhap/dang xuat) ve trinh duyet. Chi dung trong server action. */
export async function apiWithCookies<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await send(path, options);
  const store = await cookies();
  for (const header of response.headers.getSetCookie()) {
    const parsed = parseSetCookie(header);
    if (parsed) store.set(parsed.name, parsed.value, parsed.options);
  }
  return readJson<T>(response);
}

/** Doc tep nhi phan (anh ho so, file cong viec) - tra nguyen Response de chuyen tiep. */
export async function apiRaw(path: string) {
  return send(path, {});
}

/** 404 thi tra undefined thay vi nem loi (trang chi tiet goi notFound()). */
export async function orUndefined<T>(load: () => Promise<T>) {
  try {
    return await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

async function send(path: string, { method = "GET", body }: ApiOptions) {
  const [store, incoming] = await Promise.all([cookies(), headers()]);
  const requestHeaders: Record<string, string> = { cookie: store.toString() };
  // Backend gioi han tan suat theo IP khach, khong phai IP may chu frontend.
  // Lay phan tu CUOI cua X-Forwarded-For (do proxy truoc Next them vao); phan tu dau khach tu dat duoc.
  const clientIp = incoming.get("x-real-ip") || incoming.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "";
  if (INTERNAL_API_SECRET && clientIp) {
    requestHeaders["x-internal-key"] = INTERNAL_API_SECRET;
    requestHeaders["x-client-ip"] = clientIp;
  }
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    requestHeaders["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }
  return fetch(`${BACKEND_URL}/api${path}`, { method, headers: requestHeaders, body: payload, cache: "no-store" });
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) throw new ApiError(response.status, data.message ?? "Máy chủ không phản hồi.");
  return data;
}

function parseSetCookie(header: string) {
  const [pair, ...attributes] = header.split(";").map((part) => part.trim());
  const separator = pair.indexOf("=");
  if (separator <= 0) return undefined;
  const options: { httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none"; path?: string; maxAge?: number; expires?: Date } = {};
  for (const attribute of attributes) {
    const [rawKey, ...rest] = attribute.split("=");
    const key = rawKey.toLowerCase();
    const value = rest.join("=");
    if (key === "httponly") options.httpOnly = true;
    else if (key === "secure") options.secure = true;
    else if (key === "samesite") options.sameSite = value.toLowerCase() as "lax" | "strict" | "none";
    else if (key === "path") options.path = value;
    else if (key === "max-age") options.maxAge = Number(value);
    else if (key === "expires") options.expires = new Date(value);
  }
  return { name: pair.slice(0, separator), value: decodeURIComponent(pair.slice(separator + 1)), options };
}

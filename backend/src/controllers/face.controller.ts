import type { Request, Response } from "express";
import { env } from "../config/env";
import { badRequest, forbidden, HttpError, notFound, text } from "../utils/http";
import { canManageEmployee } from "../middlewares/auth";
import type { AdminUser } from "../types";
import { getAdminUserById, getAdminUsers } from "../repositories/admin-user.repository";
import { employeeCheck } from "../repositories/hr.repository";
import { ensureFaceServer } from "../services/face-launcher.service";


const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };


const TIMEOUT_MS = 120_000;


const MAX_IMAGE_CHARS = 4_000_000;



type FacePayload = { employee_id: string; image_base64: string };


type VerifyResult = { verified?: boolean; confidence?: number; distance?: number; message?: string; facial_area?: Record<string, number> };



async function faceBackend<T = Record<string, unknown>>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!env.faceApiUrl || !env.faceApiKey) {
    throw new HttpError(503, "Chấm công bằng khuôn mặt đang tạm tắt. Vui lòng nhờ quản lý chấm công thủ công.");
  }
  await ensureFaceServer();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${env.faceApiUrl.replace(/\/+$/, "")}${path}`, {
      method: init.method ?? "GET",
      headers: { "Content-Type": "application/json", "X-API-Key": env.faceApiKey },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new HttpError(response.status, await faceErrorMessage(response.status, data));
    return data as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new HttpError(504, "DeepFace xử lý quá thời gian cho phép.");
    throw new HttpError(502, "Không kết nối được máy chủ nhận diện khuôn mặt.");
  } finally {
    clearTimeout(timeout);
  }
}



/** Loi tu DeepFace; khuon mat trung (409 + duplicate_of) thi noi ro dang thuoc tai khoan nao. */
async function faceErrorMessage(status: number, data: Record<string, unknown>) {
  const fallback = String(data.detail || data.message || "DeepFace không thể xử lý yêu cầu.");
  if (status !== 409 || typeof data.duplicate_of !== "string") return fallback;
  const owner = await getAdminUserById(data.duplicate_of);
  return owner
    ? `Khuôn mặt này đã được đăng ký cho tài khoản ${owner.name} (${owner.username}). Mỗi người chỉ được gắn khuôn mặt với một tài khoản.`
    : fallback;
}

function readPayload(body: Record<string, unknown> | undefined, employeeIdOverride?: string): FacePayload {
  const employeeId = employeeIdOverride ?? text(body?.employee_id, 100);
  if (!employeeId || /[\u0000-\u001f\u007f]/.test(employeeId)) throw badRequest("Mã nhân viên không hợp lệ.");
  const image = typeof body?.image_base64 === "string" ? body.image_base64 : "";
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(image) || image.length < 200) throw badRequest("Ảnh khuôn mặt không hợp lệ.");
  if (image.length > MAX_IMAGE_CHARS) throw new HttpError(413, "Một ảnh khuôn mặt vượt quá dung lượng cho phép.");
  return { employee_id: employeeId, image_base64: image };
}



/** Quan ly chi thao tac khuon mat nhan vien chi nhanh minh; Giam doc thao tac tat ca. */
async function managedEmployee(manager: AdminUser, employeeId: string) {
  const employee = await getAdminUserById(employeeId);
  if (!employee) throw notFound("Không tìm thấy nhân viên trong hệ thống.");
  if (!canManageEmployee(manager, employee)) throw forbidden("Bạn không được quản lý khuôn mặt nhân viên ngoài chi nhánh của mình.");
  return employee;
}



/** Thu nhan dien / dang ky / xac minh: chuyen nguyen yeu cau sang DeepFace sau khi kiem quyen. */
async function proxyFaceAction(action: "detect" | "enroll" | "verify", req: Request, res: Response) {
  const payload = readPayload(req.body);
  await managedEmployee(req.admin!, payload.employee_id);
  res.set(NO_STORE).json(await faceBackend(`/${action}`, { method: "POST", body: payload }));
}

export async function getAttendanceRegistration(req: Request, res: Response) {
  const result = await faceBackend<{ employees?: Array<{ employee_id: string }> }>("/employees");
  res.set(NO_STORE).json({ registered: (result.employees ?? []).some((employee) => employee.employee_id === req.admin!.id) });
}

export async function checkInWithFace(req: Request, res: Response) {
  const user = req.admin!;
  const mode = req.body?.mode === "in" ? "in" : req.body?.mode === "out" ? "out" : "";
  if (!mode) throw badRequest("Loại chấm công không hợp lệ.");
  const result = await faceBackend<VerifyResult>("/verify", { method: "POST", body: readPayload(req.body, user.id) });
  if (!result.verified) {
    res.status(401).set(NO_STORE).json({ ok: false, verified: false, message: result.message || "Khuôn mặt không trùng khớp.", facial_area: result.facial_area });
    return;
  }
  try {
    await employeeCheck(user.id, mode, `${user.name} · DeepFace`);
  } catch (error) {
    throw new HttpError(409, error instanceof Error ? error.message : "Không thể ghi nhận chấm công.");
  }
  res.set(NO_STORE).json({
    ok: true, verified: true, status: mode === "in" ? "checked-in" : "checked-out",
    confidence: result.confidence, distance: result.distance, facial_area: result.facial_area,
  });
}

export async function listEnrolledEmployees(req: Request, res: Response) {
  const manager = req.admin!;
  const allowed = new Set((await getAdminUsers()).filter((employee) => canManageEmployee(manager, employee)).map((employee) => employee.id));
  const result = await faceBackend<{ employees?: Array<{ employee_id: string }> }>("/employees");
  res.set(NO_STORE).json({ ...result, employees: (result.employees ?? []).filter((employee) => allowed.has(employee.employee_id)) });
}

export async function removeEnrolledEmployee(req: Request, res: Response) {
  const employee = await managedEmployee(req.admin!, String(req.params.employeeId));
  res.set(NO_STORE).json(await faceBackend(`/employees/${encodeURIComponent(employee.id)}`, { method: "DELETE" }));
}

export function detectFace(req: Request, res: Response) {
  return proxyFaceAction("detect", req, res);
}

export function enrollFace(req: Request, res: Response) {
  return proxyFaceAction("enroll", req, res);
}

export function verifyFace(req: Request, res: Response) {
  return proxyFaceAction("verify", req, res);
}

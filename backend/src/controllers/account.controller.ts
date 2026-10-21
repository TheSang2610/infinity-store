import type { Request, Response } from "express";
import { randomBytes, randomUUID } from "node:crypto";
import { env } from "../config/env";
import { badRequest, notFound, text } from "../utils/http";
import {
  ADMIN_COOKIE, clearCookie, CUSTOMER_COOKIE, CUSTOMER_PASSWORD_RESET_COOKIE, CUSTOMER_VERIFICATION_COOKIE,
  clearLegacyCookie, GOOGLE_RETURN_TO_COOKIE, GOOGLE_STATE_COOKIE, readCookie, sessionCookie, shortCookie,
} from "../middlewares/auth";
import { deleteAdminSession } from "../repositories/admin-user.repository";
import { getCustomerOrderById, getCustomerOrders } from "../repositories/order.repository";
import {
  getStudentVerificationForCustomer, submitStudentVerification,
} from "../repositories/student-verification.repository";
import { deleteFile, deleteImage, detectImageType, isPdf, putFile, saveImage } from "../services/file-storage.service";
import * as customers from "../repositories/customer.repository";
import { getCart, saveCart } from "../repositories/cart.repository";
import {
  checkOtpVerification, fetchGoogleProfile, googleOAuthConfig, startOtpVerification,
} from "../services/identity-provider.service";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

/** Dang nhap khach thi dang xuat tai khoan nhan vien tren cung trinh duyet (giong ban cu). */
async function signInCustomer(res: Response, customerId: string, adminToken?: string) {
  if (adminToken) await deleteAdminSession(adminToken).catch(() => undefined);
  clearCookie(res, ADMIN_COOKIE);
  res.cookie(CUSTOMER_COOKIE, await customers.createCustomerSession(customerId), sessionCookie());
  clearLegacyCookie(res, CUSTOMER_COOKIE);
}

// ---- Quen mat khau: forgot -> verify -> reset ----

const RESET_SENT = "Nếu thông tin khớp với tài khoản, mã xác minh đã được gửi qua email hoặc SMS.";

// ---- Xac minh hoc sinh sinh vien ----

const STUDENT_DOCUMENT_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

function publicVerification(verification: NonNullable<Awaited<ReturnType<typeof getStudentVerificationForCustomer>>>) {
  const { id, school, studentCode, graduationYear, faculty, documentName, status, reviewNote, reviewedByName, createdAt, updatedAt, reviewedAt } = verification;
  return { id, school, studentCode, graduationYear, faculty, documentName, status, reviewNote, reviewedByName, createdAt, updatedAt, reviewedAt };
}

function googleCallbackUrl() {
  return `${env.frontendUrl}/api/account/google/callback`;
}

function safeReturnTo(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/api/") ? value : "/member";
}

export function getCurrentCustomer(req: Request, res: Response) {
  res.set(NO_STORE).json({ customer: req.customer ?? null });
}

export async function register(req: Request, res: Response) {
  const customer = await customers.registerCustomer({
    username: text(req.body?.username),
    name: text(req.body?.name),
    email: text(req.body?.email),
    phone: text(req.body?.phone),
    password: typeof req.body?.password === "string" ? req.body.password : "",
  });
  await signInCustomer(res, customer.id, req.cookies?.[ADMIN_COOKIE]);
  res.json({ ok: true, customer });
}

export async function login(req: Request, res: Response) {
  const identifier = text(req.body?.identifier) || text(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const customer = await customers.authenticateCustomer(identifier, password);
  await signInCustomer(res, customer.id, req.cookies?.[ADMIN_COOKIE]);
  res.json({ ok: true, customer });
}

export async function logout(req: Request, res: Response) {
  await customers.deleteCustomerSession(readCookie(req, CUSTOMER_COOKIE));
  for (const name of [CUSTOMER_COOKIE, CUSTOMER_VERIFICATION_COOKIE, CUSTOMER_PASSWORD_RESET_COOKIE, GOOGLE_RETURN_TO_COOKIE]) clearCookie(res, name);
  res.json({ ok: true });
}

export async function updateProfile(req: Request, res: Response) {
  const customer = await customers.updateCustomerProfile(req.customer!.id, { name: text(req.body?.name), phone: text(req.body?.phone) });
  res.json({ ok: true, customer });
}

export async function listPurchases(req: Request, res: Response) {
  const orders = await getCustomerOrders(req.customer!.id);
  res.set(NO_STORE).json({
    purchases: orders.map((order) => ({
      id: order.id,
      orderCode: order.orderCode,
      productName: order.productName,
      items: order.items.map(({ productSlug, productName, ram, storage, color, quantity, unitPrice, image }) => ({
        productSlug, productName, ram, storage, color, quantity, unitPrice, image,
      })),
      quantity: order.quantity,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      invoiceStatus: order.invoiceStatus,
      invoiceNumber: order.invoiceNumber,
      invoiceDate: order.invoiceDate,
      warrantyMonths: order.warrantyMonths,
      warrantyStartDate: order.warrantyStartDate,
      warrantySerials: order.warrantySerials,
      warrantyPolicy: order.warrantyPolicy,
      branchName: order.branchName,
      createdAt: order.createdAt,
    })),
  });
}

export async function getOwnOrder(req: Request, res: Response) {
  const order = await getCustomerOrderById(String(req.params.id), req.customer!.id);
  if (!order) throw notFound("Không tìm thấy đơn hàng.");
  res.set(NO_STORE).json({ order });
}

export async function uploadAvatar(req: Request, res: Response) {
  if (!req.file?.size) throw badRequest("Vui lòng chọn ảnh đại diện.");
  const url = await saveImage(req.file.buffer, {
    prefix: `avatar-${req.customer!.id}-`,
    allowed: ["image/jpeg", "image/png", "image/webp"],
    label: "Ảnh đại diện",
  });
  const customer = await customers.updateCustomerAvatar(req.customer!.id, url);
  await deleteImage(req.customer!.avatarUrl);
  res.json({ ok: true, customer });
}

export async function removeAvatar(req: Request, res: Response) {
  await deleteImage(req.customer!.avatarUrl);
  res.json({ ok: true, customer: await customers.updateCustomerAvatar(req.customer!.id, "") });
}

export function startGoogleLogin(req: Request, res: Response) {
  try {
    const config = googleOAuthConfig(googleCallbackUrl());
    const state = randomBytes(24).toString("hex");
    res.cookie(GOOGLE_STATE_COOKIE, state, shortCookie());
    res.cookie(GOOGLE_RETURN_TO_COOKIE, safeReturnTo(text(req.query.returnTo)), shortCookie());
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");
    res.redirect(url.toString());
  } catch {
    res.redirect(`${env.frontendUrl}/member?error=google-config`);
  }
}

export async function finishGoogleLogin(req: Request, res: Response) {
  const expectedState = readCookie(req, GOOGLE_STATE_COOKIE) ?? "";
  const returnTo = safeReturnTo(readCookie(req, GOOGLE_RETURN_TO_COOKIE) ?? "");
  clearCookie(res, GOOGLE_STATE_COOKIE);
  clearCookie(res, GOOGLE_RETURN_TO_COOKIE);
  try {
    const code = text(req.query.code, 2000);
    const state = text(req.query.state);
    if (!code || !state || state !== expectedState) throw badRequest("Google OAuth state không hợp lệ.");
    const profile = await fetchGoogleProfile(code, googleOAuthConfig(googleCallbackUrl()));
    const customer = await customers.upsertGoogleCustomer({
      googleSub: profile.sub || "", email: profile.email || "", name: profile.name || "", emailVerified: profile.email_verified === true,
    });
    await signInCustomer(res, customer.id, req.cookies?.[ADMIN_COOKIE]);
    const destination = customer.profileComplete ? returnTo : `/member?complete=1&returnTo=${encodeURIComponent(returnTo)}`;
    res.redirect(`${env.frontendUrl}${destination}`);
  } catch {
    res.redirect(`${env.frontendUrl}/member?error=google`);
  }
}

export async function checkVerificationCode(req: Request, res: Response) {
  const code = text(req.body?.code).replace(/\D/g, "");
  if (!/^\d{4,10}$/.test(code)) throw badRequest("Mã xác minh chưa hợp lệ.");
  const pending = await customers.verificationFromToken(readCookie(req, CUSTOMER_VERIFICATION_COOKIE));
  if (!pending) throw badRequest("Phiên xác minh đã hết hạn. Vui lòng đăng nhập lại.");
  if (!(await checkOtpVerification(pending.destination, code))) throw badRequest("Mã xác minh không đúng hoặc đã hết hạn.");
  const customer = await customers.markCustomerVerified(pending.customer.id, pending.channel);
  if (!customer) throw badRequest("Không tìm thấy tài khoản cần xác minh.");
  await customers.deleteVerificationSession(pending.id);
  clearCookie(res, CUSTOMER_VERIFICATION_COOKIE);
  await signInCustomer(res, customer.id, req.cookies?.[ADMIN_COOKIE]);
  res.json({ ok: true, customer });
}

export async function resendVerificationCode(req: Request, res: Response) {
  const pending = await customers.verificationFromToken(readCookie(req, CUSTOMER_VERIFICATION_COOKIE));
  if (!pending) throw badRequest("Phiên xác minh đã hết hạn. Vui lòng đăng nhập lại.");
  await startOtpVerification(pending.destination, pending.channel);
  res.json({ ok: true });
}

export async function requestPasswordReset(req: Request, res: Response) {
  const identifier = text(req.body?.identifier, 200);
  if (identifier.length < 4 || identifier.length > 160) throw badRequest("Vui lòng nhập tên đăng nhập, email hoặc số điện thoại hợp lệ.");
  const customer = await customers.customerForPasswordReset(identifier);
  // Khong tiet lo tai khoan co ton tai hay khong.
  if (!customer) {
    clearCookie(res, CUSTOMER_PASSWORD_RESET_COOKIE);
    res.set(NO_STORE).json({ ok: true, message: RESET_SENT });
    return;
  }
  const channel = identifier.replace(/[\s().-]/g, "") === customer.phone.replace(/[\s().-]/g, "") ? "sms" : "email";
  await startOtpVerification(channel === "sms" ? customer.phone : customer.email, channel);
  const reset = await customers.createPasswordResetSession(customer, channel);
  res.cookie(CUSTOMER_PASSWORD_RESET_COOKIE, reset.token, shortCookie(15 * 60 * 1000));
  res.set(NO_STORE).json({ ok: true, message: RESET_SENT });
}

export async function verifyPasswordResetCode(req: Request, res: Response) {
  const code = text(req.body?.code).replace(/\D/g, "");
  if (!/^\d{4,10}$/.test(code)) throw badRequest("Mã xác minh chưa hợp lệ.");
  const pending = await customers.passwordResetFromToken(readCookie(req, CUSTOMER_PASSWORD_RESET_COOKIE));
  if (!pending) throw badRequest("Phiên khôi phục đã hết hạn. Vui lòng yêu cầu mã mới.");
  if (!(await checkOtpVerification(pending.destination, code))) {
    await customers.recordPasswordResetAttempt(pending.id);
    throw badRequest("Mã xác minh không đúng hoặc đã hết hạn.");
  }
  await customers.markPasswordResetVerified(pending.id);
  res.set(NO_STORE).json({ ok: true, message: "Mã xác minh chính xác. Bạn có thể đặt mật khẩu mới." });
}

export async function resetPassword(req: Request, res: Response) {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (password !== (typeof req.body?.confirmPassword === "string" ? req.body.confirmPassword : "")) {
    throw badRequest("Hai lần nhập mật khẩu mới chưa trùng nhau.");
  }
  const pending = await customers.passwordResetFromToken(readCookie(req, CUSTOMER_PASSWORD_RESET_COOKIE));
  if (!pending?.verifiedAt) throw badRequest("Bạn cần xác minh mã trước khi đổi mật khẩu.");
  const customer = await customers.resetCustomerPassword(pending.id, pending.customer.id, password);
  if (!customer) throw badRequest("Không tìm thấy tài khoản cần khôi phục.");
  clearCookie(res, CUSTOMER_PASSWORD_RESET_COOKIE);
  await signInCustomer(res, customer.id, req.cookies?.[ADMIN_COOKIE]);
  res.set(NO_STORE).json({ ok: true, customer, message: "Mật khẩu đã được cập nhật." });
}

export async function getStudentVerification(req: Request, res: Response) {
  const verification = await getStudentVerificationForCustomer(req.customer!.id);
  res.set({ ...NO_STORE, Vary: "Cookie" }).json({ ok: true, verification: verification ? publicVerification(verification) : null });
}

export async function requestStudentDiscount(req: Request, res: Response) {
  const customer = req.customer!;
  const field = (key: string) => text(req.body?.[key]).replace(/\s+/g, " ");
  const school = field("school");
  const studentCode = field("studentCode");
  const graduationYear = field("graduationYear");
  if (school.length < 2 || school.length > 180) throw badRequest("Vui lòng nhập tên trường hợp lệ.");
  if (studentCode.length < 2 || studentCode.length > 80) throw badRequest("Vui lòng nhập mã sinh viên hoặc mã giảng viên hợp lệ.");
  if (graduationYear && !/^(19|20)\d{2}$/.test(graduationYear)) throw badRequest("Năm tốt nghiệp dự kiến chưa hợp lệ.");
  if (!req.file?.size) throw badRequest("Vui lòng tải ảnh thẻ hoặc PDF xác minh.");

  // Kiem loai tep bang noi dung that, khong tin ten/Content-Type.
  const bytes = req.file.buffer;
  const detected = isPdf(bytes) ? "application/pdf" : detectImageType(bytes);
  const extension = STUDENT_DOCUMENT_TYPES[detected];
  if (!extension || detected !== req.file.mimetype) throw badRequest("Hồ sơ phải là ảnh JPG, PNG, WebP hoặc PDF đúng định dạng.");

  const current = await getStudentVerificationForCustomer(customer.id);
  const key = `student-verifications/${customer.id}/${randomUUID()}.${extension}`;
  await putFile(key, bytes, detected);
  try {
    const verification = await submitStudentVerification({
      customerId: customer.id, school, studentCode, graduationYear, faculty: field("faculty"),
      documentKey: key, documentName: req.file.originalname, documentType: detected,
    });
    if (current?.documentKey && current.documentKey !== key) await deleteFile(current.documentKey);
    res.json({ ok: true, verification: verification ? publicVerification(verification) : null, message: "Hồ sơ đã được gửi và đang chờ nhân viên xét duyệt." });
  } catch (error) {
    await deleteFile(key);
    throw error;
  }
}

/** Gio hang cua khach dang dang nhap (dang nhap may nao cung thay). */
export async function getOwnCart(req: Request, res: Response) {
  res.set(NO_STORE).json({ items: await getCart(req.customer!.id) });
}

export async function replaceOwnCart(req: Request, res: Response) {
  res.set(NO_STORE).json({ items: await saveCart(req.customer!.id, req.body?.items) });
}

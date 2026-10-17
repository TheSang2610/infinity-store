import type { Request, Response } from "express";
import QRCode from "qrcode";
import { QRPay } from "vietnam-qr-pay";
import { env } from "../config/env";
import { safeEqual } from "../utils/crypto";
import { badRequest, HttpError, text } from "../utils/http";
import { productUnitPrice } from "../utils/order-pricing";
import { BANK_TRANSFER_PREFIX, MOMO_PREFIX } from "../constants/payment";
import { getOrderPaymentByCode, recordBankPayment } from "../repositories/order.repository";
import { bankBin, getStoreSettings, momoReceiveLink } from "../services/store-settings.service";
import { getPublicProducts } from "../services/product.service";
import { validateVoucher } from "../repositories/voucher.repository";

const QR_LIFETIME_MS = 10 * 60 * 1000;

const MAX_AMOUNT = 2_000_000_000;

/** QR chi co hieu luc 10 phut; han do trinh duyet gui len nhung khong duoc dai qua 10 phut. */
function assertQrRequest(orderCode: string, expiresAt: number, now: number) {
  if (!/^[A-Z0-9-]{6,25}$/.test(orderCode)) throw badRequest("Mã đơn hàng không hợp lệ.");
  if (!Number.isFinite(expiresAt) || expiresAt <= now) throw new HttpError(410, "Mã QR đã hết hạn.");
  if (expiresAt > now + QR_LIFETIME_MS + 5_000) throw badRequest("Thời hạn QR không hợp lệ.");
}

type CassoTransaction = {
  id?: string | number;
  reference?: string;
  tid?: string;
  amount?: number;
  description?: string;
  accountNumber?: string;
  subAccId?: string;
};

export async function getBankTransferQr(req: Request, res: Response) {
  const productSlug = text(req.query.product);
  const storage = text(req.query.storage);
  const ram = text(req.query.ram);
  const voucherCode = text(req.query.voucher);
  const orderCode = text(req.query.orderCode).toUpperCase();
  const quantity = Math.min(10, Math.max(1, Math.floor(Number(req.query.quantity)) || 1));
  const expiresAt = Number(req.query.expiresAt);
  const now = Date.now();

  assertQrRequest(orderCode, expiresAt, now);

  let amount: number;
  if (productSlug) {
    const product = (await getPublicProducts()).find((item) => item.slug === productSlug);
    if (!product) throw badRequest("Sản phẩm chưa có giá thanh toán hợp lệ.");
    const subtotal = productUnitPrice(product, storage, "", ram) * quantity;
    amount = subtotal - (await validateVoucher(voucherCode, subtotal)).discount;
  } else {
    const order = await getOrderPaymentByCode(orderCode);
    if (!order) throw badRequest("Không tìm thấy đơn hàng cần thanh toán.");
    if (!order.paymentMethod.startsWith(BANK_TRANSFER_PREFIX)) throw badRequest("Đơn hàng không sử dụng phương thức chuyển khoản.");
    amount = order.total;
  }
  if (!(amount > 0) || amount > MAX_AMOUNT) throw badRequest("Sản phẩm chưa có giá thanh toán hợp lệ.");

  const settings = await getStoreSettings();
  const payload = QRPay.initVietQR({
    bankBin: bankBin(settings),
    bankNumber: settings.bank.accountNumber,
    amount: String(amount),
    purpose: orderCode,
  }).build();
  const svg = await QRCode.toString(payload, {
    type: "svg",
    width: 720,
    margin: 3,
    errorCorrectionLevel: "M",
    color: { dark: "#111827", light: "#ffffff" },
  });

  res.set({
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  });
  res.send(svg);
}

export async function getMomoQr(req: Request, res: Response) {
  const orderCode = text(req.query.orderCode).toUpperCase();
  assertQrRequest(orderCode, Number(req.query.expiresAt), Date.now());
  const order = await getOrderPaymentByCode(orderCode);
  if (!order || !order.paymentMethod.startsWith(MOMO_PREFIX) || !(order.total > 0) || order.total > MAX_AMOUNT) {
    throw badRequest("Đơn hàng MoMo không hợp lệ.");
  }
  const svg = await QRCode.toString(momoReceiveLink(await getStoreSettings()), {
    type: "svg", width: 720, margin: 3, errorCorrectionLevel: "M", color: { dark: "#a50064", light: "#ffffff" },
  });
  res.set({ "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" });
  res.send(svg);
}

async function findOrderCodeInDescription(description: string) {
  const candidates = [...new Set(Array.from(description.matchAll(/HA[0-9A-F]{10}/g), (match) => match[0]))];
  for (const candidate of candidates) {
    if (await getOrderPaymentByCode(candidate)) return candidate;
  }
  return candidates[0] ?? "";
}

export async function receiveCassoWebhook(req: Request, res: Response) {
  const secret = env.cassoWebhookSecret;
  if (!secret) throw new HttpError(503, "Webhook chưa được cấu hình.");
  if (!safeEqual(req.get("secure-token") ?? "", secret)) throw new HttpError(401, "Webhook không hợp lệ.");

  const payload = req.body as { error?: number | string; data?: CassoTransaction | CassoTransaction[] } | undefined;
  if (!payload?.data || ![0, "0"].includes(payload.error ?? 0)) throw badRequest("Dữ liệu webhook không hợp lệ.");

  const shopAccount = (await getStoreSettings()).bank.accountNumber;
  let processed = 0;
  for (const transaction of Array.isArray(payload.data) ? payload.data : [payload.data]) {
    const amount = Number(transaction.amount) || 0;
    const description = String(transaction.description ?? "").toUpperCase();
    const accountNumber = String(transaction.accountNumber ?? transaction.subAccId ?? "");
    // Ma don la "HA" + 10 ky tu hex (generateOrderCode). Ngan hang hay bo khoang trang ("...DONHANGHA1B2..."),
    // nen khong lay chuoi "HA..." dau tien ma lay ma hex dau tien that su ton tai.
    const orderCode = await findOrderCodeInDescription(description);
    const transactionId = String(transaction.reference ?? transaction.tid ?? transaction.id ?? "");
    if (!transactionId || !orderCode || amount <= 0) continue;
    if (accountNumber && accountNumber !== shopAccount) continue;

    await recordBankPayment({
      id: `casso-${transactionId}`,
      orderCode,
      amount,
      description,
      accountNumber: accountNumber || shopAccount,
    });
    processed += 1;
  }
  res.json({ error: 0, message: "success", processed });
}

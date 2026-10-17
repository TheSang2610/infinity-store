import { Router } from "express";
import * as controller from "../controllers/payment.controller";

export const paymentRoutes = Router();

// GET /api/payment-qr - anh QR VietQR (SVG) cho mot don hoac mot san pham dang xem
paymentRoutes.get("/payment-qr", controller.getBankTransferQr);
// GET /api/momo-qr?orderCode=&expiresAt= - QR chuyen tien MoMo cho don chon MoMo
paymentRoutes.get("/momo-qr", controller.getMomoQr);
// POST /api/payments/casso - Casso bao tien vao tai khoan
paymentRoutes.post("/payments/casso", controller.receiveCassoWebhook);

import type { Request, Response } from "express";
import { getBranches } from "../repositories/branch.repository";
import { badRequest, notFound, text } from "../utils/http";
import { getOrderStatusByCode } from "../repositories/order.repository";
import { lookupWarranty, placeOrder, placePreorder } from "../services/order.service";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

export async function submitOrder(req: Request, res: Response) {
  const saved = await placeOrder(req.body ?? {}, req.customer);
  res.json({
    ok: true, id: saved.id, orderCode: saved.orderCode, status: saved.status,
    paymentStatus: saved.paymentStatus, total: saved.total, discount: saved.discount,
  });
}

export async function getOrderStatus(req: Request, res: Response) {
  const orderCode = text(req.query.orderCode).toUpperCase();
  if (!/^(HA|DT)[A-Z0-9]{10}$/.test(orderCode)) throw badRequest("Mã đơn hàng không hợp lệ.");
  const order = await getOrderStatusByCode(orderCode);
  if (!order) throw notFound("Không tìm thấy đơn hàng.");
  res.set(NO_STORE).json({ status: order.status === "new" ? "pending" : order.status, paymentStatus: order.paymentStatus });
}

export async function submitPreorder(req: Request, res: Response) {
  const saved = await placePreorder(req.body ?? {}, req.customer);
  res.json({ ok: true, ...saved });
}

export async function searchWarranty(req: Request, res: Response) {
  const orderCode = text(req.body?.orderCode).toUpperCase();
  const phone = text(req.body?.phone);
  if (!/^[A-Z0-9-]{6,25}$/.test(orderCode) || !/^\+?[0-9 .-]{9,18}$/.test(phone)) {
    throw badRequest("Vui lòng nhập đúng mã đơn hàng và số điện thoại.");
  }
  const warranty = await lookupWarranty(orderCode, phone);
  if (!warranty) throw notFound("Không tìm thấy thông tin phù hợp. Hãy kiểm tra lại mã đơn và số điện thoại.");
  res.set(NO_STORE).json({ warranty });
}

export async function listActiveBranches(_req: Request, res: Response) {
  const branches = await getBranches(false);
  res.set("Cache-Control", "public, max-age=60")
    .json({ branches: branches.map(({ id, code, name, address, phone, hours }) => ({ id, code, name, address, phone, hours })) });
}

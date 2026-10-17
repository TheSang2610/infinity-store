import type { Request, Response } from "express";
import { badRequest, nonNegativeInt, text } from "../utils/http";
import { validateVoucher } from "../repositories/voucher.repository";

export async function checkVoucher(req: Request, res: Response) {
  const subtotal = nonNegativeInt(req.body?.subtotal);
  if (!subtotal) throw badRequest("Đơn hàng chưa có sản phẩm để áp dụng voucher.");
  const result = await validateVoucher(text(req.body?.code), subtotal);
  res.json({ ok: true, code: result.code, discount: result.discount, total: subtotal - result.discount });
}

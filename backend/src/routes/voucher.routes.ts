import { Router } from "express";
import * as controller from "../controllers/voucher.controller";

export const voucherRoutes = Router();

// POST /api/vouchers/validate { code, subtotal }
voucherRoutes.post("/validate", controller.checkVoucher);

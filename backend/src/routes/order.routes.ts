import { Router } from "express";
import * as controller from "../controllers/order.controller";

export const orderRoutes = Router();

// POST /api/orders - dat hang (khach chua dang nhap van dat duoc)
orderRoutes.post("/orders", controller.submitOrder);
// GET /api/orders/status?orderCode=HA... - trang thanh toan hoi xem tien da ve chua
orderRoutes.get("/orders/status", controller.getOrderStatus);
// POST /api/preorders - dang ky dat truoc, khong thu coc
orderRoutes.post("/preorders", controller.submitPreorder);
// POST /api/warranty { orderCode, phone } - tra cuu bao hanh
orderRoutes.post("/warranty", controller.searchWarranty);
// GET /api/branches - chi nhanh dang hoat dong (form dat hang, chat, dat truoc)
orderRoutes.get("/branches", controller.listActiveBranches);

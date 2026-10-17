import { Router } from "express";
import * as controller from "../controllers/image.controller";

export const imageRoutes = Router();

// GET /api/product-images/<key> - anh san pham va anh dai dien (cong khai).
// Ho so nhan su va tep rieng tu khong mo qua duong nay.
imageRoutes.get("/:key", controller.getProductImage);

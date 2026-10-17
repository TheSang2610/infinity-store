import { Router } from "express";
import * as controller from "../controllers/product.controller";

export const productRoutes = Router();

// GET /api/products?category=iphone  (them &view=summary: chi slug, ten, gia... cho chatbot)
productRoutes.get("/products", controller.listProducts);
// GET /api/products/iphone-17-pro
productRoutes.get("/products/:slug", controller.getProduct);
// GET /api/products/iphone-17-pro/availability - chi nhanh con hang
productRoutes.get("/products/:slug/availability", controller.getProductAvailability);
// POST /api/product-views { productSlug, visitorId }
productRoutes.post("/product-views", controller.trackProductView);

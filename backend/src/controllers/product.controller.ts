import type { Request, Response } from "express";
import { badRequest, notFound, text } from "../utils/http";
import type { ManagedProduct, ProductCategory } from "../types";
import { getProductBranchAvailability } from "../repositories/inventory.repository";
import { PRODUCT_CATEGORIES } from "../services/admin-product.service";
import { recordProductView } from "../repositories/product-view.repository";
import { getPublicProductBySlug, getPublicProducts } from "../services/product.service";

const SAFE_VALUE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,99}$/;

/** API cong khai: bo gia nhap, so serial va ma vach (chi trang quan tri moi can). */
function toPublicProduct({ costPrice: _costPrice, ...product }: ManagedProduct) {
  return {
    ...product,
    variants: product.variants?.map(({ costPrice: _variantCost, serials: _serials, barcode: _barcode, ...variant }) => variant),
  };
}

export async function listProducts(req: Request, res: Response) {
  const category = text(req.query.category) as ProductCategory;
  const products = await getPublicProducts(PRODUCT_CATEGORIES.includes(category) ? category : undefined);
  // ?view=summary: chi vai truong cho chatbot o moi trang (khong tai bien the, anh, thong so).
  if (req.query.view === "summary") {
    res.set("Cache-Control", "public, max-age=60").json({
      products: products.map(({ slug, name, brand, price, tagline, stock, active }) => ({ slug, name, brand, price, tagline, stock, active })),
    });
    return;
  }
  res.json({ products: products.map(toPublicProduct) });
}

export async function getProduct(req: Request, res: Response) {
  const product = await getPublicProductBySlug(String(req.params.slug));
  if (!product) throw notFound("Không tìm thấy sản phẩm.");
  res.json({ product: toPublicProduct(product) });
}

export async function getProductAvailability(req: Request, res: Response) {
  res.json({ branches: await getProductBranchAvailability(String(req.params.slug)) });
}

export async function trackProductView(req: Request, res: Response) {
  const productSlug = text(req.body?.productSlug);
  const visitorId = text(req.body?.visitorId);
  if (!SAFE_VALUE.test(productSlug) || !SAFE_VALUE.test(visitorId)) throw badRequest("Dữ liệu lượt xem không hợp lệ.");
  res.json({ recorded: await recordProductView(productSlug, visitorId) });
}

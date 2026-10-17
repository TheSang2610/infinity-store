import type { Request, Response } from "express";
import { badRequest, notFound, text } from "../utils/http";
import { getBranches } from "../repositories/branch.repository";
import { getProductBranchAvailability } from "../repositories/inventory.repository";
import { getPublicProductBySlug, getPublicProducts } from "../services/product.service";
import {
  recommendProducts, type AdvisorCategory, type AdvisorProduct, type AdvisorPurpose, type AdvisorState,
} from "../services/chatbot/advisor";
import { buildProductConsultation } from "../services/chatbot/consult";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

const CATEGORIES: AdvisorCategory[] = ["phone", "laptop", "tablet", "desktop", "watch", "audio", "camera"];

const PURPOSES: AdvisorPurpose[] = ["gaming", "camera", "battery", "study", "creative", "coding", "basic", "compact", "gift", "general"];

const CACHE_MS = 60_000;

let catalogCache: { at: number; products: AdvisorProduct[] } | undefined;

/** Catalog rut gon cho tro ly goi y, cache 1 phut. */
async function loadCatalog() {
  if (catalogCache && Date.now() - catalogCache.at < CACHE_MS) return catalogCache.products;
  const [main, tablets] = await Promise.all([getPublicProducts(), getPublicProducts("tablet").catch(() => [])]);
  const products = [...main, ...tablets].map(({ slug, name, brand, category, price, image, stock, active, status, condition }) =>
    ({ slug, name, brand, category, price, image, stock, active, status, condition }));
  catalogCache = { at: Date.now(), products };
  return products;
}

export async function getProductSummary(req: Request, res: Response) {
  const slug = text(req.query.slug).toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,120}$/.test(slug)) throw badRequest("Sản phẩm không hợp lệ.");
  const product = await getPublicProductBySlug(slug);
  if (!product) throw notFound("Không tìm thấy sản phẩm.");
  const [branches, openBranches] = await Promise.all([
    getProductBranchAvailability(product.slug).catch(() => []),
    getBranches(false).catch(() => []),
  ]);
  const result = buildProductConsultation(product, branches, openBranches);
  res.set(NO_STORE).json({ ...result, advisor: { ...result.advisor, exclude: product.slug, anchor: product.name } });
}

export async function recommend(req: Request, res: Response) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const money = (value: unknown) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 && amount < 1_000_000_000 ? Math.round(amount) : undefined;
  };
  const state: AdvisorState = {
    category: CATEGORIES.includes(body.category as AdvisorCategory) ? body.category as AdvisorCategory : undefined,
    purpose: PURPOSES.includes(body.purpose as AdvisorPurpose) ? body.purpose as AdvisorPurpose : undefined,
    brand: typeof body.brand === "string" && /^[a-z]{2,12}$/.test(body.brand) ? body.brand : undefined,
    min: money(body.min),
    max: money(body.max),
    anchor: typeof body.anchor === "string" ? body.anchor.replace(/[\u0000-\u001f<>]/g, "").slice(0, 80) || undefined : undefined,
    exclude: typeof body.exclude === "string" && /^[a-z0-9-]{2,120}$/.test(body.exclude) ? body.exclude : undefined,
  };
  res.set(NO_STORE).json(recommendProducts(await loadCatalog(), state));
}

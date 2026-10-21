// Ton kho ban online: tru khi dat hang, cong lai khi don bi huy / tra hang.
//
// Ton that nam o tung bien the (mau x dung luong) trong cot products.variants - giao dien
// cung doc so nay (variant.stock) de bat / tat nut "Them vao gio". San pham chua khai bien
// the thi dung cot products.stock. Bien the de trong ton (undefined) duoc coi la khong gioi
// han, dung voi cach giao dien dang hien thi.
//
// Ton kho theo chi nhanh (branch_inventory) la so lieu kho rieng, nhap / xuat tay o trang
// Kho - khong dong vao o day.

import { eq, like, or } from "drizzle-orm";
import { getDb } from "../db/client";
import { products } from "../db/schema";
import { publicFamilyKey } from "../services/product-catalog.service";
import type { OrderItem, ProductVariant } from "../types";
import { badRequest, sameOption } from "../utils/http";

type ProductRow = typeof products.$inferSelect;
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type StockItem = Pick<OrderItem, "productSlug" | "productName" | "ram" | "storage" | "color" | "quantity">;

/** Tru ton cho cac dong hang. Thieu hang thi bao loi va khong tru gi ca (ca giao dich hoan lai). */
export async function reserveStock(items: StockItem[]) {
  await getDb().transaction((tx) => applyStock(tx, items, -1));
}

/** Cong lai ton cho don bi huy / tra hang. */
export async function restoreStock(items: StockItem[], tx?: Tx) {
  if (tx) return applyStock(tx, items, 1);
  await getDb().transaction((inner) => applyStock(inner, items, 1));
}

async function applyStock(tx: Tx, items: StockItem[], direction: 1 | -1) {
  // Nhieu dong hang cung mot ban ghi: doc mot lan, cong don thay doi roi ghi mot lan.
  const touched = new Map<string, ProductRow>();
  for (const item of items) {
    // Don dat truoc va dong "gio hang" cu khong gan voi mot ban ghi san pham cu the.
    if (!item.productSlug || item.productSlug.startsWith("preorder-") || item.productSlug === "gio-hang") continue;
    const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (!quantity) continue;

    const rows = await familyRows(tx, item.productSlug, touched);
    const target = findStockTarget(rows, item);
    if (!target) continue;

    const { row, variantIndex } = target;
    if (variantIndex >= 0) {
      const variant = row.variants[variantIndex];
      if (variant.stock == null) continue;
      const next = Number(variant.stock) + direction * quantity;
      if (next < 0) throw outOfStock(item, Number(variant.stock));
      row.variants = row.variants.map((entry, index) => index === variantIndex ? { ...entry, stock: next } : entry);
      // Giong trang sua san pham: ton cua ban ghi = tong ton cac bien the dang ban.
      row.stock = sumVariantStock(row.variants);
    } else {
      const next = row.stock + direction * quantity;
      if (next < 0) throw outOfStock(item, row.stock);
      row.stock = next;
    }
    touched.set(row.id, row);
  }

  const now = Date.now();
  for (const row of touched.values()) {
    await tx.update(products).set({ stock: row.stock, variants: row.variants, updatedAt: now }).where(eq(products.id, row.id));
  }
}

/** Cac ban ghi cung dong may voi slug cong khai ("iphone-17" -> iphone-17-256gb, iphone-17-512gb...). */
async function familyRows(tx: Tx, slug: string, touched: Map<string, ProductRow>) {
  const rows = await tx.select().from(products)
    .where(or(eq(products.slug, slug), like(products.slug, `${slug}-%`)))
    .for("update");
  return rows
    .filter((row) => row.slug === slug || publicFamilyKey(row.slug) === slug)
    // Ban ghi da doi trong cung giao dich thi dung ban da doi.
    .map((row) => touched.get(row.id) ?? row);
}

function findStockTarget(rows: ProductRow[], item: StockItem): { row: ProductRow; variantIndex: number } | undefined {
  const matches = (variant: ProductVariant) =>
    (!item.ram || sameOption(variant.ram, item.ram))
    && (!item.storage || sameOption(variant.storage, item.storage))
    && (!item.color || sameOption(variant.color, item.color));

  for (const row of rows) {
    const variants = row.variants ?? [];
    const index = variants.findIndex((variant) => variant.status !== "inactive" && matches(variant));
    if (index >= 0) return { row, variantIndex: index };
  }
  // San pham khong khai bien the: mot ban ghi cho moi dung luong, nhan biet qua duoi slug.
  const plain = rows.filter((row) => !(row.variants ?? []).length);
  if (plain.length === 1) return { row: plain[0], variantIndex: -1 };
  const storage = item.storage.trim().toLowerCase().replace(/\s+/g, "");
  const bySlug = storage ? plain.find((row) => row.slug.endsWith(`-${storage}`)) : undefined;
  return bySlug ? { row: bySlug, variantIndex: -1 } : undefined;
}

function sumVariantStock(variants: ProductVariant[]) {
  return variants
    .filter((variant) => variant.status !== "inactive")
    .reduce((total, variant) => total + Math.max(0, Number(variant.stock) || 0), 0);
}

function outOfStock(item: StockItem, available: number) {
  const option = [item.ram, item.storage, item.color].filter(Boolean).join(" / ");
  const name = option ? `${item.productName} (${option})` : item.productName;
  return badRequest(available > 0 ? `${name} chỉ còn ${available} sản phẩm.` : `${name} đã hết hàng.`);
}

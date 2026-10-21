// Gio hang cua khach thanh vien, luu tren may chu de dang nhap may nao cung thay.
// Gia trong gio chi de hien thi; dat hang (services/order.service.ts) luon tinh lai gia tu CSDL.

import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { customerCarts } from "../db/schema";
import type { CartItem } from "../types";
import { badRequest } from "../utils/http";

export const MAX_CART_LINES = 20;
const MAX_QUANTITY = 10;

export async function getCart(customerId: string): Promise<CartItem[]> {
  const [row] = await getDb().select({ items: customerCarts.items }).from(customerCarts)
    .where(eq(customerCarts.customerId, customerId)).limit(1);
  return row?.items ?? [];
}

/** Ghi de ca gio (giao dien gui len toan bo gio sau moi thay doi). */
export async function saveCart(customerId: string, input: unknown): Promise<CartItem[]> {
  const items = normalizeCart(input);
  const now = Date.now();
  await getDb().insert(customerCarts).values({ customerId, items, updatedAt: now })
    .onConflictDoUpdate({ target: customerCarts.customerId, set: { items, updatedAt: now } });
  return items;
}

function normalizeCart(input: unknown): CartItem[] {
  if (!Array.isArray(input)) throw badRequest("Giỏ hàng không hợp lệ.");
  if (input.length > MAX_CART_LINES) throw badRequest(`Giỏ hàng tối đa ${MAX_CART_LINES} sản phẩm.`);
  const seen = new Set<string>();
  const items: CartItem[] = [];
  for (const raw of input) {
    const line = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const str = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
    const item: CartItem = {
      key: str(line.key, 300),
      productSlug: str(line.productSlug, 160),
      productName: str(line.productName, 200),
      image: str(line.image, 500),
      ram: str(line.ram, 40),
      storage: str(line.storage, 40),
      color: str(line.color, 60),
      unitPrice: Math.max(0, Math.floor(Number(line.unitPrice) || 0)),
      quantity: Math.min(MAX_QUANTITY, Math.max(1, Math.floor(Number(line.quantity) || 1))),
    };
    // Dong hong (thieu khoa / slug / ten) thi bo qua thay vi tu choi ca gio.
    if (!item.key || !item.productSlug || !item.productName || seen.has(item.key)) continue;
    seen.add(item.key);
    items.push(item);
  }
  return items;
}

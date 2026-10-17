import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, like, or } from "drizzle-orm";
import { getDb } from "../db/client";
import { branches, branchInventory, inventoryMovements, products } from "../db/schema";
import { badRequest, HttpError } from "../utils/http";
import type { BranchAvailability, BranchInventoryItem, InventoryMovement, InventoryOperation, ManagedProduct } from "../types";
import { publicFamilyKey } from "../services/product-catalog.service";
import { getManagedProducts } from "../services/product.service";

export async function getBranchInventory(branchId: string): Promise<BranchInventoryItem[]> {
  const [allProducts, rows] = await Promise.all([
    getManagedProducts(),
    getDb().select().from(branchInventory).where(eq(branchInventory.branchId, branchId)),
  ]);
  const stock = new Map(rows.map((row) => [row.productId, row]));
  return allProducts
    .filter((product) => product.active || (stock.get(product.id)?.quantity ?? 0) > 0)
    .map((product) => ({ product, quantity: stock.get(product.id)?.quantity ?? 0, updatedAt: stock.get(product.id)?.updatedAt ?? 0 }));
}

export async function getInventoryMovements(branchId: string, limit = 30): Promise<InventoryMovement[]> {
  const rows = await getDb().select().from(inventoryMovements)
    .where(eq(inventoryMovements.branchId, branchId))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(Math.min(100, Math.max(1, limit)));
  return rows.map((row) => ({ ...row, operation: normalizeOperation(row.operation) }));
}

/**
 * Nhap / xuat / kiem ke ton kho mot san pham tai chi nhanh.
 * Khoa dong ton kho (SELECT ... FOR UPDATE) trong giao dich nen hai nhan vien thao tac
 * cung luc khong ghi de len nhau; nhat ky va ton kho luon khop.
 */
export async function adjustBranchInventory(input: {
  branchId: string;
  product: Pick<ManagedProduct, "id" | "name">;
  operation: InventoryOperation;
  quantity: number;
  note: string;
  actorId: string;
  actorName: string;
}) {
  const quantity = Math.trunc(input.quantity);
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100_000) throw badRequest("Số lượng kho không hợp lệ.");
  if (input.operation !== "count" && quantity === 0) throw badRequest("Số lượng xuất hoặc nhập phải lớn hơn 0.");

  return getDb().transaction(async (tx) => {
    const now = Date.now();
    // Tao dong ton kho 0 neu chua co, roi khoa dong do lai.
    await tx.insert(branchInventory).values({ branchId: input.branchId, productId: input.product.id, quantity: 0, updatedAt: now })
      .onConflictDoNothing();
    const [current] = await tx.select({ quantity: branchInventory.quantity }).from(branchInventory)
      .where(and(eq(branchInventory.branchId, input.branchId), eq(branchInventory.productId, input.product.id)))
      .for("update");
    const beforeQuantity = current?.quantity ?? 0;
    const afterQuantity = input.operation === "receive"
      ? beforeQuantity + quantity
      : input.operation === "issue" ? beforeQuantity - quantity : quantity;
    if (afterQuantity < 0) throw new HttpError(409, `Không đủ tồn kho để xuất. Chi nhánh hiện còn ${beforeQuantity} sản phẩm.`);

    await tx.update(branchInventory).set({ quantity: afterQuantity, updatedAt: now })
      .where(and(eq(branchInventory.branchId, input.branchId), eq(branchInventory.productId, input.product.id)));
    await tx.insert(inventoryMovements).values({
      id: randomUUID(),
      branchId: input.branchId,
      productId: input.product.id,
      productName: clean(input.product.name, 180),
      operation: input.operation,
      quantity,
      beforeQuantity,
      afterQuantity,
      note: clean(input.note, 240),
      actorId: input.actorId,
      actorName: clean(input.actorName, 120),
      createdAt: now,
    });
    return { beforeQuantity, afterQuantity };
  });
}

/** Chi nhanh dang con hang cho mot san pham cong khai (gop moi dung luong cung dong may). */
export async function getProductBranchAvailability(slug: string): Promise<BranchAvailability[]> {
  const family = publicFamilyKey(slug);
  const rows = await getDb().select({
    branchId: branches.id, name: branches.name, address: branches.address, phone: branches.phone, hours: branches.hours,
    slug: products.slug, productName: products.name, quantity: branchInventory.quantity,
  })
    .from(branchInventory)
    .innerJoin(products, eq(products.id, branchInventory.productId))
    .innerJoin(branches, eq(branches.id, branchInventory.branchId))
    .where(and(
      gt(branchInventory.quantity, 0), eq(branches.active, true), eq(products.active, true),
      or(eq(products.slug, family), like(products.slug, `${family}-%`)),
    ));

  const result = new Map<string, BranchAvailability>();
  for (const row of rows) {
    if (publicFamilyKey(row.slug) !== family) continue;
    const current = result.get(row.branchId) ?? {
      branchId: row.branchId, name: row.name, address: row.address, phone: row.phone,
      hours: row.hours || "08:00–22:00", quantity: 0, variants: [],
    };
    current.quantity += row.quantity;
    const storage = row.productName.match(/\b\d+\s?(?:GB|TB)\b/i)?.[0]?.replace(/\s/g, "").toUpperCase();
    if (storage && !current.variants.includes(storage)) current.variants.push(storage);
    result.set(row.branchId, current);
  }
  return [...result.values()].sort((left, right) => right.quantity - left.quantity);
}

function normalizeOperation(value: string): InventoryOperation {
  return value === "issue" || value === "count" ? value : "receive";
}

function clean(value: string, limit: number) {
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").slice(0, limit);
}


import { and, asc, desc, eq, inArray, like, ne, notInArray } from "drizzle-orm";
import { getDb } from "../db/client";
import { products } from "../db/schema";
import type { ManagedProduct, ProductCategory, ProductStatus } from "../types";
import { conditionLabel, REMOVED_CATEGORIES, seedCondition } from "../services/product-catalog.service";

type ProductRow = typeof products.$inferSelect;

/** Danh muc gop: trang MacBook gom ca Air/Pro, trang Laptop gom ca laptop cu. */
const CATEGORY_GROUPS: Partial<Record<ProductCategory, string[]>> = {
  macbook: ["macbook", "macbook-air", "macbook-pro"],
  laptop: ["laptop", "laptop-cu"],
};

/** San pham dang ban; khong truyen danh muc thi lay tat ca tru may tinh bang va danh muc da ngung. */
export async function findActiveProducts(category?: ProductCategory) {
  const filter = category
    ? and(eq(products.active, true), inArray(products.category, CATEGORY_GROUPS[category] ?? [category]))
    : and(eq(products.active, true), notInArray(products.category, ["tablet", ...REMOVED_CATEGORIES]));
  const rows = await getDb().select().from(products).where(filter).orderBy(desc(products.featured), asc(products.createdAt), asc(products.id));
  return rows.map(toProduct);
}

export async function findActiveBySlug(slug: string) {
  const [row] = await getDb().select().from(products).where(and(eq(products.slug, slug), eq(products.active, true))).limit(1);
  return row ? toProduct(row) : undefined;
}

/** Cac ban "<slug>-128gb", "<slug>-256gb"... cua cung mot dong may. */
export async function findActiveBySlugPrefix(slug: string) {
  const rows = await getDb().select().from(products)
    .where(and(eq(products.active, true), like(products.slug, `${escapeLike(slug)}-%`)))
    .orderBy(asc(products.createdAt), asc(products.id));
  return rows.map(toProduct);
}

export async function findActiveInCategory(category: string) {
  const rows = await getDb().select().from(products)
    .where(and(eq(products.active, true), eq(products.category, category)))
    .orderBy(asc(products.createdAt), asc(products.id));
  return rows.map(toProduct);
}

export async function findAllProducts() {
  const rows = await getDb().select().from(products)
    .where(notInArray(products.category, REMOVED_CATEGORIES))
    .orderBy(desc(products.active), desc(products.updatedAt), asc(products.id));
  return rows.map(toProduct);
}

export async function findProductById(id: string) {
  const [row] = await getDb().select().from(products).where(eq(products.id, id)).limit(1);
  return row && !REMOVED_CATEGORIES.includes(row.category) ? toProduct(row) : undefined;
}

export async function slugTakenByOther(slug: string, id: string) {
  const [row] = await getDb().select({ id: products.id }).from(products)
    .where(and(eq(products.slug, slug), ne(products.id, id))).limit(1);
  return Boolean(row);
}

export type ProductInput = Omit<ManagedProduct, "createdAt" | "updatedAt">;

export async function upsertProduct(input: ProductInput) {
  const values = toRow(input, Date.now());
  // Giu nguyen ngay tao va tinh trang may khi cap nhat (form quan tri khong sua tinh trang).
  const { createdAt: _createdAt, condition: _condition, ...update } = values;
  await getDb().insert(products).values(values).onConflictDoUpdate({ target: products.id, set: update });
}

export async function setProductActive(id: string, active: boolean) {
  await getDb().update(products)
    .set({ active, status: active ? "active" : "inactive", updatedAt: Date.now() })
    .where(eq(products.id, id));
}

/** San pham mau (id "seed-...") chi an di de lan seed sau khong tao lai; san pham tu tao thi xoa han. */
export async function deleteProducts(ids: string[]) {
  const seedIds = ids.filter((id) => id.startsWith("seed-"));
  const ownIds = ids.filter((id) => id && !id.startsWith("seed-"));
  const db = getDb();
  if (seedIds.length) {
    await db.update(products).set({ active: false, status: "inactive", updatedAt: Date.now() }).where(inArray(products.id, seedIds));
  }
  if (ownIds.length) await db.delete(products).where(inArray(products.id, ownIds));
}

/** Them san pham mau con thieu (backend/seed/products.json), khong dung toi san pham da co. */
export async function insertSeedProducts(seed: ProductInput[]) {
  const now = Date.now();
  const rows = seed
    .filter((product) => !REMOVED_CATEGORIES.includes(product.category))
    .map((product, index) => toRow({
      ...product,
      condition: seedCondition(product),
      status: product.status ?? "active",
    }, now + index));
  for (let start = 0; start < rows.length; start += 200) {
    await getDb().insert(products).values(rows.slice(start, start + 200)).onConflictDoNothing();
  }
  return rows.length;
}

function toRow(input: ProductInput, now: number): typeof products.$inferInsert {
  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    brand: input.brand,
    category: input.category,
    sku: input.sku ?? "",
    description: input.description ?? "",
    image: input.image,
    images: input.images?.length ? input.images : [input.image],
    badge: input.badge ?? "",
    tagline: input.tagline ?? "",
    price: input.price,
    costPrice: input.costPrice ?? "",
    sellingPrice: input.sellingPrice ?? input.price,
    salePrice: input.salePrice ?? "",
    stock: Math.max(0, Math.floor(Number(input.stock ?? 0)) || 0),
    status: input.status ?? (input.active ? "active" : "inactive"),
    tags: input.tags ?? [],
    condition: input.condition === "like-new" ? "like-new" : "new",
    seoTitle: input.seoTitle ?? "",
    seoDescription: input.seoDescription ?? "",
    variants: input.variants ?? [],
    colors: input.colors ?? [],
    specs: input.specs ?? [],
    colorOptions: input.colorOptions ?? [],
    storageOptions: input.storageOptions ?? [],
    mediaLinks: input.mediaLinks ?? [],
    sortOrder: input.sortOrder ?? null,
    featured: Boolean(input.featured),
    active: Boolean(input.active),
    source: input.source ?? "",
    createdAt: now,
    updatedAt: now,
  };
}

function toProduct(row: ProductRow): ManagedProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category as ProductCategory,
    sku: row.sku,
    description: row.description,
    condition: row.condition === "like-new" ? "like-new" : "new",
    conditionLabel: conditionLabel(row.condition),
    image: row.image,
    images: row.images.length ? row.images : [row.image],
    badge: row.badge,
    tagline: row.tagline,
    price: row.price,
    costPrice: row.costPrice,
    sellingPrice: row.sellingPrice || row.price,
    salePrice: row.salePrice,
    stock: row.stock,
    status: normalizeStatus(row.status, row.active),
    tags: row.tags,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    variants: row.variants,
    colors: row.colors,
    specs: row.specs,
    ...(row.colorOptions.length ? { colorOptions: row.colorOptions } : {}),
    ...(row.storageOptions.length ? { storageOptions: row.storageOptions } : {}),
    ...(row.mediaLinks.length ? { mediaLinks: row.mediaLinks } : {}),
    ...(row.sortOrder != null ? { sortOrder: row.sortOrder } : {}),
    featured: row.featured,
    active: row.active,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeStatus(value: string, active: boolean): ProductStatus {
  if (value === "draft" || value === "active" || value === "inactive") return value;
  return active ? "active" : "inactive";
}

/** Postgres LIKE coi "_" va "%" la ky tu dac biet; slug co the chua "_". */
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

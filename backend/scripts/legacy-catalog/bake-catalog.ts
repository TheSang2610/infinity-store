// CHUYEN DU LIEU MOT LAN: dua noi dung san pham dang viet cung trong source (anh, mau, thong so,
// link, bang gia iPhone 17, thu tu hien thi...) vao tung dong cua bang products.
//
//   npx tsx --env-file=.env scripts/legacy-catalog/bake-catalog.ts            # chi kiem tra, khong ghi
//   npx tsx --env-file=.env scripts/legacy-catalog/bake-catalog.ts --write    # ghi vao CSDL
//   npx tsx scripts/legacy-catalog/bake-catalog.ts --seed                     # sinh lai seed/products.json
//
// Cach lam: chay logic cu (legacy-pipeline.ts + data/) de ra dung san pham dang hien tren web,
// ghi noi dung do vao cac dong CSDL, roi chay logic moi (src/modules/products/product.catalog.ts)
// tren du lieu da ghi va so tung san pham. Lech thi bao, khong ghi.
// Chay xong tren CSDL that (Neon, sau khi import du lieu cu) thi xoa ca thu muc legacy-catalog.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "../../src/db/client";
import { products as productsTable } from "../../src/db/schema";
import { consolidatePublicProducts as consolidateNew, pickCanonical, publicFamilyKey, seedCondition } from "../../src/services/product-catalog.service";
import { findAllProducts } from "../../src/repositories/product.repository";
import type { ManagedProduct, ProductCategory, ProductVariant } from "../../src/types";
import { catalogProductOrder, orderCatalogProducts } from "./data/current-catalog";
import { consolidatePublicProducts as consolidateOld, enrichProduct, seedProducts } from "./legacy-pipeline";

const CATEGORY_GROUPS: Partial<Record<ProductCategory, string[]>> = {
  macbook: ["macbook", "macbook-air", "macbook-pro"],
  laptop: ["laptop", "laptop-cu"],
};
const COMPARED_FIELDS = [
  "name", "brand", "category", "description", "image", "images", "badge", "tagline", "price", "sellingPrice", "salePrice",
  "stock", "variants", "colors", "colorOptions", "storageOptions", "mediaLinks", "specs", "source", "condition", "featured",
] as const;

type Baked = ManagedProduct;

export function bake(rows: ManagedProduct[]) {
  // 1. Muc tung dong: anh/thong so/bien the tu catalog mau (giong trang quan tri cu hien thi).
  const baked = new Map<string, Baked>(rows.map((row) => [row.id, stripUndefined({ ...enrichProduct(row), id: row.id })]));
  const active = rows.filter((row) => row.active).sort((left, right) => left.createdAt - right.createdAt);
  const byCategory = groupBy(active, (row) => row.category);
  const expected = new Map<string, ManagedProduct>();

  // 2. Muc dong may: noi dung cuoi cung dang hien tren web, ghi vao cac dong cua dong may do.
  for (const [category, members] of byCategory) {
    const oldFamilies = consolidateOld(members.map(enrichProduct));
    const familyMembers = groupBy(members, (row) => publicFamilyKey(row.slug));
    for (const final of oldFamilies) {
      const familyRows = familyMembers.get(final.slug) ?? [];
      expected.set(`${category}:${final.slug}`, final);
      const canonical = pickCanonical(final.slug, familyRows);
      for (const row of familyRows) {
        const target = baked.get(row.id)!;
        target.image = final.image;
        target.images = final.images;
        if (row.id !== canonical.id) continue;
        if (cleanName(row.name) !== final.name) target.name = final.name;
        Object.assign(target, {
          description: final.description ?? "",
          badge: final.badge,
          tagline: final.tagline,
          specs: final.specs,
          source: final.source,
          colors: final.colors,
          colorOptions: final.colorOptions,
          storageOptions: final.storageOptions,
          mediaLinks: final.mediaLinks,
        });
      }
      assignVariants(final, familyRows.map((row) => baked.get(row.id)!), canonical.id);
    }
  }

  // 3. Thu tu trong trang danh muc (truoc day la danh sach slug viet cung).
  for (const category of Object.keys(catalogProductOrder) as ProductCategory[]) {
    const pageRows = active.filter((row) => (CATEGORY_GROUPS[category] ?? [category]).includes(row.category));
    const ordered = orderCatalogProducts(consolidateOld(sortForQuery(pageRows).map(enrichProduct)), category);
    ordered.forEach((product, index) => {
      for (const row of pageRows) if (publicFamilyKey(row.slug) === product.slug) baked.get(row.id)!.sortOrder = index + 1;
    });
  }

  // 4. Kiem tra: logic moi tren du lieu da ghi phai ra dung san pham cu.
  const diffs: string[] = [];
  const bakedActive = [...baked.values()].filter((row) => row.active).sort((left, right) => left.createdAt - right.createdAt);
  for (const [category, members] of groupBy(bakedActive, (row) => row.category)) {
    for (const product of consolidateNew(members.map(roundTrip))) {
      const old = expected.get(`${category}:${product.slug}`);
      if (!old) { diffs.push(`${product.slug}: thua san pham`); continue; }
      for (const field of COMPARED_FIELDS) {
        if (!sameValue(field, old[field], product[field])) {
          diffs.push(`${product.slug}.${field}: ${explain(old[field], product[field])}`);
        }
      }
    }
  }
  return { rows: [...baked.values()], diffs };
}

/**
 * Bien the cuoi cung cua dong may chia ve tung dong theo dung luong (dong 256GB giu bien the 256GB...)
 * de admin sua gia dong nao thi dung dung luong do doi gia. Dong may chi co mot dong thi giu nguyen
 * bien the dang co neu logic moi tu suy ra dung, nguoc lai ghi han bien the cuoi cung.
 */
function assignVariants(final: ManagedProduct, members: Baked[], canonicalId: string) {
  const finalVariants = final.variants ?? [];
  if (members.length === 1) {
    const [only] = members;
    const derived = consolidateNew([roundTrip(only)])[0].variants;
    if (!sameValue("variants", finalVariants, derived)) only.variants = finalVariants;
    return;
  }
  const assigned = new Map<string, ProductVariant[]>(members.map((member) => [member.id, []]));
  for (const variant of finalVariants) {
    const storage = normalize(variant.storage);
    // Dong co hau to dung luong trong slug ("-512gb") giu bien the dung luong do; con lai ve dong chinh.
    const owner = members.find((member) => normalize(storageOfSlug(member.slug)) === storage)?.id ?? canonicalId;
    assigned.get(owner)!.push(variant);
  }
  for (const member of members) member.variants = assigned.get(member.id)!;
}

function storageOfSlug(slug: string) {
  return slug.match(/-(128gb|256gb|512gb|1tb|2tb)$/i)?.[1] ?? "";
}

/** Gia lap ghi vao CSDL roi doc ra (toProduct bo cac mang rong). */
function roundTrip(row: Baked): ManagedProduct {
  const copy: ManagedProduct = JSON.parse(JSON.stringify(row));
  copy.images = copy.images?.length ? copy.images : [copy.image];
  for (const key of ["colorOptions", "storageOptions", "mediaLinks"] as const) if (!copy[key]?.length) delete copy[key];
  return copy;
}

function sortForQuery(rows: ManagedProduct[]) {
  return [...rows].sort((left, right) => Number(Boolean(right.featured)) - Number(Boolean(left.featured)) || left.createdAt - right.createdAt);
}

function cleanName(name: string) {
  return consolidateNew([{ ...emptyProduct(), name }])[0].name;
}

function emptyProduct(): ManagedProduct {
  return { id: "x", slug: "x", name: "", brand: "", category: "phu-kien", image: "", badge: "", tagline: "", price: "", colors: [], specs: [], source: "", active: true, createdAt: 0, updatedAt: 0 };
}

function sameValue(field: string, left: unknown, right: unknown) {
  const empty = (value: unknown) => value === undefined || value === null || (Array.isArray(value) && !value.length) || value === "";
  if (empty(left) && empty(right)) return true;
  if (field === "variants") return JSON.stringify(normalizeVariants(left)) === JSON.stringify(normalizeVariants(right));
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalizeVariants(value: unknown) {
  return ((value as ProductVariant[] | undefined) ?? []).map((variant) => JSON.parse(JSON.stringify(variant)));
}

function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normalize(value?: string) {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

/** Mang: chi ra phan tu dau tien khac nhau. */
function explain(left: unknown, right: unknown) {
  if (Array.isArray(left) && Array.isArray(right)) {
    const index = left.findIndex((item, position) => JSON.stringify(item) !== JSON.stringify(right[position]));
    const at = index === -1 ? left.length : index;
    return `do dai ${left.length} -> ${right.length}, khac tu [${at}]: ${short(left[at])} -> ${short(right[at])}`;
  }
  return `${short(left)} -> ${short(right)}`;
}

function short(value: unknown) {
  const text = JSON.stringify(value) ?? "undefined";
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) map.set(key(item), [...(map.get(key(item)) ?? []), item]);
  return map;
}

/** Dong CSDL gia lap tu catalog mau, giong cach seed cu nap vao. */
function seedRows(): ManagedProduct[] {
  const now = Date.UTC(2026, 9, 14);
  return seedProducts
    .filter((product) => !["samsung", "samsung-cu"].includes(product.category))
    // Catalog cu co slug trung (dell-latitude-5450): seed cu chi nap ban dau tien.
    .filter((product, index, list) => list.findIndex((item) => item.slug === product.slug) === index)
    .map((product, index) => ({
      ...product,
      id: `seed-${product.slug}`,
      sellingPrice: product.sellingPrice ?? product.price,
      condition: seedCondition(product),
      active: true,
      status: product.status ?? "active",
      stock: Math.max(0, Math.floor(Number(product.stock ?? 0)) || 0),
      createdAt: now + index,
      updatedAt: now + index,
    }));
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--seed")) {
    const { rows, diffs } = bake(seedRows());
    report(diffs);
    const output = rows.map(({ createdAt: _createdAt, updatedAt: _updatedAt, conditionLabel: _label, ...row }) => row);
    const file = path.resolve(__dirname, "../../seed/products.json");
    writeFileSync(file, `${JSON.stringify(output, null, 1)}\n`);
    console.log(`Đã ghi ${output.length} sản phẩm vào ${file}`);
    process.exit(diffs.length ? 1 : 0);
  }

  const { rows, diffs } = bake(await withUniqueCreatedAt(await findAllProducts()));
  report(diffs);
  if (!args.has("--write")) process.exit(diffs.length ? 1 : 0);
  if (diffs.length && !args.has("--force")) {
    console.log("Còn chỗ lệch, chưa ghi. Thêm --force nếu đã xem và chấp nhận.");
    process.exit(1);
  }
  const db = getDb();
  for (const row of rows) {
    await db.update(productsTable).set({
      name: row.name,
      image: row.image,
      images: row.images?.length ? row.images : [row.image],
      badge: row.badge,
      tagline: row.tagline,
      description: row.description ?? "",
      specs: row.specs,
      variants: row.variants ?? [],
      colors: row.colors,
      colorOptions: row.colorOptions ?? [],
      storageOptions: row.storageOptions ?? [],
      mediaLinks: row.mediaLinks ?? [],
      sortOrder: row.sortOrder ?? null,
      source: row.source,
      createdAt: row.createdAt,
    }).where(eq(productsTable.id, row.id));
  }
  console.log(`Đã ghi ${rows.length} sản phẩm.`);
  process.exit(0);
}

/**
 * Du lieu nhap tu ban cu chi co vai gia tri created_at (ca tram san pham trung nhau), nen thu tu
 * hien thi phu thuoc thu tu luu vat ly cua Postgres va doi ngay khi UPDATE. Cong them vai mili-giay
 * theo dung thu tu dang hien (nho hon nhieu khoang cach giua cac nhom) de thu tu co dinh.
 */
async function withUniqueCreatedAt(rows: ManagedProduct[]) {
  const ordered = await getDb().select({ id: productsTable.id, createdAt: productsTable.createdAt }).from(productsTable)
    .orderBy(desc(productsTable.featured), asc(productsTable.createdAt));
  const offsets = new Map<number, number>();
  const createdAt = new Map<string, number>();
  for (const row of ordered) {
    const offset = offsets.get(row.createdAt) ?? 0;
    offsets.set(row.createdAt, offset + 1);
    createdAt.set(row.id, row.createdAt + offset);
  }
  return rows.map((row) => ({ ...row, createdAt: createdAt.get(row.id) ?? row.createdAt }));
}

function report(diffs: string[]) {
  console.log(`Số chỗ lệch: ${diffs.length}`);
  for (const line of diffs.slice(0, 60)) console.log("  " + line);
  if (diffs.length > 60) console.log(`  ... và ${diffs.length - 60} chỗ khác`);
}

if (require.main === module) main().catch((error) => { console.error(error); process.exit(1); });

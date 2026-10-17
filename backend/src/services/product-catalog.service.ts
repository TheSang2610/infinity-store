// Logic hien thi san pham, KHONG chua du lieu: moi noi dung (anh, mau, thong so, link, thu tu)
// nam trong CSDL. O day chi gop cac ban 128GB/256GB... cua cung mot dong may thanh mot san pham
// co bien the va sap xep theo thu tu da luu.

import { formatMoney, normalizeOption } from "../utils/http";
import type { ManagedProduct, ProductVariant } from "../types";

const MAX_GALLERY_IMAGES = 24;

/** Gop "iphone-17-256gb", "iphone-17-512gb"... thanh mot san pham "iphone-17". */
export function consolidatePublicProducts(products: ManagedProduct[]): ManagedProduct[] {
  const families = new Map<string, ManagedProduct[]>();
  for (const product of products) {
    const key = publicFamilyKey(product.slug);
    families.set(key, [...(families.get(key) ?? []), product]);
  }
  return [...families.entries()].map(([family, members]) => consolidateFamily(family, members));
}

function consolidateFamily(family: string, members: ManagedProduct[]): ManagedProduct {
  const canonical = pickCanonical(family, members);
  let variants = uniqueVariants(members.flatMap((item) => item.variants?.length ? item.variants : [fallbackVariant(item)]));
  // Nhieu ban ghi (moi ban mot dung luong): xep bien the tu nho den lon.
  if (members.length > 1) variants = sortByCapacity(variants);
  const images = uniqueValues([
    canonical.image,
    ...members.flatMap((item) => item.images?.length ? item.images : [item.image]),
    ...variants.map((variant) => variant.image),
  ]).slice(0, MAX_GALLERY_IMAGES);
  const variantColors = variants
    .filter((variant) => variant.color)
    .filter((variant, index, list) => list.findIndex((item) => normalizeOption(item.color) === normalizeOption(variant.color)) === index)
    .map((variant) => ({ name: variant.color as string, hex: variant.colorHex || "#111111" }))
    // Mau da luu san (co the kem anh) thi dung ban da luu.
    .map((color) => canonical.colorOptions?.find((option) => normalizeOption(option.name) === normalizeOption(color.name)) ?? color);
  const colorOptions = variantColors.length ? variantColors : canonical.colorOptions ?? [];
  const variantStorages = uniqueValues(variants.map((variant) => variant.storage));
  const lowestPrice = variants
    .map((variant) => moneyValue(variant.price))
    .filter((price) => price > 0)
    .sort((left, right) => left - right)[0];
  const name = cleanPublicProductName(canonical.name);

  return {
    ...canonical,
    slug: family,
    name,
    tagline: canonical.tagline || `Chọn dung lượng, màu sắc và xem giá chi tiết của ${name}.`,
    price: lowestPrice ? formatMoney(lowestPrice) : canonical.price,
    sellingPrice: lowestPrice ? formatMoney(lowestPrice) : canonical.sellingPrice,
    image: images[0] ?? canonical.image,
    images,
    variants,
    colors: variantColors.length ? variantColors.map((color) => color.hex) : canonical.colors,
    colorOptions,
    storageOptions: variantStorages.length ? variantStorages : canonical.storageOptions ?? [],
    stock: members.reduce((total, item) => total + Number(item.stock ?? 0), 0),
  };
}

/** Xep theo thu tu da luu (sortOrder nho truoc); san pham chua co thu tu giu nguyen vi tri tuong doi, xep sau. */
export function sortByCatalogOrder<T extends { sortOrder?: number }>(products: T[]): T[] {
  if (!products.some((product) => product.sortOrder != null)) return products;
  return products
    .map((product, index) => ({ product, index }))
    .sort((left, right) =>
      (left.product.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.product.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || left.index - right.index)
    .map((item) => item.product);
}

/** Dong chinh cua dong may (lay ten, mo ta, thong so): dung slug cua dong may, khong thi slug ngan nhat, tao som nhat. */
export function pickCanonical<T extends { slug: string; createdAt: number }>(family: string, members: T[]): T {
  return members.find((item) => item.slug === family)
    ?? [...members].sort((left, right) =>
      left.slug.length - right.slug.length || left.createdAt - right.createdAt || left.slug.localeCompare(right.slug))[0];
}

export function publicFamilyKey(slug: string) {
  return slug.replace(/-(?:128gb|256gb|512gb|1tb|2tb)$/i, "");
}

/** San pham chua khai bien the: tao mot bien the tu gia/ton cua chinh no. */
function fallbackVariant(item: ManagedProduct): ProductVariant {
  const storage = inferStorage(item.name, item.specs);
  return {
    id: `${item.slug}-${storage || "base"}`,
    name: storage || cleanPublicProductName(item.name),
    storage,
    price: item.salePrice || item.sellingPrice || item.price,
    stock: item.stock,
    image: item.image,
  };
}

function cleanPublicProductName(name: string) {
  return name
    .replace(/^Điện thoại\s+/i, "")
    .replace(/\s*\|\s*(?:Chính hãng|Chính hãng VN\/A|Chính hãng Apple Việt Nam).*$/i, "")
    .replace(/\b(\d+)\s*(GB|TB)\b/gi, (full, amount, unit) => unit.toUpperCase() === "TB" || Number(amount) >= 128 ? "" : full)
    .replace(/\s{2,}/g, " ")
    .trim();
}

function uniqueVariants(variants: ProductVariant[]) {
  const keyOf = (variant: ProductVariant) =>
    [variant.storage, variant.ram, variant.version, variant.color].map(normalizeOption).join("|");
  return variants.filter((variant, index, list) => list.findIndex((item) => keyOf(item) === keyOf(variant)) === index);
}

/** Sap xep on dinh theo RAM roi dung luong (GB/TB). */
function sortByCapacity(variants: ProductVariant[]) {
  return variants
    .map((variant, index) => ({ variant, index }))
    .sort((left, right) =>
      capacity(left.variant.ram) - capacity(right.variant.ram)
      || capacity(left.variant.storage) - capacity(right.variant.storage)
      || left.index - right.index)
    .map((item) => item.variant);
}

function capacity(value?: string) {
  const match = (value ?? "").match(/(\d+)\s*(GB|TB)/i);
  if (!match) return 0;
  return Number(match[1]) * (match[2].toUpperCase() === "TB" ? 1024 : 1);
}

function inferStorage(name: string, specs: string[]) {
  const matches = [...`${name} ${specs.join(" ")}`.matchAll(/\b(\d+(?:\.\d+)?)\s*(TB|GB)\b/gi)]
    .map((match) => `${match[1]}${match[2].toUpperCase()}`)
    // Bo cac con so la dung luong RAM.
    .filter((value) => !/^(4|6|8|12|16|18|24|32|48|64|96)GB$/.test(value));
  return matches[0] ?? "";
}

function uniqueValues(values: Array<string | undefined>) {
  return values
    .filter((value): value is string => Boolean(value?.trim()))
    .filter((value, index, list) => list.indexOf(value) === index);
}

function moneyValue(value?: string) {
  return Number((value ?? "").replace(/\D/g, "")) || 0;
}

/** Danh muc da ngung kinh doanh: khong hien tren cua hang lan trang quan tri. */
export const REMOVED_CATEGORIES = ["samsung", "samsung-cu"];

export function isRemovedCategory(category: string) {
  return REMOVED_CATEGORIES.includes(category);
}

/** Tinh trang may cua du lieu mau: ten co "Like New", "cu" hoac "98%/99%" la may da qua su dung. */
export function seedCondition(product: { condition?: string; name: string; slug: string }): "new" | "like-new" {
  if (product.condition === "new" || product.condition === "like-new") return product.condition;
  const name = product.name.toLowerCase();
  return name.includes("like new") || name.includes("cũ") || /\b9\d\s?%/.test(name) || product.slug.includes("like-new") ? "like-new" : "new";
}

export function conditionLabel(condition: string) {
  return condition === "like-new" ? "Like New - Đã qua sử dụng" : "New";
}

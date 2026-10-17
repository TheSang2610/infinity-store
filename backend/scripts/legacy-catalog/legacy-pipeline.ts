// Logic hien thi san pham (khong dung CSDL): bo sung du lieu tu catalog mau,
// gop cac ban 128GB/256GB... cua cung mot dong may thanh mot san pham co bien the.
// Chuyen nguyen tu db/products.ts cua ban cu, chi tach khoi phan truy van.

import catalogEnrichment from "./data/catalog-enrichment.json";
import { applyCurrentCatalogOverride } from "./data/current-catalog";
import { buildDisplaySpecs } from "./data/product-specs";
import { products as rawSeedProducts } from "./data/products";
import { formatMoney, normalizeOption } from "../../src/utils/http";
import type { ManagedProduct, Product, ProductVariant } from "../../src/types";

const catalogImageOverrides: Record<string, string> = {
  "oppo-a3-pro": "/products/oppo-a3-pro.png",
  "oppo-find-x8-pro": "/products/oppo-find-x8-pro.png",
  "oppo-reno-13-pro": "/products/oppo-reno-13-pro.png",
  "xiaomi-14t-pro": "/products/xiaomi-14t-pro.png",
  "xiaomi-15": "/products/xiaomi-15.png",
  "xiaomi-15-ultra": "/products/xiaomi-15-ultra.png",
  "redmi-14c": "/products/redmi-14c.jpg",
  "redmi-note-14-pro": "/products/redmi-note-14-pro.png",
};

/** Catalog mau = danh sach san pham trong source + du lieu bo sung (anh, mau, link). */
export const seedProducts: Product[] = rawSeedProducts.map((product) => ({
  ...product,
  ...((catalogEnrichment as Record<string, Partial<Product>>)[product.slug] ?? {}),
}));

const seedBySlug = new Map(seedProducts.map((product) => [product.slug, product]));

/** Bo sung bien the, mau, dung luong, thong so hien thi cho mot san pham trong CSDL. */
export function enrichProduct(product: ManagedProduct): ManagedProduct {
  const seed = seedBySlug.get(product.slug);
  const variants = product.variants?.length ? product.variants : seed?.variants ?? [];
  const variantStorages = uniqueValues(variants.map((variant) => variant.storage));
  const inferredStorage = inferStorage(product.name, product.specs);
  const variantColors = variants
    .filter((variant) => variant.color)
    .filter((variant, index, list) => list.findIndex((item) => item.color === variant.color) === index)
    .map((variant) => ({ name: variant.color as string, hex: variant.colorHex || "#111111" }));

  return {
    ...product,
    image: catalogImageOverrides[product.slug] ?? product.image,
    images: uniqueValues([
      catalogImageOverrides[product.slug],
      product.image,
      ...(product.images ?? []),
      seed?.image,
      ...(seed?.images ?? []),
      ...variants.map((variant) => variant.image),
    ]).slice(0, 24),
    specs: buildDisplaySpecs(product),
    variants,
    colorOptions: variantColors.length ? variantColors : product.colorOptions ?? seed?.colorOptions,
    storageOptions: variantStorages.length
      ? variantStorages
      : product.storageOptions?.length
        ? product.storageOptions
        : seed?.storageOptions?.length
          ? seed.storageOptions
          : inferredStorage
            ? [inferredStorage]
            : [],
    mediaLinks: product.mediaLinks ?? seed?.mediaLinks,
  };
}

/** Gop "iphone-17-256gb", "iphone-17-512gb"... thanh mot san pham "iphone-17". */
export function consolidatePublicProducts(products: ManagedProduct[]): ManagedProduct[] {
  const families = new Map<string, ManagedProduct[]>();
  for (const product of products) {
    const key = publicFamilyKey(product.slug);
    families.set(key, [...(families.get(key) ?? []), product]);
  }

  return [...families.entries()].map(([family, members]) => {
    const canonical = members.find((item) => item.slug === family)
      ?? [...members].sort((left, right) => left.slug.length - right.slug.length)[0];
    const variants = uniqueVariants(members.flatMap((item) => item.variants?.length ? item.variants : [fallbackVariant(item)]));
    const images = uniqueValues([
      canonical.image,
      ...members.flatMap((item) => item.images ?? [item.image]),
      ...variants.map((variant) => variant.image),
    ]).slice(0, 24);
    const colorOptions = variants
      .filter((variant) => variant.color)
      .filter((variant, index, list) => list.findIndex((item) => normalizeOption(item.color) === normalizeOption(variant.color)) === index)
      .map((variant) => ({ name: variant.color as string, hex: variant.colorHex || "#a8adb4" }));
    const lowestPrice = variants
      .map((variant) => moneyValue(variant.price))
      .filter((price) => price > 0)
      .sort((left, right) => left - right)[0];
    const name = cleanPublicProductName(canonical.name);

    return applyCurrentCatalogOverride(enrichProduct({
      ...canonical,
      slug: family,
      name,
      tagline: `Chọn dung lượng, màu sắc và xem giá chi tiết của ${name}.`,
      price: lowestPrice ? formatMoney(lowestPrice) : canonical.price,
      sellingPrice: lowestPrice ? formatMoney(lowestPrice) : canonical.sellingPrice,
      image: images[0] ?? canonical.image,
      images,
      variants,
      colors: colorOptions.length ? colorOptions.map((color) => color.hex) : canonical.colors,
      colorOptions: colorOptions.length ? colorOptions : canonical.colorOptions,
      storageOptions: uniqueValues(variants.map((variant) => variant.storage)),
      stock: members.reduce((total, item) => total + Number(item.stock ?? 0), 0),
    }));
  });
}

export function publicFamilyKey(slug: string) {
  return slug.replace(/-(?:128gb|256gb|512gb|1tb|2tb)$/i, "");
}

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

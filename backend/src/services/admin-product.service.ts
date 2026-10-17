import { randomUUID } from "node:crypto";
import { badRequest } from "../utils/http";
import { slugify } from "../utils/http";
import type { ProductCategory, ProductStatus, ProductVariant } from "../types";
import { saveImage } from "./file-storage.service";
import * as repo from "../repositories/product.repository";

export const PRODUCT_CATEGORIES: readonly ProductCategory[] = [
  "iphone", "android", "ipad", "tablet",
  "macbook", "macbook-air", "macbook-pro", "mac-mini-studio", "imac",
  "laptop", "laptop-cu", "smartwatch", "audio", "phu-kien", "may-anh",
];

/**
 * Vercel gioi han moi request 4,5 MB nen moi anh toi da 4 MB (ban Cloudflare cu cho 20 MB).
 * Doi bang bien MAX_PRODUCT_IMAGE_MB neu backend chay o noi khac.
 */
export const MAX_IMAGE_BYTES = (Number(process.env.MAX_PRODUCT_IMAGE_MB) || 4) * 1024 * 1024;

export type UploadedFile = { fieldname: string; originalname: string; size: number; buffer: Buffer };

/** Truong text cua form san pham (giu dung ten truong cua form cu). */
export type AdminProductFields = Record<string, string | undefined>;

/**
 * Tao moi hoac cap nhat san pham tu form quan tri.
 * Kiem tra het du lieu TRUOC roi moi tai anh len, de loi nhap lieu khong de lai anh rac.
 */
export async function saveAdminProduct(fields: AdminProductFields, files: UploadedFile[]) {
  const field = (key: string) => (fields[key] ?? "").trim();

  const name = field("name");
  const brand = field("brand");
  if (!name || !brand) throw badRequest("Vui lòng nhập tên sản phẩm và hãng.");
  const category = field("category") as ProductCategory;
  if (!PRODUCT_CATEGORIES.includes(category)) throw badRequest("Danh mục sản phẩm chưa hợp lệ.");

  const existingId = field("id");
  const previous = existingId ? await repo.findProductById(existingId) : undefined;
  if (existingId && !previous) throw badRequest("Sản phẩm cần sửa không còn tồn tại.");
  const id = existingId || randomUUID();

  const slug = slugify(field("slug") || previous?.slug || name);
  if (!slug) throw badRequest("Đường dẫn sản phẩm chưa hợp lệ.");
  if (await repo.slugTakenByOther(slug, id)) throw badRequest(`Đường dẫn "${slug}" đã được sản phẩm khác dùng.`);

  const galleryFiles = files.filter((file) => file.fieldname === "imageFiles" && file.size > 0);
  const variantFiles = new Map(files.filter((file) => file.fieldname.startsWith("variantImage_") && file.size > 0)
    .map((file) => [file.fieldname.slice("variantImage_".length), file]));
  for (const file of [...galleryFiles, ...variantFiles.values()]) {
    if (file.size > MAX_IMAGE_BYTES) throw badRequest(`Ảnh ${file.originalname} lớn hơn ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
  }

  const existingImages = splitValues(field("existingImages"), "\n");
  const primaryUploadIndex = Number(field("primaryUploadIndex"));
  const primaryFromUpload = Number.isInteger(primaryUploadIndex) && primaryUploadIndex >= 0 && primaryUploadIndex < galleryFiles.length;
  const primaryExisting = field("primaryImage");
  if (!primaryFromUpload) {
    const primary = primaryExisting || existingImages[0];
    if (!primary && !galleryFiles.length) throw badRequest("Hãy tải ít nhất một ảnh sản phẩm lên.");
    if (primary && !primary.startsWith("/") && !primary.startsWith("https://")) {
      throw badRequest("Ảnh chính phải là ảnh upload hoặc đường dẫn HTTPS.");
    }
    if (primaryExisting && !existingImages.includes(primaryExisting)) {
      throw badRequest("Ảnh chính phải nằm trong bộ ảnh sản phẩm đang giữ lại.");
    }
  }

  const status = normalizeStatus(field("status"));
  const variantsInput = parseVariants(field("variantsJson"), category);

  // Du lieu da hop le, gio moi tai anh.
  const uploaded: string[] = [];
  for (const file of galleryFiles) uploaded.push(await saveImage(file.buffer, { label: `Ảnh ${file.originalname}` }));
  const variants: ProductVariant[] = [];
  for (const variant of variantsInput) {
    const file = variantFiles.get(variant.id);
    variants.push(file ? { ...variant, image: await saveImage(file.buffer, { label: `Ảnh ${file.originalname}` }) } : variant);
  }

  const primaryImage = primaryFromUpload ? uploaded[primaryUploadIndex] : primaryExisting || existingImages[0] || uploaded[0];
  const images = uniqueValues([primaryImage, ...existingImages, ...uploaded, ...variants.map((variant) => variant.image)]);
  const sellingPrice = field("sellingPrice") || field("price") || previous?.price || "Liên hệ giá tốt";

  await repo.upsertProduct({
    id,
    slug,
    name,
    brand,
    category,
    sku: field("sku"),
    description: field("description"),
    image: primaryImage,
    images,
    badge: field("badge") || (status === "draft" ? "Nháp" : "Mới"),
    tagline: field("tagline") || field("description") || `Khám phá ${name} tại Infinity Store.`,
    price: sellingPrice,
    costPrice: field("costPrice"),
    sellingPrice,
    salePrice: field("salePrice"),
    // Co bien the thi ton kho = tong ton cac bien the dang ban.
    stock: variants.length
      ? variants.filter((variant) => variant.status !== "inactive").reduce((total, variant) => total + Math.max(0, Number(variant.stock) || 0), 0)
      : Math.max(0, Number(field("stock")) || 0),
    status,
    tags: splitValues(field("tags"), ","),
    seoTitle: field("seoTitle"),
    seoDescription: field("seoDescription"),
    variants,
    colors: splitValues(field("colors"), ",", ["#111111"]),
    specs: splitValues(field("specs"), "\n", ["Liên hệ để được xác nhận"]),
    // Form chua co o sua cac truong nay: giu nguyen gia tri dang luu.
    colorOptions: previous?.colorOptions,
    storageOptions: previous?.storageOptions,
    mediaLinks: previous?.mediaLinks,
    sortOrder: previous?.sortOrder,
    featured: field("featured") === "on",
    active: status === "active",
    source: field("source"),
  });

  return { id, slug };
}

function normalizeStatus(raw: string): ProductStatus {
  return raw === "draft" || raw === "inactive" ? raw : "active";
}

function parseVariants(raw: string, category: ProductCategory): ProductVariant[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    throw badRequest("Danh sách biến thể không đúng định dạng.");
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const storage = normalizeStorage(String(item.storage ?? ""));
      const ram = normalizeRam(String(item.ram ?? ""));
      const color = String(item.color ?? "").trim();
      const version = String(item.version ?? "").trim();
      const size = normalizeScreenSize(String(item.size ?? ""));
      return {
        id: String(item.id ?? "").trim() || randomUUID(),
        name: String(item.name ?? "").trim() || variantName(category, { storage, ram, color, version, size }),
        color,
        colorHex: /^#[0-9a-f]{6}$/i.test(String(item.colorHex ?? "")) ? String(item.colorHex) : "#111111",
        size,
        ram,
        storage,
        version,
        sku: String(item.sku ?? "").trim(),
        barcode: String(item.barcode ?? "").trim(),
        costPrice: String(item.costPrice ?? "").trim(),
        price: String(item.price ?? "").trim(),
        salePrice: String(item.salePrice ?? "").trim(),
        stock: Math.max(0, Number(item.stock) || 0),
        status: item.status === "inactive" ? "inactive" as const : "active" as const,
        serials: Array.isArray(item.serials) ? item.serials.map(String).map((serial) => serial.trim()).filter(Boolean) : [],
        image: String(item.image ?? "").trim(),
      };
    })
    .filter((item) => item.name || item.storage || item.color || item.ram || item.version);
}

function normalizeRam(raw: string) {
  const value = raw.trim().replace(/\s+/g, "").toUpperCase();
  if (!value) return "";
  if (/^\d+$/.test(value)) return `${value}GB`;
  return value.replace(/G$/, "GB");
}

function normalizeStorage(raw: string) {
  const value = raw.trim().replace(/\s+/g, "").toUpperCase();
  if (!value) return "";
  // "1", "2" la TB; "128", "256" la GB.
  if (/^\d+$/.test(value)) return `${value}${Number(value) <= 8 ? "TB" : "GB"}`;
  return value.replace(/G$/, "GB").replace(/T$/, "TB");
}

function normalizeScreenSize(raw: string) {
  const value = raw.trim().replace(",", ".");
  if (!value) return "";
  return /^\d+(?:\.\d+)?$/.test(value) ? `${value} inch` : value;
}

const COMPUTER_CATEGORIES: ProductCategory[] = ["macbook", "macbook-air", "macbook-pro", "mac-mini-studio", "imac", "laptop", "laptop-cu"];

function variantName(category: ProductCategory, values: { storage: string; ram: string; color: string; version: string; size: string }) {
  const parts = COMPUTER_CATEGORIES.includes(category)
    ? [values.version, values.ram && `RAM ${values.ram}`, values.storage && `SSD ${values.storage}`, values.size, values.color]
    : category === "ipad"
      ? [values.storage, values.version, values.size, values.color]
      : [values.storage, values.ram && `RAM ${values.ram}`, values.version, values.color];
  return parts.filter(Boolean).join(" · ");
}

function splitValues(raw: string, separator: string, fallback: string[] = []) {
  const values = raw.split(separator).map((item) => item.trim()).filter(Boolean);
  return values.length ? values : fallback;
}

function uniqueValues(values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value)).filter((value, index, list) => list.indexOf(value) === index);
}

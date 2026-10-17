import type { Product, ProductColor, ProductVariant } from "./products";
import laptopImageManifest from "./laptop-image-manifest.json";
import productColorCatalog from "./product-color-catalog.json";

type ColorAsset = ProductColor & { image: string };
type StoragePrice = { storage: string; price: string };

const verifiedLaptopImages = laptopImageManifest as Record<string, { path?: string; curated?: boolean }>;

/**
 * Ảnh theo từng màu cho mọi dòng iPhone và MacBook đang bán (tên màu chính thức của Apple Việt Nam).
 * Mỗi ảnh đã được đối chiếu thủ công đúng đời máy và đúng màu.
 */
const catalogColors = productColorCatalog as Record<string, ColorAsset[]>;

const correctedProductImages: Record<string, string> = {
  "rog-zephyrus-g14-rtx5070ti": "/products/expanded/rog-zephyrus-g14-2025.png",
  "rog-zephyrus-g14-rtx5080": "/products/expanded/rog-zephyrus-g14-2025.png",
  "rog-zephyrus-g16-rtx5070ti": "/products/expanded/rog-zephyrus-g16-2025.png",
  "rog-zephyrus-g16-rtx5080": "/products/expanded/rog-zephyrus-g16-2025.png",
  "rog-strix-scar16-rtx5080": "/products/expanded/rog-scar16-2025.png",
  "rog-strix-scar18-2026-rtx5090": "/products/expanded/rog-scar18-2025.png",
};

function phoneVariants(
  slug: string,
  storages: StoragePrice[],
  colors: ColorAsset[],
): ProductVariant[] {
  return storages.flatMap((storage) => colors.map((color) => ({
    id: `${slug}-${storage.storage}-${color.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: `${storage.storage} / ${color.name}`,
    storage: storage.storage,
    color: color.name,
    colorHex: color.hex,
    price: storage.price,
    stock: 1,
    image: color.image,
  })));
}

const iphone17Colors = catalogColors["iphone-17"];

const iphone17ProColors = catalogColors["iphone-17-pro"];

const iphone17ProMaxColors = catalogColors["iphone-17-pro-max"];

const iphoneAirColors = catalogColors["iphone-air"];

const iphone17eColors = catalogColors["iphone-17e"];

const iphone17Storage = [
  { storage: "256GB", price: "23.890.000đ" },
  { storage: "512GB", price: "29.790.000đ" },
];

const iphone17ProStorage = [
  { storage: "256GB", price: "31.990.000đ" },
  { storage: "512GB", price: "38.490.000đ" },
  { storage: "1TB", price: "44.990.000đ" },
];

const iphone17ProMaxStorage = [
  { storage: "256GB", price: "34.590.000đ" },
  { storage: "512GB", price: "41.490.000đ" },
  { storage: "1TB", price: "47.990.000đ" },
  { storage: "2TB", price: "60.490.000đ" },
];

const iphoneAirStorage = [
  { storage: "256GB", price: "22.990.000đ" },
  { storage: "512GB", price: "29.490.000đ" },
  { storage: "1TB", price: "35.990.000đ" },
];

const iphone17eStorage = [
  { storage: "256GB", price: "17.490.000đ" },
  { storage: "512GB", price: "23.990.000đ" },
];

export const currentCatalogOverrides: Record<string, Partial<Product>> = {
  "iphone-17-pro": {
    name: "iPhone 17 Pro",
    image: iphone17ProColors[0].image,
    images: [...iphone17ProColors.map((color) => color.image), "/products/details/iphone-17-pro/detail-1-6fcb9726.png", "/products/details/iphone-17-pro/detail-2-580ac396.webp", "/products/details/iphone-17-pro/detail-3-a7fe2a22.webp", "/products/details/iphone-17-pro/detail-4-87a73a15.webp"],
    badge: "A19 Pro",
    tagline: "Thiết kế nhôm nguyên khối, camera Pro Fusion 48MP và hiệu năng A19 Pro.",
    description: "iPhone 17 Pro kết hợp màn hình Super Retina XDR 6,3 inch, ProMotion, hệ thống camera chuyên nghiệp và chip A19 Pro.",
    price: iphone17ProStorage[0].price,
    sellingPrice: iphone17ProStorage[0].price,
    variants: phoneVariants("iphone-17-pro", iphone17ProStorage, iphone17ProColors),
    colors: iphone17ProColors.map((color) => color.hex),
    colorOptions: iphone17ProColors,
    storageOptions: iphone17ProStorage.map((item) => item.storage),
    specs: ["Màn hình Super Retina XDR 6,3 inch", "ProMotion lên đến 120Hz", "Chip Apple A19 Pro", "Camera Pro Fusion 48MP", "Camera trước Center Stage", "Khung nhôm nguyên khối", "Nút Điều Khiển Camera và Nút Tác Vụ", "Hỗ trợ 5G và MagSafe"],
    mediaLinks: [{ label: "Xem iPhone 17 Pro trên Apple", url: "https://www.apple.com/vn/iphone-17-pro/" }],
    source: "https://www.apple.com/vn/iphone-17-pro/specs/",
  },
  "iphone-17-pro-max": {
    name: "iPhone 17 Pro Max",
    image: iphone17ProMaxColors[0].image,
    images: [...iphone17ProMaxColors.map((color) => color.image), "/products/details/iphone-17-pro-max/detail-1-68b70cb4.webp", "/products/details/iphone-17-pro-max/detail-2-4745f229.webp", "/products/details/iphone-17-pro-max/detail-3-c552d2e3.webp", "/products/details/iphone-17-pro-max/detail-4-4603a242.webp"],
    badge: "Pro Max",
    tagline: "Màn hình 6,9 inch, camera Pro Fusion 48MP và thời lượng pin dài nhất dòng iPhone 17.",
    description: "iPhone 17 Pro Max dành cho người cần màn hình lớn, camera linh hoạt và dung lượng lưu trữ lên đến 2TB.",
    price: iphone17ProMaxStorage[0].price,
    sellingPrice: iphone17ProMaxStorage[0].price,
    variants: phoneVariants("iphone-17-pro-max", iphone17ProMaxStorage, iphone17ProMaxColors),
    colors: iphone17ProMaxColors.map((color) => color.hex),
    colorOptions: iphone17ProMaxColors,
    storageOptions: iphone17ProMaxStorage.map((item) => item.storage),
    specs: ["Màn hình Super Retina XDR 6,9 inch", "ProMotion lên đến 120Hz", "Chip Apple A19 Pro", "Camera Pro Fusion 48MP", "Zoom quang học đa tiêu cự", "Camera trước Center Stage", "Dung lượng đến 2TB", "Hỗ trợ 5G và MagSafe"],
    mediaLinks: [{ label: "Xem iPhone 17 Pro Max trên Apple", url: "https://www.apple.com/vn/iphone-17-pro/" }],
    source: "https://www.apple.com/vn/iphone-17-pro/specs/",
  },
  "iphone-17": {
    name: "iPhone 17",
    image: iphone17Colors[2].image,
    images: [...iphone17Colors.map((color) => color.image), "/products/details/iphone-17-256gb/detail-1-fcd1b33c.webp", "/products/details/iphone-17-256gb/detail-2-2be21966.webp", "/products/details/iphone-17-256gb/detail-3-8369ff10.webp", "/products/details/iphone-17-256gb/detail-4-1885e4a7.webp"],
    badge: "Mới",
    tagline: "Màn hình 6,3 inch ProMotion, chip A19 và năm màu hoàn thiện.",
    description: "iPhone 17 có màn hình Super Retina XDR 6,3 inch với ProMotion, chip A19 và hệ thống camera Dual Fusion 48MP.",
    price: iphone17Storage[0].price,
    sellingPrice: iphone17Storage[0].price,
    variants: phoneVariants("iphone-17", iphone17Storage, iphone17Colors),
    colors: iphone17Colors.map((color) => color.hex),
    colorOptions: iphone17Colors,
    storageOptions: iphone17Storage.map((item) => item.storage),
    specs: ["Màn hình Super Retina XDR 6,3 inch", "ProMotion lên đến 120Hz", "Chip Apple A19", "Camera Dual Fusion 48MP", "Camera trước Center Stage", "Ceramic Shield 2", "Nút Điều Khiển Camera", "Hỗ trợ 5G và MagSafe"],
    mediaLinks: [{ label: "Xem iPhone 17 trên Apple", url: "https://www.apple.com/vn/iphone-17/" }],
    source: "https://www.apple.com/vn/iphone-17/specs/",
  },
  "iphone-air": {
    name: "iPhone Air",
    image: iphoneAirColors[0].image,
    images: [...iphoneAirColors.map((color) => color.image), "/products/details/iphone-air-256gb/detail-1-0aba6995.jpg", "/products/details/iphone-air-256gb/detail-2-093b563a.webp", "/products/details/iphone-air-256gb/detail-3-f35bdc3b.webp", "/products/details/iphone-air-256gb/detail-4-f29fc3b4.webp"],
    badge: "Mỏng nhẹ",
    tagline: "Thiết kế titan siêu mỏng, màn hình 6,5 inch và chip A19 Pro.",
    description: "iPhone Air ưu tiên thiết kế mỏng nhẹ nhưng vẫn có màn hình ProMotion, chip A19 Pro và camera Fusion 48MP.",
    price: iphoneAirStorage[0].price,
    sellingPrice: iphoneAirStorage[0].price,
    variants: phoneVariants("iphone-air", iphoneAirStorage, iphoneAirColors),
    colors: iphoneAirColors.map((color) => color.hex),
    colorOptions: iphoneAirColors,
    storageOptions: iphoneAirStorage.map((item) => item.storage),
    specs: ["Màn hình Super Retina XDR 6,5 inch", "ProMotion lên đến 120Hz", "Chip Apple A19 Pro", "Camera Fusion 48MP", "Khung titan siêu mỏng", "Camera trước Center Stage", "Nút Điều Khiển Camera", "Hỗ trợ 5G và MagSafe"],
    mediaLinks: [{ label: "Xem iPhone Air trên Apple", url: "https://www.apple.com/vn/iphone-air/" }],
    source: "https://www.apple.com/vn/iphone-air/specs/",
  },
  "iphone-17e": {
    name: "iPhone 17e",
    image: iphone17eColors[2].image,
    images: [
      ...iphone17eColors.map((color) => color.image),
      "/products/details/iphone-17e/detail-1-99fa1e0d.webp",
      "/products/details/iphone-17e/detail-2-1afb6514.webp",
    ],
    badge: "A19",
    tagline: "iPhone dễ tiếp cận với chip A19, camera Fusion 48MP và ba màu.",
    description: "iPhone 17e có màn hình Super Retina XDR 6,1 inch, chip A19, camera Fusion 48MP và bộ nhớ khởi điểm 256GB.",
    price: iphone17eStorage[0].price,
    sellingPrice: iphone17eStorage[0].price,
    variants: phoneVariants("iphone-17e", iphone17eStorage, iphone17eColors),
    colors: iphone17eColors.map((color) => color.hex),
    colorOptions: iphone17eColors,
    storageOptions: iphone17eStorage.map((item) => item.storage),
    specs: ["Màn hình Super Retina XDR 6,1 inch", "Chip Apple A19", "Camera Fusion 48MP", "Camera trước 12MP", "Bộ nhớ từ 256GB", "Nút Tác Vụ", "Hỗ trợ 5G", "Hệ điều hành iOS"],
    mediaLinks: [{ label: "Xem iPhone 17e trên Apple", url: "https://www.apple.com/vn/iphone-17e/" }],
    source: "https://www.apple.com/vn/iphone-17e/specs/",
  },
};

export const catalogProductOrder: Partial<Record<Product["category"], string[]>> = {
  iphone: ["iphone-18-pro-max", "iphone-18-pro", "iphone-17-pro-max", "iphone-17-pro", "iphone-17", "iphone-air", "iphone-17e"],
  macbook: ["macbook-pro-16-m5-max", "macbook-pro-16-m5-pro", "macbook-pro-14-m5-max", "macbook-pro-14-m5-pro", "macbook-pro-14-m5", "macbook-air-15-m5", "macbook-air-13-m5", "macbook-neo-a18-pro"],
  "mac-mini-studio": ["mac-mini-m4", "mac-mini-m4-pro", "mac-studio-m4-max", "mac-studio-m3-ultra"],
  imac: ["imac-24-m4-10cpu-10gpu", "imac-24-m4-8cpu-8gpu", "imac-24-m3-8cpu-10gpu", "imac-24-m3-8cpu-8gpu"],
};

/**
 * Ghep noi dung chuan (anh, mo ta, mau) vao san pham tu CSDL.
 * Gia va ton kho LUON lay tu CSDL: truoc day bang gia cung trong file nay de len gia admin dat,
 * nen doi gia iPhone 17 trong trang quan tri ma cua hang, don hang va QR van tinh gia cu.
 */
export function applyCurrentCatalogOverride<T extends Product>(product: T): T {
  const override = currentCatalogOverrides[product.slug];
  const merged = override ? withDatabasePricing(product, override) : product;
  const overridden = applyColorCatalog(merged);
  const laptopImage = product.category === "laptop" && verifiedLaptopImages[product.slug]?.curated
    ? verifiedLaptopImages[product.slug]?.path
    : undefined;
  const correctedImage = correctedProductImages[product.slug] ?? laptopImage;
  if (!correctedImage) return overridden;
  return {
    ...overridden,
    image: correctedImage,
    images: [correctedImage, ...(overridden.images ?? []).filter((image) => image !== correctedImage)],
    variants: overridden.variants?.map((variant) => ({ ...variant, image: correctedImage })),
  };
}

export function orderCatalogProducts<T extends Product>(products: T[], category: Product["category"]): T[] {
  const order = catalogProductOrder[category] ?? [];
  if (!order.length) return products;
  const rank = new Map(order.map((slug, index) => [slug, index]));
  return [...products].sort((left, right) => {
    const leftRank = rank.get(left.slug);
    const rightRank = rank.get(right.slug);
    if (leftRank !== undefined || rightRank !== undefined) {
      return (leftRank ?? Number.MAX_SAFE_INTEGER) - (rightRank ?? Number.MAX_SAFE_INTEGER);
    }
    return left.name.localeCompare(right.name, "vi");
  });
}

/** Gắn ảnh đúng màu cho từng biến thể iPhone/MacBook và loại ảnh của dòng máy khác khỏi thư viện ảnh. */
function applyColorCatalog<T extends Product>(product: T): T {
  const colors = product.category === "iphone" || product.category === "macbook" ? catalogColors[product.slug] : undefined;
  if (!colors?.length) return product;
  type Config = { ram: string; storage: string; price: string; stock?: number };
  const configs: Config[] = [];
  for (const variant of product.variants ?? []) {
    if (!variant.storage && !variant.ram) continue;
    const price = variant.salePrice || variant.price || product.sellingPrice || product.price;
    const existing = configs.find((item) => item.ram === (variant.ram ?? "") && item.storage === variant.storage);
    if (!existing) configs.push({ ram: variant.ram ?? "", storage: variant.storage ?? "", price, stock: variant.stock });
    else if (priceValue(price) > 0 && (priceValue(existing.price) === 0 || priceValue(price) < priceValue(existing.price))) existing.price = price;
  }
  if (!configs.length) configs.push({ ram: "", storage: "", price: product.sellingPrice || product.price });
  configs.sort((left, right) => storageSize(left.ram) - storageSize(right.ram) || storageSize(left.storage) - storageSize(right.storage));
  const ownDetailImages = (product.images ?? []).filter((image) => isOwnDetailImage(image, product.slug));
  return {
    ...product,
    image: colors[0].image,
    images: [...colors.map((color) => color.image), ...ownDetailImages].slice(0, 16),
    variants: configs.flatMap((config) => colors.map((color) => ({
      id: [product.slug, config.ram, config.storage, color.name].filter(Boolean).join("-").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-"),
      name: [config.ram, config.storage, color.name].filter(Boolean).join(" / "),
      ...(config.ram ? { ram: config.ram } : {}),
      storage: config.storage,
      color: color.name,
      colorHex: color.hex,
      price: config.price,
      stock: config.stock ?? 1,
      image: color.image,
    }))),
    colors: colors.map((color) => color.hex),
    colorOptions: colors,
    storageOptions: uniqueStrings(configs.map((item) => item.storage)),
  };
}

/**
 * Bien the cua bang chuan (moi dung luong x moi mau) nhung gia/ton theo dung luong lay tu CSDL.
 * Dung luong ma CSDL khong con ban (admin da an) thi bo; CSDL khong co thong tin dung luong
 * thi giu bang chuan.
 */
function withDatabasePricing<T extends Product>(product: T, override: Partial<Product>): T {
  const dbVariants = (product.variants ?? []).filter((variant) => variant.status !== "inactive");
  const dbStorages = new Set(dbVariants.map((variant) => normalizeStorage(variant.storage)).filter(Boolean));
  const variants = (override.variants ?? [])
    .filter((variant) => !dbStorages.size || dbStorages.has(normalizeStorage(variant.storage)))
    .map((variant) => {
      const sameStorage = dbVariants.filter((item) => normalizeStorage(item.storage) === normalizeStorage(variant.storage));
      const source = sameStorage.find((item) => item.color && item.color === variant.color) ?? sameStorage[0];
      if (!source) return variant;
      return { ...variant, price: source.salePrice || source.price || variant.price, stock: source.stock ?? 0 };
    });
  const lowest = variants.map((variant) => priceValue(variant.price)).filter((value) => value > 0).sort((left, right) => left - right)[0];
  const price = lowest ? `${new Intl.NumberFormat("vi-VN").format(lowest)}đ` : product.price;
  return {
    ...product,
    ...override,
    variants: variants.length ? variants : product.variants,
    price,
    sellingPrice: price,
    storageOptions: variants.length ? uniqueStrings(variants.map((variant) => variant.storage ?? "")) : product.storageOptions,
  };
}

function normalizeStorage(value?: string) {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

function uniqueStrings(values: string[]) {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

/** Ảnh chỉ có ốp lưng/phụ kiện, không có điện thoại — dễ gây nhầm nên không đưa vào thư viện ảnh máy. */
const accessoryOnlyImages = new Set([
  "/products/details/iphone-15/detail-8-f33a1b70.webp",
  "/products/details/iphone-15-plus/detail-8-99bcf704.png",
  "/products/details/iphone-16e/detail-8-112cf742.webp",
]);

/** Ảnh giới thiệu chính thức chỉ dùng cho đúng đời máy trong ảnh (không trộn ảnh M5 vào đời M1–M4). */
const officialGalleryExtras: Record<string, string[]> = {
  "macbook-air-13-m5": ["/products/apple/macbook-air/apple-hero.png", "/products/apple/macbook-air/apple-display.jpg"],
  "macbook-air-15-m5": ["/products/apple/macbook-air/apple-hero.png", "/products/apple/macbook-air/apple-display.jpg"],
  "macbook-pro-14-m5": ["/products/apple/macbook-pro/apple-display.jpg", "/products/apple/macbook-pro/apple-performance.jpg"],
  "macbook-pro-16-m5-pro": ["/products/apple/macbook-pro/apple-display.jpg", "/products/apple/macbook-pro/apple-performance.jpg"],
};
for (const family of ["macbook-pro-14-m5-pro", "macbook-pro-14-m5-max", "macbook-pro-16-m5-max", "macbook-pro-16-m5-config", "macbook-pro-14-m5-pro-config", "macbook-pro-14-m5-max-config", "macbook-pro-16-m5-max-config"]) {
  officialGalleryExtras[family] = officialGalleryExtras["macbook-pro-14-m5"];
}

function isOwnDetailImage(image: string, family: string) {
  if (accessoryOnlyImages.has(image)) return false;
  if (officialGalleryExtras[family]?.includes(image)) return true;
  const folder = image.match(/^\/products\/details\/([^/]+)\//)?.[1];
  if (!folder || /\/color-/.test(image)) return false;
  return folder === family || new RegExp(`^${family}-(?:128gb|256gb|512gb|1tb|2tb)$`).test(folder);
}

function storageSize(storage: string) {
  const match = storage.match(/(\d+)\s*(GB|TB)/i);
  if (!match) return 0;
  return Number(match[1]) * (match[2].toUpperCase() === "TB" ? 1024 : 1);
}

function priceValue(price?: string) {
  return Number((price ?? "").replace(/\D/g, "")) || 0;
}

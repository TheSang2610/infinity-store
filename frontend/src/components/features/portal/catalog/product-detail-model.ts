import type { Product,ProductColor,ProductVariant } from "@/src/lib/products";
import { PRODUCT_DETAIL } from "@/src/constants/portal/product-detail";

export function normalize(value?: string) {
  return (value ?? "").trim().toLocaleLowerCase("vi");
}

export function matchingVariants(product: Product, storage: string, ram = "") {
  const variants = product.variants ?? [];
  return variants.filter((variant) =>
    variant.status !== "inactive" &&
    (!storage || normalize(variant.storage) === normalize(storage)) &&
    (!ram || normalize(variant.ram) === normalize(ram)),
  );
}

export function colorsForConfiguration(product: Product, storage: string, ram: string): ProductColor[] {
  const variants = matchingVariants(product, storage, ram).filter((variant) => variant.color && variant.stock !== 0);
  const variantColors = variants
    .filter((variant, index, list) => list.findIndex((item) => normalize(item.color) === normalize(variant.color)) === index)
    .map((variant) => ({ name: variant.color as string, hex: variant.colorHex || "#111111" }));

  if (variantColors.length) return variantColors;
  if (product.colorOptions?.length) return product.colorOptions;
  if (product.colors && product.colors.length > 0) {
    return product.colors.map((hex, index) => ({ name: PRODUCT_DETAIL.colorNumber(index + 1), hex }));
  }
  return [{ name: PRODUCT_DETAIL.standard, hex: "#0088cc" }];
}

export function findVariant(product: Product, storage: string, ram: string, color: string): ProductVariant | undefined {
  const candidates = matchingVariants(product, storage, ram);
  return candidates.find((variant) => normalize(variant.color) === normalize(color)) ?? candidates[0];
}

export function uniqueImages(images: Array<string | undefined>) {
  return images.filter((image): image is string => Boolean(image)).filter((image, index, list) => list.indexOf(image) === index);
}

// Map Vietnamese category slugs to friendly display names
export const CATEGORY_NAMES: Record<string, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  macbook: "MacBook",
  "macbook-air": "MacBook Air",
  "macbook-pro": "MacBook Pro",
  "mac-mini-studio": "Mac mini & Mac Studio",
  imac: "iMac",
  android: PRODUCT_DETAIL.categoryAndroid,
  laptop: "Laptop",
  "laptop-cu": "Laptop Like New",
  smartwatch: "Apple Watch & Smartwatch",
  audio: PRODUCT_DETAIL.categoryAudio,
  "phu-kien": PRODUCT_DETAIL.categoryAccessories,
};

// Helper to intelligently extract highlights from specs
export function parseSpecHighlights(specs: string[]) {
  if (!specs || specs.length === 0) return [];

  return specs.slice(0, 4).map((spec) => {
    const text = spec.trim();
    // Check common tech specs keywords
    if (/a19|a18|a17|a16|m4|m5|m3|snapdragon|intel|ryzen/i.test(text)) {
      const match = text.match(/(a\d+\s*pro|m\d+\s*max|m\d+\s*pro|m\d+|snapdragon\s*[\w\d]+|intel\s*[\w\d]+|core\s*ultra\s*\d+|ryzen\s*\w+)/i);
      return {
        badge: match ? match[0].toUpperCase() : PRODUCT_DETAIL.chipEyebrow,
        title: PRODUCT_DETAIL.chipTitle,
        desc: text,
        icon: "⚡",
      };
    }
    if (/120hz|promotion|oled|retina|xdr|amoled|mini-led/i.test(text)) {
      const match = text.match(/(120hz\s*promotion|120hz|oled\s*tandem|ultra\s*retina\s*xdr|retina\s*xdr|amoled|mini-led)/i);
      return {
        badge: match ? match[0].toUpperCase() : PRODUCT_DETAIL.displayEyebrow,
        title: PRODUCT_DETAIL.displayTitle,
        desc: text,
        icon: "✨",
      };
    }
    if (/camera|48mp|108mp|telephoto|fusion|lens|quang học/i.test(text)) {
      const match = text.match(/(\d+mp|fusion|telephoto|zoom\s*\d+x)/i);
      return {
        badge: match ? match[0].toUpperCase() : "CAMERA PRO",
        title: PRODUCT_DETAIL.cameraTitle,
        desc: text,
        icon: "📸",
      };
    }
    if (/titan|nhôm|ceramic|ip68|chống nước|thép/i.test(text)) {
      return {
        badge: "TITANIUM",
        title: PRODUCT_DETAIL.materialTitle,
        desc: text,
        icon: "🛡️",
      };
    }
    if (/pin|sạc|magsafe|mah|giờ/i.test(text)) {
      return {
        badge: PRODUCT_DETAIL.batteryEyebrow,
        title: PRODUCT_DETAIL.batteryTitle,
        desc: text,
        icon: "🔋",
      };
    }
    return {
      badge: PRODUCT_DETAIL.techEyebrow,
      title: PRODUCT_DETAIL.techTitle,
      desc: text,
      icon: "✦",
    };
  });
}

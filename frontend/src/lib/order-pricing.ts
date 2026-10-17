import type { Product } from "@/src/lib/products";

export function moneyToNumber(value?: string) {
  if (!value) return 0;
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

export function productUnitPrice(product?: Product, storage?: string, color?: string, ram?: string) {
  if (!product) return 0;
  const normalizedStorage = normalizeOption(storage);
  const normalizedColor = normalizeOption(color);
  const normalizedRam = normalizeOption(ram);
  const matchingVariants = product.variants?.filter((item) =>
    item.status !== "inactive" &&
    (!normalizedStorage ||
      normalizeOption(item.storage) === normalizedStorage ||
      normalizeOption(item.name).includes(normalizedStorage)) &&
    (!normalizedRam ||
      normalizeOption(item.ram) === normalizedRam ||
      normalizeOption(item.name).includes(normalizedRam)),
  ) ?? [];
  const variant = matchingVariants.find((item) =>
    normalizedColor && normalizeOption(item.color) === normalizedColor,
  ) ?? matchingVariants[0];

  return moneyToNumber(
    variant?.salePrice || variant?.price || product.salePrice || product.sellingPrice || product.price,
  );
}

export function formatOrderMoney(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

/** Bo dau tieng Viet giong sameOption cua backend: "Xanh Dương" va "Xanh Duong" la mot. */
function normalizeOption(value?: string) {
  return (value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d")
    .replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

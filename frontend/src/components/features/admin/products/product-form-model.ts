import type { ManagedProduct } from "@/src/types";
import { PRODUCT_FORM } from "@/src/constants/admin/components";

export type MacbookColor = { name: string; hex: string; note: string };

export const MACBOOK_COLORS: MacbookColor[] = [
  { name: PRODUCT_FORM.colorSilver, hex: "#E3E4E5", note: "MacBook Air & Pro" },
  { name: PRODUCT_FORM.colorSpaceGray, hex: "#7D7E80", note: PRODUCT_FORM.olderMacbooks },
  { name: PRODUCT_FORM.colorSpaceBlack, hex: "#2E2C2E", note: "MacBook Pro" },
  { name: PRODUCT_FORM.colorMidnight, hex: "#2E3642", note: "MacBook Air" },
  { name: PRODUCT_FORM.colorStarlight, hex: "#F0E4D3", note: "MacBook Air" },
  { name: PRODUCT_FORM.colorSkyBlue, hex: "#A7C1D9", note: "MacBook Air" },
  { name: PRODUCT_FORM.colorGold, hex: "#D4B99A", note: PRODUCT_FORM.olderMacbookAirs },
  { name: PRODUCT_FORM.colorRoseGold, hex: "#E5B8A8", note: PRODUCT_FORM.olderMacbooks },
];

export function parseConfigurationValues(raw: string, kind: "ram" | "storage") {
  return Array.from(new Set(raw
    .split(/[,;\n/]+/)
    .map((item) => item.trim().replace(/\s+/g, "").toUpperCase())
    .filter(Boolean)
    .map((item) => {
      if (/^\d+$/.test(item)) return `${item}${kind === "storage" && Number(item) <= 8 ? "TB" : "GB"}`;
      return item.replace(/G$/, "GB").replace(/T$/, "TB");
    })));
}

export function normalizeConfiguration(value?: string) {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

export function parseCustomColors(raw: string): MacbookColor[] {
  return Array.from(new Set(raw.split(/[,;\n]+/).map((color) => color.trim()).filter(Boolean)))
    .map((name) => ({ name, hex: "#7B8794", note: PRODUCT_FORM.customColor }));
}

export function productSpecValue(product: ManagedProduct | undefined, labels: string[]) {
  const prefixes = labels.map((label) => `${label}:`.toLocaleLowerCase("vi"));
  const line = product?.specs?.find((spec) => prefixes.some((prefix) => spec.toLocaleLowerCase("vi").startsWith(prefix)));
  return line?.slice(line.indexOf(":") + 1).trim() ?? "";
}

export function initialMacbookColors(product?: ManagedProduct) {
  if (!product) return [];
  const variantNames = (product.variants ?? []).map((variant) => normalizeConfiguration(variant.color));
  const variantHexes = (product.variants ?? []).map((variant) => normalizeConfiguration(variant.colorHex));
  const productHexes = (product.colors ?? []).map(normalizeConfiguration);
  return MACBOOK_COLORS
    .filter((color) => {
      const aliases = [color.name, color.name.match(/\(([^)]+)\)/)?.[1] ?? ""].map(normalizeConfiguration);
      const hex = normalizeConfiguration(color.hex);
      return aliases.some((alias) => alias && variantNames.includes(alias)) || variantHexes.includes(hex) || productHexes.includes(hex);
    })
    .map((color) => color.name);
}

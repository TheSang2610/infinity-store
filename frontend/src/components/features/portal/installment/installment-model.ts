// Kieu du lieu, hang so va ham phu cua trang mo phong tra gop.
import { INSTALLMENT } from "@/src/constants/portal/installment-page";

export interface SimulatorProductItem {
  slug: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  badge: string;
  tagline: string;
  price: number;
  originalPrice: number;
}

export interface BranchOption {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface InstallmentSimulatorProps {
  products: SimulatorProductItem[];
  branches: BranchOption[];
  initialSlug?: string;
  initialAmount?: number;
  initialCategory?: string;
}

export type EnrichedSimulatorProductItem = SimulatorProductItem & {
  normalizedBrand: string;
};

export function normalizeBrand(raw?: string): string {
  if (!raw) return INSTALLMENT.other;
  const lower = raw.toLowerCase().trim();
  if (lower.includes("apple")) return "Apple";
  if (lower.includes("asus")) return "ASUS";
  if (lower.includes("sony")) return "Sony";
  if (lower.includes("fujifilm")) return "Fujifilm";
  if (lower.includes("canon")) return "Canon";
  if (lower.includes("dji")) return "DJI";
  if (lower.includes("oppo")) return "OPPO";
  if (lower.includes("xiaomi") || lower.includes("redmi")) return "Xiaomi";
  if (lower.includes("dell")) return "Dell";
  if (lower.includes("lenovo") || lower.includes("thinkpad")) return "Lenovo";
  if (lower.includes("hp")) return "HP";
  if (lower.includes("acer")) return "Acer";
  if (lower.includes("msi")) return "MSI";
  return raw.trim();
}

export const BRAND_ICONS: Record<string, string> = {
  Apple: "",
  ASUS: "⚡",
  Sony: "📷",
  Fujifilm: "🎞️",
  OPPO: "🤖",
  Xiaomi: "📱",
  Dell: "💻",
  Canon: "🔴",
  DJI: "🛸",
  Lenovo: "💻",
  HP: "💻",
  Acer: "💻",
  MSI: "🎮",
  Khác: "✦",
};

export const CATEGORY_TABS = [
  { id: "all", label: INSTALLMENT.allCategories, icon: "✦" },
  { id: "iphone", label: "iPhone", icon: "📱" },
  { id: "macbook", label: "MacBook", icon: "💻" },
  { id: "ipad", label: "iPad", icon: "📟" },
  { id: "laptop", label: "Laptop & Gaming", icon: "🎮" },
  { id: "may-anh", label: INSTALLMENT.categoryCamera, icon: "📷" },
  { id: "android", label: "Android", icon: "🤖" },
  { id: "phu-kien", label: INSTALLMENT.categoryAccessories, icon: "🎧" },
];

export const FAQS = [
  {
    q: INSTALLMENT.faq1Question,
    a: INSTALLMENT.faq1Answer,
  },
  {
    q: INSTALLMENT.faq2Question,
    a: INSTALLMENT.faq2Answer,
  },
  {
    q: INSTALLMENT.faq3Question,
    a: INSTALLMENT.faq3Answer,
  },
  {
    q: INSTALLMENT.faq4Question,
    a: INSTALLMENT.faq4Answer,
  },
  {
    q: INSTALLMENT.faq5Question,
    a: INSTALLMENT.faq5Answer,
  },
];

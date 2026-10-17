// Du lieu trang dat truoc MacBook Pro (cau hinh, mau).
import type { PreorderProduct } from "@/src/constants/portal/preorder-products";
import { MACBOOK_SHOWCASE } from "@/src/constants/portal/preorder-page";
import type { Branch,CustomerInfo,PreorderResult } from "./preorder-model";

export type SubmitResult = PreorderResult;

export interface MacBookProShowcaseProps {
  branches: Branch[];
  customer?: CustomerInfo;
  allProducts: PreorderProduct[];
}

export const MBP_VARIANTS = [
  {
    id: "14-m5",
    size: "14",
    chip: "m5",
    chipName: "Chip M5",
    name: "MacBook Pro 14 inch · M5",
    screen: '14.2" Liquid Retina XDR (3024 × 1964)',
    specs: "10-Core CPU · 10-Core GPU · 16GB RAM · 512GB SSD",
    battery: MACBOOK_SHOWCASE.battery24,
    weight: "1.55 kg",
    ports: "3x Thunderbolt 5, HDMI, SDXC, MagSafe 3",
    priceEstimate: MACBOOK_SHOWCASE.price14M5,
  },
  {
    id: "14-m5-pro",
    size: "14",
    chip: "m5-pro",
    chipName: "Chip M5 Pro",
    name: "MacBook Pro 14 inch · M5 Pro",
    screen: '14.2" Liquid Retina XDR (3024 × 1964)',
    specs: "14-Core CPU · 20-Core GPU · 24GB RAM · 1TB SSD",
    battery: MACBOOK_SHOWCASE.battery22,
    weight: "1.60 kg",
    ports: "3x Thunderbolt 5, HDMI, SDXC, MagSafe 3",
    priceEstimate: MACBOOK_SHOWCASE.price14M5Pro,
  },
  {
    id: "16-m5-pro",
    size: "16",
    chip: "m5-pro",
    chipName: "Chip M5 Pro",
    name: "MacBook Pro 16 inch · M5 Pro",
    screen: '16.2" Liquid Retina XDR (3456 × 2234)',
    specs: "14-Core CPU · 20-Core GPU · 24GB RAM · 1TB SSD",
    battery: MACBOOK_SHOWCASE.battery24,
    weight: "2.14 kg",
    ports: "3x Thunderbolt 5, HDMI, SDXC, MagSafe 3",
    priceEstimate: MACBOOK_SHOWCASE.price16M5Pro,
  },
  {
    id: "16-m5-max",
    size: "16",
    chip: "m5-max",
    chipName: "Chip M5 Max",
    name: "MacBook Pro 16 inch · M5 Max",
    screen: '16.2" Liquid Retina XDR (3456 × 2234)',
    specs: "16-Core CPU · 40-Core GPU · 48GB RAM · 1TB SSD",
    battery: MACBOOK_SHOWCASE.battery24,
    weight: "2.16 kg",
    ports: "3x Thunderbolt 5, HDMI, SDXC, MagSafe 3",
    priceEstimate: MACBOOK_SHOWCASE.price16M5Max,
  },
];

export const COLORS = [
  { name: "Space Black", viName: MACBOOK_SHOWCASE.colorSpaceBlack, hex: "#29292b" },
  { name: "Silver", viName: MACBOOK_SHOWCASE.colorSilver, hex: "#d9d9d7" },
];

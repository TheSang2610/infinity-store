// Du lieu trang dat truoc iPhone 18 Pro (mau, dung luong, khau do).
import type { PreorderProduct } from "@/src/constants/portal/preorder-products";
import { IPHONE18_SHOWCASE } from "@/src/constants/portal/preorder-page";
import type { Branch,CustomerInfo,PreorderResult } from "./preorder-model";

export type SubmitResult = PreorderResult & {
  modelName: string;
  storage: string;
  colorName: string;
};

export interface IPhone18ProShowcaseProps {
  branches: Branch[];
  customer?: CustomerInfo;
  allProducts?: PreorderProduct[];
}

export interface ColorOption {
  id: string;
  apiColor: "Burgundy" | "Glacier" | "Black" | "Silver" | "Đỏ Burgundy" | "Băng Thanh" | "Đen" | "Bạc";
  name: string;
  enName: string;
  hex: string;
  accent: string;
  description: string;
  image: string;
}

export interface ApertureStop {
  stop: string;
  diameterPercent: number;
  lightGain: string;
  lightPercent: number;
  dofPercent: number;
  role: string;
  focusType: string;
  description: string;
  scenario: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  {
    id: "burgundy",
    apiColor: "Burgundy",
    name: IPHONE18_SHOWCASE.colorBurgundyTitle,
    enName: "Burgundy Titanium",
    hex: "#713744",
    accent: "#b85c72",
    description: IPHONE18_SHOWCASE.colorBurgundyText,
    image: "/apple-iphone-18-pro/contrast-18pro.jpg",
  },
  {
    id: "glacier",
    apiColor: "Glacier",
    name: IPHONE18_SHOWCASE.colorIceTitle,
    enName: "Glacier Titanium",
    hex: "#b8c8dc",
    accent: "#7f9dbf",
    description: IPHONE18_SHOWCASE.colorIceText,
    image: "/campaigns/apple-iphone-18-pro-colors-official.jpg",
  },
  {
    id: "black",
    apiColor: "Black",
    name: IPHONE18_SHOWCASE.colorBlackTitle,
    enName: "Space Black Titanium",
    hex: "#2b2b2e",
    accent: "#77777c",
    description: IPHONE18_SHOWCASE.colorBlackText,
    image: "/campaigns/apple-iphone-18-pro-colors-official.jpg",
  },
  {
    id: "silver",
    apiColor: "Silver",
    name: IPHONE18_SHOWCASE.colorSilverTitle,
    enName: "Silver Titanium",
    hex: "#dedfdf",
    accent: "#ffffff",
    description: IPHONE18_SHOWCASE.colorSilverText,
    image: "/apple-iphone-18-pro/hero-iphone-18-pro.jpg",
  },
];

export const MODELS = [
  {
    id: "iphone-18-pro",
    name: "iPhone 18 Pro",
    screen: '6.3" Super Retina XDR OLED',
    dimensions: "149.6 × 71.5 × 8.25 mm",
    weight: "199 gram",
    battery: IPHONE18_SHOWCASE.battery29Video,
    priceStarts: "32.990.000₫",
  },
  {
    id: "iphone-18-pro-max",
    name: "iPhone 18 Pro Max",
    screen: '6.9" Super Retina XDR OLED',
    dimensions: "163.0 × 77.6 × 8.25 mm",
    weight: "225 gram",
    battery: IPHONE18_SHOWCASE.battery33Video,
    priceStarts: "36.990.000₫",
  },
];

export const STORAGE_TIERS = [
  { size: "256GB", note: IPHONE18_SHOWCASE.tierPro, pricePro: "32.990.000₫", priceMax: "36.990.000₫" },
  { size: "512GB", note: IPHONE18_SHOWCASE.tierPopular, pricePro: "37.990.000₫", priceMax: "41.990.000₫" },
  { size: "1TB", note: "ProRes 4K LOG", pricePro: "43.990.000₫", priceMax: "47.990.000₫" },
  { size: "2TB", note: IPHONE18_SHOWCASE.tierMax, pricePro: "50.990.000₫", priceMax: "54.990.000₫" },
];

export const APERTURE_STOPS: ApertureStop[] = [
  {
    stop: "ƒ/1.48",
    diameterPercent: 95,
    lightGain: "+320%",
    lightPercent: 100,
    dofPercent: 15,
    role: IPHONE18_SHOWCASE.aperture148Title,
    focusType: IPHONE18_SHOWCASE.aperture148Badge,
    description: IPHONE18_SHOWCASE.aperture148Text,
    scenario: IPHONE18_SHOWCASE.aperture148Use,
  },
  {
    stop: "ƒ/1.8",
    diameterPercent: 74,
    lightGain: "+180%",
    lightPercent: 78,
    dofPercent: 40,
    role: IPHONE18_SHOWCASE.aperture2Title,
    focusType: IPHONE18_SHOWCASE.aperture2Badge,
    description: IPHONE18_SHOWCASE.aperture2Text,
    scenario: IPHONE18_SHOWCASE.aperture2Use,
  },
  {
    stop: "ƒ/2.8",
    diameterPercent: 52,
    lightGain: IPHONE18_SHOWCASE.aperture2Tag,
    lightPercent: 55,
    dofPercent: 70,
    role: IPHONE18_SHOWCASE.aperture28Title,
    focusType: IPHONE18_SHOWCASE.aperture28Badge,
    description: IPHONE18_SHOWCASE.aperture28Text,
    scenario: IPHONE18_SHOWCASE.aperture28Use,
  },
  {
    stop: "ƒ/4.0",
    diameterPercent: 32,
    lightGain: IPHONE18_SHOWCASE.aperture28Tag,
    lightPercent: 35,
    dofPercent: 98,
    role: IPHONE18_SHOWCASE.aperture4Title,
    focusType: IPHONE18_SHOWCASE.aperture4Badge,
    description: IPHONE18_SHOWCASE.aperture4Text,
    scenario: IPHONE18_SHOWCASE.aperture4Use,
  },
];

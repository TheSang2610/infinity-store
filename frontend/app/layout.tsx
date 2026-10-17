import type { Metadata } from "next";
import { SITE_URL } from "@/src/constants/shared/site-config";
import { Inter } from "next/font/google";
import "@/src/styles/base/globals.css";
import "@/src/styles/storefront/red-theme.css";
import "@/src/styles/storefront/modern-theme.css";
import "@/src/styles/base/motion.css";
import "@/src/styles/storefront/chatbot.css";
import "@/src/styles/storefront/category-menu.css";
import "@/src/styles/storefront/home-showcase.css";
import "@/src/styles/storefront/hero-vibe.css";
import "@/src/styles/storefront/catalog-storefront.css";
import "@/src/styles/storefront/home-retail.css";
import "@/src/styles/storefront/mobile-storefront.css";
import "@/src/styles/admin/admin-mobile-orbit.css";
import "@/src/styles/storefront/apple-3d-luxury.css";
import "@/src/styles/storefront/apple-tuandigi.css";
import "@/src/styles/storefront/product-detail-2026.css";
import "@/src/styles/storefront/footer-luxury-2026.css";
import "@/src/styles/storefront/preorder.css";
import "@/src/styles/admin/admin-login-2026.css";
import "@/src/styles/storefront/infinity-theme.css";
import "@/src/styles/storefront/smember-theme.css";
import "@/src/styles/storefront/installment-luxury.css";
import "@/src/styles/admin/products-premium.css";
import "@/src/styles/storefront/storefront-refresh.css";
import "@/src/styles/storefront/quick-order.css";
import "@/src/styles/base/theme-mode.css";
import "@/src/styles/base/ui-polish.css";
import "@/src/styles/storefront/home-premium.css";
import "@/src/styles/admin/admin-design.css";
import "@/src/styles/base/dark-mode.css";
import StorefrontHeader from "@/src/components/layout/StorefrontHeader";
import StorefrontFooter from "@/src/components/layout/StorefrontFooter";
import { CartProvider } from "@/src/hooks/cart";
import CartHeaderLink from "@/src/components/layout/CartHeaderLink";
import MotionSystem from "@/src/components/common/MotionSystem";
import LocalChatbot from "@/src/components/features/portal/chat/LocalChatbot";
import MobileAppNav from "@/src/components/layout/MobileAppNav";
import PwaInstaller from "@/src/components/common/PwaInstaller";
import { getChatbotProducts, getStoreSettings } from "@/src/services/data";
import { StoreSettingsProvider } from "@/src/hooks/store-settings";
import { SITE_META } from "@/src/constants/shared/site-config";

const siteFont = Inter({
  variable: "--font-site",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const baseMetadata: Metadata = {
  // Không đặt metadataBase: vinext sẽ biến icon/manifest thành URL tuyệt đối tới tên miền thật,
  // khiến trang chạy ở localhost tải icon chéo trang và bị chặn (403). Chỉ Open Graph cần URL đầy đủ.
  title: { default: SITE_META.defaultTitle, template: "%s | Infinity Store" },
  description: SITE_META.description,
  openGraph: { title: "Infinity Store", description: SITE_META.ogDescription, type: "website", url: SITE_URL, siteName: "Infinity Store", images: [`${SITE_URL}/og-storefront.png`] },
  twitter: { card: "summary_large_image", images: [`${SITE_URL}/og-storefront.png`] },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64" },
      { url: "/brand/if-emblem-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/if-emblem-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: { capable: true, title: "Infinity Store", statusBarStyle: "default" },
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const phone = settings.hotline.replace(/\D/g, "");
  return phone ? { ...baseMetadata, other: { "store:phone": phone } } : baseMetadata;
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [chatbotProducts, settings] = await Promise.all([getChatbotProducts(), getStoreSettings()]);
  return (
    <html lang="vi" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var saved=localStorage.getItem("infinity-theme");var theme=saved==="light"||saved==="dark"?saved:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}catch(error){}})();` }} />
      </head>
      <body className={siteFont.variable}>
        <StoreSettingsProvider value={settings}>
        <CartProvider>
          <div className="sr-only" aria-hidden="true" style={{ display: "none" }}><CartHeaderLink /></div>
          <StorefrontHeader />
          <MotionSystem>{children}</MotionSystem>
          <StorefrontFooter />
          <LocalChatbot products={chatbotProducts} />
          <PwaInstaller />
          <MobileAppNav />
        </CartProvider>
        </StoreSettingsProvider>
      </body>
    </html>
  );
}

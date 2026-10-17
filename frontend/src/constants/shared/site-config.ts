/**
 * Ten mien cong khai cua cua hang, dung cho URL tuyet doi: Open Graph, sitemap, robots, link gioi thieu.
 * Dat bang bien SITE_URL (vd https://infinityshop.click) khi deploy.
 */
export const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const SITE_META = {
  defaultTitle: "Infinity Store | Điện thoại & đặt hàng",
  description: "iPhone, iPad, MacBook và Laptop chính hãng tại Infinity Store..",
  ogDescription: "Chọn đúng máy. Không mua theo cảm tính.",
} as const;

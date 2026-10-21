import type { NextConfig } from "next";

// Dia chi backend Express. Trinh duyet chi goi /api/* cua chinh frontend,
// Next.js chuyen tiep sang backend nen cookie dang nhap la cookie cung ten mien.
const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");

// Header bao mat cho moi trang - truoc day Cloudflare Worker (worker/api-security.ts) gan.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // camera=(self): trang cham cong / thu khuon mat dung camera cua chinh trang.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

// CSP co ban cho cac trang (khong ap cho /api/*: Swagger tai CSS/JS tu jsDelivr, cac API tra JSON).
// - script chi tu chinh trang. Van can 'unsafe-inline' vi Next.js va doan dat che do sang/toi chen script
//   noi tuyen; CSP chat dung nonce bat moi trang render dong, chua lam (xem README muc No ky thuat).
// - 'unsafe-eval' chi o dev: React Refresh can.
// - img-src https: anh san pham co the la link ngoai do quan tri nhap; frame-src https: khung xem camera.
const isDev = process.env.NODE_ENV !== "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "media-src 'self' blob:",
  "frame-src 'self' https:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Anh san pham nam san trong /public, phuc vu thang cho don gian.
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // Form san pham gui kem nhieu anh. Tren Vercel moi request van bi gioi han 4,5 MB.
      bodySizeLimit: "30mb",
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/((?!api/).*)", headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy }] },
    ];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;

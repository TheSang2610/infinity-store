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
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;

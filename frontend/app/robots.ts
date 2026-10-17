import type { MetadataRoute } from "next";
import { SITE_URL } from "@/src/constants/shared/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/manager/", "/manger/", "/staff/", "/quan-ly/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/page-registry";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/portal/", "/api/", "/sign-in/", "/sign-up/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

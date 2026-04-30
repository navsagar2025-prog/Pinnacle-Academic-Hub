import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, SITE_URL } from "@/lib/seo/page-registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_PAGES.map((page) => ({
    url: `${SITE_URL}${page.route}`,
    lastModified,
    changeFrequency: page.changefreq,
    priority: page.priority,
  }));
}

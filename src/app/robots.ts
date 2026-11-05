import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/account", "/set-password"] },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}

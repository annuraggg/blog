import { MetadataRoute } from "next";
import { blogConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = blogConfig.url || process.env.NEXTAUTH_URL || "https://anuragsawant.in";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

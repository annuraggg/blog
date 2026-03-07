import { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import Series from "@/lib/models/Series";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://yourdomain.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/series`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  try {
    await connectDB();

    const posts = await Post.find({ status: "published" })
      .select("slug updatedAt")
      .lean();

    const allSeries = await Series.find({}).select("slug updatedAt").lean();

    const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const seriesUrls: MetadataRoute.Sitemap = allSeries.map((s) => ({
      url: `${baseUrl}/series/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...postUrls, ...seriesUrls];
  } catch {
    return staticRoutes;
  }
}

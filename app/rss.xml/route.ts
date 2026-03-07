import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://yourdomain.com";

  await connectDB();
  const posts = await Post.find({ status: "published" })
    .sort({ publishDate: -1 })
    .limit(20)
    .select("title subheading slug publishDate")
    .lean();

  const items = posts
    .map((post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.subheading ?? ""}]]></description>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid>${baseUrl}/blog/${post.slug}</guid>
      <pubDate>${post.publishDate ? new Date(post.publishDate).toUTCString() : ""}</pubDate>
    </item>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Blog</title>
    <link>${baseUrl}</link>
    <description>Thoughtful essays on technology and building things.</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

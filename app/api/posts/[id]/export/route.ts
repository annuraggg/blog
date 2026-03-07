import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import { auth } from "@/lib/auth";
import { format } from "date-fns";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const post = await Post.findById(id).lean();
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const frontmatter = [
      "---",
      `title: "${post.title.replace(/"/g, '\\"')}"`,
      post.subheading ? `subheading: "${post.subheading.replace(/"/g, '\\"')}"` : null,
      `slug: ${post.slug}`,
      `status: ${post.status}`,
      post.publishDate ? `publishDate: ${format(new Date(post.publishDate), "yyyy-MM-dd")}` : null,
      post.tags.length ? `tags: [${post.tags.map((t: string) => `"${t}"`).join(", ")}]` : null,
      post.seoTitle ? `seoTitle: "${post.seoTitle.replace(/"/g, '\\"')}"` : null,
      post.seoDescription ? `seoDescription: "${post.seoDescription.replace(/"/g, '\\"')}"` : null,
      "---",
    ]
      .filter(Boolean)
      .join("\n");

    const markdown = `${frontmatter}\n\n${post.body}`;

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${post.slug}.md"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

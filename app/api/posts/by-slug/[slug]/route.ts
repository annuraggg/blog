import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    await connectDB();

    // Check direct slug match
    let post = await Post.findOne({ slug })
      .populate("author", "name image bio website twitter")
      .populate("series", "title slug description")
      .lean();

    if (!post) {
      // Check slug history (for 301 redirects)
      const historical = await Post.findOne({ slugHistory: slug })
        .select("slug")
        .lean();
      if (historical) {
        return NextResponse.json(
          { redirect: `/blog/${historical.slug}` },
          { status: 301 }
        );
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import { auth } from "@/lib/auth";
import { calculateReadingTime } from "@/lib/utils";

// GET /api/posts - list published posts with search/filter/sort
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const tag = searchParams.get("tag");
    const series = searchParams.get("series");
    const sort = searchParams.get("sort") ?? "latest";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { status: "published" };
    if (q) filter.$text = { $search: q };
    if (tag) filter.tags = tag;
    if (series) filter.series = series;

    const sortOptions: Record<string, 1 | -1> =
      sort === "popular"
        ? { viewCount: -1 }
        : { publishDate: -1 };

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("author", "name image bio")
        .populate("series", "title slug")
        .select("-body -revisions")
        .lean(),
      Post.countDocuments(filter),
    ]);

    return NextResponse.json({ posts, total, page, limit });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/posts - create a new post (admin/editor only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    // Auto-generate slug if not provided
    if (!body.slug && body.title) {
      const slugify = (await import("slugify")).default;
      body.slug = slugify(body.title, { lower: true, strict: true });
    }

    const post = await Post.create({
      ...body,
      author: session.user.id,
      readingTime: calculateReadingTime(body.body ?? ""),
      publishDate:
        body.publishDate
          ? new Date(body.publishDate)
          : body.status === "published"
            ? new Date()
            : undefined,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
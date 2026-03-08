import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post, { IPost } from "@/lib/models/Post";
import { auth } from "@/lib/auth";
import { calculateReadingTime } from "@/lib/utils";
import { renderTiptapHTML, renderTiptapText } from "@/lib/tiptapRender";
import type { JSONContent } from "@tiptap/core";

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
      sort === "popular" ? { viewCount: -1 } : { publishDate: -1 };

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("author", "name image bio")
        .populate("series", "title slug")
        .select("-bodyJSON -bodyHTML -revisions")
        .lean(),
      Post.countDocuments(filter),
    ]);

    return NextResponse.json({ posts, total, page, limit });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
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

    // Require cover image when publishing
    if (body.status === "published" && !body.coverImage) {
      return NextResponse.json(
        { error: "A cover image is required to publish." },
        { status: 400 },
      );
    }

    // Auto-generate slug if not provided
    if (!body.slug && body.title) {
      const slugify = (await import("slugify")).default;
      body.slug = slugify(body.title, { lower: true, strict: true });
    }

    const bodyJSON: JSONContent = body.bodyJSON;
    const bodyHTML = renderTiptapHTML(bodyJSON);
    const textContent = renderTiptapText(bodyJSON);

    const post = await Post.create({
      ...body,
      bodyJSON,
      bodyHTML,
      author: session.user.id,
      readingTime: calculateReadingTime(textContent),
      publishDate: body.publishDate
        ? new Date(body.publishDate)
        : body.status === "published"
          ? new Date()
          : undefined,
    });

    // Newsletter integration
    console.log(body);
    if (body.sendNewsletter && body.status === "published") {
      try {
        console.log("Sending newsletter for post:", post.title);
        await sendNewsletter(post);
      } catch (err) {
        console.error("Failed to send newsletter:", err);
      }
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function sendNewsletter(post: IPost) {
  const createRes = await fetch("https://api.kit.com/v3/broadcasts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: process.env.KIT_API_KEY,
      subject: `New article: ${post.title}`,
      content: `
        <h1>${post.title}</h1>
        <p>${post.subheading ?? ""}</p>

        <p>Read the full article:</p>

        <p>
          <a href="https://blog.anuragsawant.in/blog/${post.slug}">
            Read the article
          </a>
        </p>
      `,
      public: true,
    }),
  });

  const createData = await createRes.json();

  if (!createRes.ok) {
    console.error(createData);
    throw new Error("Failed to create broadcast");
  }

  const broadcastId = createData.broadcast.id;

  // SEND the broadcast
  setTimeout(async () => {
    const sendRes = await fetch(
      `https://api.kit.com/v3/broadcasts/${broadcastId}/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: process.env.KIT_API_KEY,
        }),
      },
    );

    if (!sendRes.ok) {
      const err = await sendRes.text();
      console.error("Send failed:", err);
      throw new Error("Failed to send broadcast");
    }

    console.log("Newsletter sent for:", post.title);
  }, 5000); // Delay sending by 5 seconds to ensure broadcast is ready
}

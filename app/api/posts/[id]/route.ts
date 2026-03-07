import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import { auth } from "@/lib/auth";
import { calculateReadingTime } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const post = await Post.findById(id)
      .populate("author", "name image bio")
      .populate("series", "title slug")
      .lean();
    if (!post)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const existing = await Post.findById(id);
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Save revision before update
    existing.revisions.push({
      title: existing.title,
      body: existing.body,
      updatedAt: new Date(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updatedBy: session.user.id as any,
    });

    // Track slug history
    if (body.slug && body.slug !== existing.slug) {
      existing.slugHistory.push(existing.slug);
    }

    Object.assign(existing, {
      ...body,
      readingTime: calculateReadingTime(body.body ?? existing.body),
    });

    if (
      body.status === "published" &&
      !existing.publishDate &&
      !body.publishDate
    ) {
      existing.publishDate = new Date();
    } else if (body.publishDate) {
      existing.publishDate = new Date(body.publishDate);
    }

    await existing.save();
    return NextResponse.json(existing);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await Post.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

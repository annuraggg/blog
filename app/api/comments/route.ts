import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Comment from "@/lib/models/Comment";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

    const comments = await Comment.find({
      post: postId,
      status: "approved",
      deleted: false,
    })
      .populate("author", "name image")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(comments);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Email verification check
    if (!session.user.email) {
      return NextResponse.json({ error: "Email verification required" }, { status: 403 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";

    if (!checkRateLimit(ip, 5)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    await connectDB();
    const body = await req.json();

    // Honeypot check — log bot attempt for monitoring, return success to avoid detection
    if (body.honeypot) {
      console.warn(`[spam] Honeypot triggered from IP ${ip}`);
      return NextResponse.json({ success: true });
    }

    const comment = await Comment.create({
      post: body.postId,
      author: session.user.id,
      parentComment: body.parentCommentId,
      body: body.body,
      status: "pending",
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Like from "@/lib/models/Like";
import Post from "@/lib/models/Post";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { postId } = await req.json();
    const session = await auth();

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";

    if (!checkRateLimit(ip, 10)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
      await Like.create({
        post: postId,
        user: session?.user?.id,
        ipAddress: ip,
      });
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });
      return NextResponse.json({ liked: true });
    } catch (err: unknown) {
      // Duplicate key - already liked
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        return NextResponse.json({ error: "Already liked" }, { status: 409 });
      }
      throw err;
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

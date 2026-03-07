import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Analytics from "@/lib/models/Analytics";
import Post from "@/lib/models/Post";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { postId } = await req.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60; // 1 day
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";

    // Simple unique view tracking using a session cookie
    const viewedKey = `viewed_${postId}`;
    const alreadyViewed = req.cookies.get(viewedKey)?.value === "1";

    await Analytics.findOneAndUpdate(
      { post: postId, date: today },
      {
        $inc: {
          views: 1,
          uniqueViews: alreadyViewed ? 0 : 1,
        },
      },
      { upsert: true }
    );

    await Post.findByIdAndUpdate(postId, {
      $inc: {
        viewCount: 1,
        uniqueViewCount: alreadyViewed ? 0 : 1,
      },
    });

    const response = NextResponse.json({ success: true });
    if (!alreadyViewed) {
      response.cookies.set(viewedKey, "1", {
        httpOnly: true,
        maxAge: COOKIE_MAX_AGE_SECONDS,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

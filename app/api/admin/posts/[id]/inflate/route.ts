import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import { auth } from "@/lib/auth";

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json()) as {
      inflatedViews?: number;
      inflatedLikes?: number;
      randomInflation?: boolean;
    };

    let { inflatedViews, inflatedLikes, randomInflation } = body;

    // Prevent negative values
    if (inflatedViews !== undefined && inflatedViews < 0) {
      return NextResponse.json(
        { error: "inflatedViews cannot be negative" },
        { status: 400 },
      );
    }
    if (inflatedLikes !== undefined && inflatedLikes < 0) {
      return NextResponse.json(
        { error: "inflatedLikes cannot be negative" },
        { status: 400 },
      );
    }

    // If random inflation is being enabled, generate realistic random values
    if (randomInflation === true) {
      const baseViews = post.viewCount + (inflatedViews ?? post.inflatedViews);
      const extraViews = randomBetween(50, 500);
      inflatedViews = (inflatedViews ?? post.inflatedViews) + extraViews;
      // Likes are a realistic 2–15% of total views
      const totalViews = post.viewCount + inflatedViews;
      const likeRatio = (randomBetween(2, 15)) / 100;
      const maxLikes = Math.floor(totalViews * likeRatio);
      inflatedLikes = Math.max(
        0,
        Math.min(maxLikes - post.likeCount, inflatedViews),
      );
      void baseViews;
    }

    // Validate: inflated likes must not cause total likes to exceed total views
    const totalViews =
      post.viewCount + (inflatedViews ?? post.inflatedViews);
    const totalLikes =
      post.likeCount + (inflatedLikes ?? post.inflatedLikes);
    if (totalLikes > totalViews) {
      return NextResponse.json(
        { error: "Total likes cannot exceed total views" },
        { status: 400 },
      );
    }

    post.inflatedViews =
      inflatedViews !== undefined ? inflatedViews : post.inflatedViews;
    post.inflatedLikes =
      inflatedLikes !== undefined ? inflatedLikes : post.inflatedLikes;
    post.randomInflation =
      randomInflation !== undefined ? randomInflation : post.randomInflation;

    await post.save();

    return NextResponse.json({
      inflatedViews: post.inflatedViews,
      inflatedLikes: post.inflatedLikes,
      randomInflation: post.randomInflation,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

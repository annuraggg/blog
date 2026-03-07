import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Comment from "@/lib/models/Comment";
import { auth } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const comment = await Comment.findById(id);
    if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const userId = session.user.id;
    const alreadyUpvoted = comment.upvotes.some((u) => u.toString() === userId);

    if (alreadyUpvoted) {
      comment.upvotes = comment.upvotes.filter((u) => u.toString() !== userId);
      comment.upvoteCount = Math.max(0, comment.upvoteCount - 1);
    } else {
      comment.upvotes.push(userId as unknown as import("mongoose").Types.ObjectId);
      comment.upvoteCount++;
    }

    await comment.save();
    return NextResponse.json({ upvoteCount: comment.upvoteCount, upvoted: !alreadyUpvoted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

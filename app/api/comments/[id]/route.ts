import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Comment from "@/lib/models/Comment";
import { auth } from "@/lib/auth";

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const comment = await Comment.findById(id);
    if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (comment.author.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    if (now.getTime() - comment.createdAt.getTime() > EDIT_WINDOW_MS) {
      return NextResponse.json({ error: "Edit window expired" }, { status: 400 });
    }

    const { body } = await req.json();
    comment.body = body;
    comment.editedAt = now;
    await comment.save();

    return NextResponse.json(comment);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    const isOwner = comment.author.toString() === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    comment.deleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

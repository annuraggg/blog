import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Comment from "@/lib/models/Comment";
import { auth } from "@/lib/auth";


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { status } = await req.json();

    const comment = await Comment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const comment = await Comment.findById(id);
    if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    comment.deleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

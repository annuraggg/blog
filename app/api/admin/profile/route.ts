import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

// PATCH /api/admin/profile - update own profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { name, email, image, bio, website, twitter } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check email uniqueness if changed
    const normalizedEmail = email.toLowerCase().trim();
    const conflict = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: session.user.id },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Email already in use." },
        { status: 409 },
      );
    }

    const updated = await User.findByIdAndUpdate(
      session.user.id,
      {
        name: name.trim(),
        email: normalizedEmail,
        image: image ?? undefined,
        bio: bio ?? undefined,
        website: website ?? undefined,
        twitter: twitter ?? undefined,
      },
      { new: true, select: "name email image bio website twitter" },
    );

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

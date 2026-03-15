import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import bcryptjs from "bcryptjs";

// GET /api/admin/users - list all users
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select("name email role createdAt")
      .lean();
    return NextResponse.json(users);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/users - create a new user
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const { name, email, password, role } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email, and password are required" },
        { status: 400 },
      );
    }
    const allowed = ["admin", "author", "editor", "user"];
    if (role && !allowed.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }
    const hashed = await bcryptjs.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: role ?? "user",
    });
    return NextResponse.json(
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

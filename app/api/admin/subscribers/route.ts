import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscriber from "@/lib/models/Subscriber";
import { auth } from "@/lib/auth";

// GET /api/admin/subscribers?q=search&page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));

    const filter: Record<string, unknown> = {};
    if (q) filter.email = { $regex: q, $options: "i" };

    const [subscribers, total] = await Promise.all([
      Subscriber.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Subscriber.countDocuments(filter),
    ]);

    return NextResponse.json({ subscribers, total, page, limit });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/subscribers – manually add a subscriber
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { email } = (await req.json()) as { email?: string };
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.unsubscribed) {
        existing.unsubscribed = false;
        await existing.save();
        return NextResponse.json(existing, { status: 200 });
      }
      return NextResponse.json(
        { error: "Already subscribed" },
        { status: 409 },
      );
    }

    const subscriber = await Subscriber.create({ email: email.toLowerCase() });
    return NextResponse.json(subscriber, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

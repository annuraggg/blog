import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscriber from "@/lib/models/Subscriber";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const subscriber = await Subscriber.findOne({ email });
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    subscriber.unsubscribed = true;
    await subscriber.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

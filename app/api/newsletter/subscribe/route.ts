import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscriber from "@/lib/models/Subscriber";

export async function POST(req: NextRequest) {
  try {
    console.log("Received subscription request");
    await connectDB();
    const { email, name } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Try to add to Kit (ConvertKit)
    let kitSubscriberId: string | undefined;
    console.log("Checking Kit API credentials:", {
      apiKey: !!process.env.KIT_API_KEY,
      formId: !!process.env.KIT_FORM_ID,
    });
    if (process.env.KIT_API_KEY && process.env.KIT_FORM_ID) {
      console.log("Subscribing to Kit with email:", email);
      try {
        const kitRes = await fetch(
          `https://api.convertkit.com/v3/forms/${process.env.KIT_FORM_ID}/subscribe`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: process.env.KIT_API_KEY,
              email,
              first_name: name,
            }),
          }
        );
        const kitData = await kitRes.json();
        kitSubscriberId = kitData?.subscription?.subscriber?.id?.toString();

        console.log("Kit subscription response:", kitData);
      } catch (e) {
        console.error("Kit subscription error:", e);
      }
    }

    // Upsert subscriber in MongoDB
    await Subscriber.findOneAndUpdate(
      { email },
      { email, name, kitSubscriberId },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

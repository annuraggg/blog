import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";

/**
 * Scheduled publishing cron endpoint.
 *
 * How scheduling works:
 * - Posts with status "scheduled" and scheduledFor <= now are published.
 * - This endpoint must be called periodically (e.g. every 5 minutes).
 *
 * Vercel Compatibility:
 * - Works on Vercel Free Tier via vercel.json crons (1 cron job allowed).
 * - Set CRON_SECRET in environment variables and configure vercel.json.
 * - Vercel automatically passes the Authorization header to the cron endpoint.
 *   See https://vercel.com/docs/cron-jobs/manage-cron-jobs
 *
 * Authentication:
 * - Authorization: Bearer <CRON_SECRET>
 * - OR the Vercel-Cron-Job-Id header (from Vercel internal calls)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  const isAuthorized =
    isVercelCron ||
    (process.env.CRON_SECRET &&
      authHeader === `Bearer ${process.env.CRON_SECRET}`);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const now = new Date();

    const result = await Post.updateMany(
      { status: "scheduled", scheduledFor: { $lte: now } },
      { $set: { status: "published", publishDate: now } }
    );

    return NextResponse.json({
      published: result.modifiedCount,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

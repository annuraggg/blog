export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import Analytics from "@/lib/models/Analytics";

export default async function AdminAnalyticsPage() {
  await connectDB();

  const topPosts = await Post.find({ status: "published" })
    .sort({ viewCount: -1 })
    .limit(10)
    .select("title slug viewCount uniqueViewCount likeCount")
    .lean();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentAnalytics = await Analytics.aggregate([
    { $match: { date: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        views: { $sum: "$views" },
        uniqueViews: { $sum: "$uniqueViews" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const maxViews = recentAnalytics.length
    ? Math.max(...recentAnalytics.map((d) => d.views))
    : 1;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">Analytics</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Top Posts (All Time)</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="text-left px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">Post</th>
                <th className="text-right px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">Views</th>
                <th className="text-right px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">Unique</th>
                <th className="text-right px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">Likes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {topPosts.map((post) => (
                <tr key={String(post._id)} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-white">{post.title}</p>
                    <p className="text-xs text-zinc-400">/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{post.viewCount}</td>
                  <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{post.uniqueViewCount}</td>
                  <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{post.likeCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {topPosts.length === 0 && (
            <p className="text-center py-8 text-zinc-400">No published posts yet.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Last 30 Days</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="space-y-2">
            {recentAnalytics.map((day) => (
              <div key={day._id} className="flex items-center gap-4 text-sm">
                <span className="w-24 text-zinc-500">{day._id}</span>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-zinc-700 dark:bg-zinc-300 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (day.views / maxViews) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-16 text-right text-zinc-700 dark:text-zinc-300">{day.views} views</span>
              </div>
            ))}
            {recentAnalytics.length === 0 && (
              <p className="text-center py-8 text-zinc-400">No data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import Analytics from "@/lib/models/Analytics";
import AnalyticsChart from "@/components/admin/AnalyticsChart";

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

  // Summary stats
  const totalViews = topPosts.reduce((sum, p) => sum + (p.viewCount ?? 0), 0);
  const totalUniqueViews = topPosts.reduce((sum, p) => sum + (p.uniqueViewCount ?? 0), 0);
  const totalLikes = topPosts.reduce((sum, p) => sum + (p.likeCount ?? 0), 0);
  const last30Views = recentAnalytics.reduce((sum: number, d: { views: number }) => sum + d.views, 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">Analytics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Views", value: totalViews },
          { label: "Unique Views", value: totalUniqueViews },
          { label: "Total Likes", value: totalLikes },
          { label: "Views (30d)", value: last30Views },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Last 30 Days</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <AnalyticsChart data={recentAnalytics} />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Top Posts (All Time)</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
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
      </div>
    </div>
  );
}

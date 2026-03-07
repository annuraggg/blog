export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import Comment from "@/lib/models/Comment";
import Subscriber from "@/lib/models/Subscriber";

export default async function AdminDashboard() {
  await connectDB();

  const [totalPosts, publishedPosts, draftPosts, pendingComments, totalSubscribers] =
    await Promise.all([
      Post.countDocuments({}),
      Post.countDocuments({ status: "published" }),
      Post.countDocuments({ status: "draft" }),
      Comment.countDocuments({ status: "pending", deleted: false }),
      Subscriber.countDocuments({}),
    ]);

  const stats = [
    { label: "Total Posts", value: totalPosts },
    { label: "Published", value: publishedPosts },
    { label: "Drafts", value: draftPosts },
    { label: "Pending Comments", value: pendingComments },
    { label: "Subscribers", value: totalSubscribers },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

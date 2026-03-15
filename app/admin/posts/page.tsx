export const dynamic = "force-dynamic";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import { formatDistanceToNow } from "date-fns";
import PostDeleteButton from "@/components/admin/PostDeleteButton";
import { auth } from "@/lib/auth";

export default async function AdminPostsPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "admin" || session?.user.role === "editor";

  await connectDB();
  // Authors only see their own posts; admins/editors see all
  const query = isAdmin ? {} : { author: session?.user.id };
  const posts = await Post.find(query)
    .sort({ updatedAt: -1 })
    .populate("author", "name")
    .select("title slug status publishDate updatedAt author readingTime tags")
    .lean();

  const statusColors: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    published: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    archived: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    private: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    unlisted: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm rounded-lg hover:opacity-90 transition-opacity"
        >
          New Post
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="text-left px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">Title</th>
              <th className="text-left px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium hidden md:table-cell">Author</th>
              <th className="text-left px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium hidden lg:table-cell">Updated</th>
              <th className="text-right px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {posts.map((post) => (
              <tr key={String(post._id)} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white truncate max-w-xs">
                      {post.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">/{post.slug}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[post.status] ?? ""}`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                  {(post.author as { name?: string })?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500 hidden lg:table-cell">
                  {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/posts/${String(post._id)}/edit`}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Edit
                    </Link>
                    {isAdmin && <PostDeleteButton postId={String(post._id)} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <div className="text-center py-12 text-zinc-400">No posts yet.</div>
        )}
      </div>
    </div>
  );
}

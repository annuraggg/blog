export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Comment from "@/lib/models/Comment";
import CommentsManager from "@/components/admin/CommentsManager";

export default async function AdminCommentsPage() {
  await connectDB();
  const comments = await Comment.find({ deleted: false })
    .sort({ createdAt: -1 })
    .populate("author", "name email")
    .populate("post", "title slug")
    .lean();

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">Comments</h1>
      <CommentsManager initialComments={JSON.parse(JSON.stringify(comments))} />
    </div>
  );
}

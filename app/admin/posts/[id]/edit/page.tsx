export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import PostEditor from "@/components/admin/PostEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  await connectDB();

  const post = await Post.findById(id).populate("series", "title slug").lean();
  if (!post) notFound();

  return <PostEditor post={JSON.parse(JSON.stringify(post))} />;
}

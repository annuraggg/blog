import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import FeaturedPost from "./FeaturedPost";
import PostCard from "./Post";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await connectDB();
  const posts = await Post.find({ status: "published" })
    .sort({ publishDate: -1 })
    .limit(10)
    .populate("author", "name image")
    .populate("series", "title slug")
    .select(
      "title subheading slug coverImage tags readingTime publishDate author series body",
    )
    .lean();

  return (
    <div>
      {posts.length === 0 ? (
        <p className="text-center text-zinc-500 dark:text-zinc-400">
          No posts found.
        </p>
      ) : (
        <>
          <FeaturedPost post={posts[0]} />
          <section className="space-y-8 mt-7">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-14 border-b pb-4">
              Latest Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              {posts.slice(1).map((post) => (
                <PostCard key={post._id.toString()} post={post} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

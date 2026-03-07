import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import { formatDistanceToNow } from "date-fns";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await connectDB();
  const posts = await Post.find({ status: "published" })
    .sort({ publishDate: -1 })
    .limit(10)
    .populate("author", "name image")
    .populate("series", "title slug")
    .select(
      "title subheading slug coverImage tags readingTime publishDate author series",
    )
    .lean();

  return (
    <div>
      <section className="mb-16">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
          Writing on software, design & ideas
        </h1>
        <p className="text-xl text-zinc-500 dark:text-zinc-400">
          Thoughtful essays on technology and building things.
        </p>
      </section>

      <section className="space-y-8">
        {posts.map((post) => (
          <article
            key={String(post._id)}
            className="group flex flex-col md:flex-row gap-6 border-b border-zinc-100 dark:border-zinc-900 pb-8"
          >
            {post.coverImage && (
              <div className="md:w-48 md:flex-shrink-0">
                <Link href={`/blog/${post.slug}`}>
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    width={192}
                    height={128}
                    className="rounded-lg object-cover w-full h-32 group-hover:opacity-90 transition-opacity"
                    unoptimized
                  />
                </Link>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {post.tags.slice(0, 3).map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${tag}`}
                    className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white group-hover:underline mb-2">
                  {post.title}
                </h2>
              </Link>
              {post.subheading && (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3 line-clamp-2">
                  {post.subheading}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                {post.publishDate && (
                  <span>
                    {formatDistanceToNow(new Date(post.publishDate), {
                      addSuffix: true,
                    })}
                  </span>
                )}
                <span>·</span>
                <span>{post.readingTime} min read</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

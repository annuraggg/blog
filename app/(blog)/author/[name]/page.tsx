import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Post from "@/lib/models/Post";
import { format } from "date-fns";

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  await connectDB();
  const user = await User.findOne({ name: decodeURIComponent(name) }).lean();
  if (!user) return {};
  return { title: user.name, description: user.bio };
}

export const dynamic = "force-dynamic";

export default async function AuthorPage({ params }: Props) {
  const { name } = await params;
  await connectDB();

  const author = await User.findOne({ name: decodeURIComponent(name) }).lean();
  if (!author) notFound();

  const authorPhoto = author.image ?? author.avatar;

  const posts = await Post.find({ author: author._id, status: "published" })
    .sort({ publishDate: -1 })
    .select("title subheading slug coverImage readingTime publishDate tags")
    .lean();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Author header */}
      <div className="flex items-center gap-6 mb-12 pb-8 border-b border-zinc-200 dark:border-zinc-800">
        {authorPhoto ? (
          <Image
            src={authorPhoto}
            alt={author.name}
            width={80}
            height={80}
            className="rounded-full object-cover shrink-0"
            unoptimized
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-2xl font-bold text-zinc-500 dark:text-zinc-300 shrink-0">
            {author.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {author.name}
          </h1>
          {author.bio && (
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm max-w-lg">
              {author.bio}
            </p>
          )}
          <div className="flex gap-3 mt-2">
            {author.website && (
              <a
                href={author.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                Website
              </a>
            )}
            {author.twitter && (
              <a
                href={`https://twitter.com/${author.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                @{author.twitter}
              </a>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
        {posts.length} {posts.length === 1 ? "Article" : "Articles"}
      </h2>

      <div className="space-y-8">
        {posts.map((post) => (
          <article
            key={String(post._id)}
            className="group border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            {post.coverImage && (
              <Link href={`/blog/${post.slug}`}>
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  width={800}
                  height={400}
                  className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                  unoptimized
                />
              </Link>
            )}
            <div className="p-5">
              <div className="flex flex-wrap gap-1 mb-2">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs text-zinc-400">
                    #{tag}
                  </span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:underline mb-1">
                  {post.title}
                </h3>
              </Link>
              {post.subheading && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2">
                  {post.subheading}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                {post.publishDate && (
                  <time dateTime={new Date(post.publishDate).toISOString()}>
                    {format(new Date(post.publishDate), "MMMM d, yyyy")}
                  </time>
                )}
                <span>·</span>
                <span>{post.readingTime} min read</span>
              </div>
            </div>
          </article>
        ))}

        {posts.length === 0 && (
          <p className="text-center py-16 text-zinc-400">No articles yet.</p>
        )}
      </div>
    </div>
  );
}

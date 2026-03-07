import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Post from "@/lib/models/Post";
import { formatDistanceToNow } from "date-fns";

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

  const posts = await Post.find({ author: author._id, status: "published" })
    .sort({ publishDate: -1 })
    .select("title subheading slug readingTime publishDate tags")
    .lean();

  return (
    <div>
      <div className="flex items-center gap-6 mb-12 pb-8 border-b border-zinc-200 dark:border-zinc-800">
        {author.avatar && (
          <Image
            src={author.avatar}
            alt={author.name}
            width={80}
            height={80}
            className="rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{author.name}</h1>
          {author.bio && <p className="text-zinc-500 dark:text-zinc-400 mt-1">{author.bio}</p>}
          <div className="flex gap-3 mt-2">
            {author.website && (
              <a href={author.website} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                Website
              </a>
            )}
            {author.twitter && (
              <a href={`https://twitter.com/${author.twitter}`} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                @{author.twitter}
              </a>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
        {posts.length} Articles
      </h2>

      <div className="space-y-6">
        {posts.map((post) => (
          <article key={String(post._id)} className="border-b border-zinc-100 dark:border-zinc-900 pb-6">
            <div className="flex flex-wrap gap-2 mb-1">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-zinc-400">#{tag}</span>
              ))}
            </div>
            <Link href={`/blog/${post.slug}`}>
              <h3 className="font-semibold text-zinc-900 dark:text-white hover:underline mb-1">
                {post.title}
              </h3>
            </Link>
            {post.subheading && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{post.subheading}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              {post.publishDate && (
                <span>{formatDistanceToNow(new Date(post.publishDate), { addSuffix: true })}</span>
              )}
              <span>·</span>
              <span>{post.readingTime} min read</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

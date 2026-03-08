import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

interface RelatedPost {
  _id: string;
  title: string;
  slug: string;
  subheading?: string;
  coverImage?: string;
  tags: string[];
  readingTime: number;
  publishDate?: Date;
}

interface Props {
  posts: RelatedPost[];
}

export default function RelatedPosts({ posts }: Props) {
  if (!posts.length) return null;

  return (
    <section className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
        More Posts
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post._id}
            className="group border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            {post.coverImage && (
              <Link href={`/blog/${post.slug}`}>
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  width={400}
                  height={200}
                  className="w-full h-40 object-cover group-hover:opacity-90 transition-opacity"
                  unoptimized
                />
              </Link>
            )}
            <div className="p-4">
              <div className="flex flex-wrap gap-1 mb-2">
                {post.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs text-zinc-400">
                    #{tag}
                  </span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-blue-500 transition-colors mb-1 line-clamp-2">
                  {post.title}
                </h3>
              </Link>
              {post.subheading && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
                  {post.subheading}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                {post.publishDate && (
                  <time dateTime={new Date(post.publishDate).toISOString()}>
                    {format(new Date(post.publishDate), "MMM d, yyyy")}
                  </time>
                )}
                <span>·</span>
                <span>{post.readingTime} min read</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

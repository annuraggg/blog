import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { connectDB } from "@/lib/db";
import Post from "@/lib/models/Post";
import Series from "@/lib/models/Series";
import { formatDistanceToNow } from "date-fns";
import { blogConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: `All articles on ${blogConfig.name} — ${blogConfig.description}`,
};

interface Props {
  searchParams: Promise<{
    q?: string;
    tag?: string;
    series?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = { status: "published" };
  if (sp.q) filter.$text = { $search: sp.q };
  if (sp.tag) filter.tags = sp.tag;
  if (sp.series) filter.series = sp.series;

  const sort: Record<string, 1 | -1> =
    sp.sort === "popular" ? { viewCount: -1 } : { publishDate: -1 };
  const page = parseInt(sp.page ?? "1", 10);
  const limit = 12;

  const [posts, total, allSeries] = await Promise.all([
    Post.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name image")
      .populate("series", "title slug")
      .select(
        "title subheading slug coverImage tags readingTime publishDate author series viewCount inflatedViews",
      )
      .lean(),
    Post.countDocuments(filter),
    Series.find({}).select("title slug").lean(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">
          All Articles
        </h1>

        {/* Search */}
        <form className="flex gap-2 mb-4">
          <input
            name="q"
            defaultValue={sp.q}
            placeholder="Search articles..."
            className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm rounded-lg hover:opacity-90"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/blog"
            className={`text-xs px-3 py-1 rounded-full border ${!sp.series ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent" : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"}`}
          >
            All
          </Link>
          {allSeries.map((s) => (
            <Link
              key={String(s._id)}
              href={`/blog?series=${String(s._id)}`}
              className={`text-xs px-3 py-1 rounded-full border ${sp.series === String(s._id) ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent" : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"}`}
            >
              {s.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
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
                  width={400}
                  height={200}
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
                <h2 className="font-semibold text-zinc-900 dark:text-white group-hover:underline mb-2">
                  {post.title}
                </h2>
              </Link>
              {post.subheading && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2">
                  {post.subheading}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                {post.publishDate && (
                  <span>
                    {formatDistanceToNow(new Date(post.publishDate), {
                      addSuffix: true,
                    })}
                  </span>
                )}
                <span>·</span>
                <span>{post.readingTime} min read</span>
                <span>·</span>
                <span>{(post.viewCount ?? 0) + (post.inflatedViews ?? 0)} views</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/blog?page=${p}${sp.q ? `&q=${sp.q}` : ""}${sp.tag ? `&tag=${sp.tag}` : ""}${sp.series ? `&series=${sp.series}` : ""}`}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm ${p === page ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-20 text-zinc-400">
          No articles found.
        </div>
      )}
    </div>
  );
}

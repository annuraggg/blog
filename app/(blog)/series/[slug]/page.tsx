import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { connectDB } from "@/lib/db";
import Series from "@/lib/models/Series";
import Post from "@/lib/models/Post";
import { format } from "date-fns";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const series = await Series.findOne({ slug }).lean();
  if (!series) return {};
  return {
    title: series.title,
    description: series.description,
  };
}

export const dynamic = "force-dynamic";

export default async function SeriesDetailPage({ params }: Props) {
  const { slug } = await params;
  await connectDB();

  const series = await Series.findOne({ slug }).lean();
  if (!series) notFound();

  const posts = await Post.find({ series: series._id, status: "published" })
    .sort({ seriesOrder: 1 })
    .populate("author", "name")
    .select("title subheading slug coverImage readingTime publishDate seriesOrder")
    .lean();

  return (
    <div>
      {series.coverImage && (
        <Image
          src={series.coverImage}
          alt={series.title}
          width={800}
          height={300}
          className="w-full h-48 object-cover rounded-xl mb-8"
        />
      )}
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{series.title}</h1>
      {series.description && (
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">{series.description}</p>
      )}
      <p className="text-sm text-zinc-400 mb-8">{posts.length} articles in this series</p>

      <div className="space-y-4">
        {posts.map((post, index) => (
          <Link
            key={String(post._id)}
            href={`/blog/${post.slug}`}
            className="group flex items-start gap-4 p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <span className="text-2xl font-bold text-zinc-200 dark:text-zinc-700 flex-shrink-0 w-8 text-center">
              {index + 1}
            </span>
            <div className="flex-1">
              <h2 className="font-medium text-zinc-900 dark:text-white group-hover:underline">
                {post.title}
              </h2>
              {post.subheading && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                  {post.subheading}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
                {post.publishDate && <span>{format(new Date(post.publishDate), "MMM d, yyyy")}</span>}
                <span>·</span>
                <span>{post.readingTime} min read</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

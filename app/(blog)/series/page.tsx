import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db";
import Series from "@/lib/models/Series";
import Post from "@/lib/models/Post";

export const dynamic = "force-dynamic";

export default async function SeriesIndexPage() {
  await connectDB();
  const allSeries = await Series.find({}).sort({ title: 1 }).lean();

  const seriesWithCounts = await Promise.all(
    allSeries.map(async (s) => {
      const count = await Post.countDocuments({ series: s._id, status: "published" });
      return { ...s, postCount: count };
    })
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">Series</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {seriesWithCounts.map((s) => (
          <Link
            key={String(s._id)}
            href={`/series/${s.slug}`}
            className="group border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            {s.coverImage && (
              <Image
                src={s.coverImage}
                alt={s.title}
                width={400}
                height={160}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-5">
              <h2 className="font-semibold text-zinc-900 dark:text-white group-hover:underline mb-2">
                {s.title}
              </h2>
              {s.description && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2">
                  {s.description}
                </p>
              )}
              <p className="text-xs text-zinc-400">{s.postCount} articles</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Series from "@/lib/models/Series";
import Post from "@/lib/models/Post";
import SeriesManager from "@/components/admin/SeriesManager";

export default async function AdminSeriesPage() {
  await connectDB();
  const [allSeries, posts] = await Promise.all([
    Series.find({}).sort({ title: 1 }).lean(),
    Post.find({ series: { $exists: true } })
      .select("title slug series seriesOrder")
      .populate("series", "title slug")
      .lean(),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">Series</h1>
      <SeriesManager
        initialSeries={JSON.parse(JSON.stringify(allSeries))}
        posts={JSON.parse(JSON.stringify(posts))}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/db";
import Subscriber from "@/lib/models/Subscriber";
import SubscribersManager from "@/components/admin/SubscribersManager";

export default async function SubscribersPage() {
  await connectDB();

  const [total, active, unsubscribed] = await Promise.all([
    Subscriber.countDocuments({}),
    Subscriber.countDocuments({ unsubscribed: false }),
    Subscriber.countDocuments({ unsubscribed: true }),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
        Subscribers
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total", value: total },
          { label: "Active", value: active },
          { label: "Unsubscribed", value: unsubscribed },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {stat.label}
            </p>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <SubscribersManager />
    </div>
  );
}

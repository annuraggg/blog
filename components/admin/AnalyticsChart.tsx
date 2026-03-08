"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface DayData {
  _id: string;
  views: number;
  uniqueViews: number;
}

interface Props {
  data: DayData[];
}

export default function AnalyticsChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: d._id.slice(5), // Show MM-DD
    Views: d.views,
    "Unique Views": d.uniqueViews,
  }));

  if (!chartData.length) {
    return (
      <p className="text-center py-8 text-zinc-400">No data yet.</p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Views over the last 30 days</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="Views"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Unique Views"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Daily views bar chart</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
                fontSize: 12,
              }}
            />
            <Bar dataKey="Views" fill="#6366f1" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

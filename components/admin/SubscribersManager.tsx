"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, UserPlus, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Subscriber {
  _id: string;
  email: string;
  createdAt: string;
  unsubscribed: boolean;
  emailsSent: number;
  lastEmailSentAt?: string;
}

export default function SubscribersManager() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 20;

  // Debounce the search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchSubscribers = useCallback(
    async (q: string, pg: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pg),
          limit: String(limit),
        });
        if (q) params.set("q", q);
        const res = await fetch(`/api/admin/subscribers?${params}`);
        if (!res.ok) throw new Error("Failed to fetch subscribers");
        const data = (await res.json()) as {
          subscribers: Subscriber[];
          total: number;
        };
        setSubscribers(data.subscribers);
        setTotal(data.total);
      } catch {
        toast.error("Failed to load subscribers");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchSubscribers(debouncedSearch, page);
  }, [fetchSubscribers, debouncedSearch, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Failed to add subscriber");
      }
      toast.success(`${addEmail.trim()} added`);
      setAddEmail("");
      fetchSubscribers(search, 1);
      setPage(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add subscriber");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from subscribers?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove subscriber");
      toast.success(`${email} removed`);
      setSubscribers((prev) => prev.filter((s) => s._id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      toast.error("Failed to remove subscriber");
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const inputCls =
    "px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="search"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={`${inputCls} pl-9 w-full`}
          />
        </div>

        {/* Add subscriber */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="email"
            placeholder="Add subscriber email"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            required
            className={`${inputCls} w-56`}
          />
          <button
            type="submit"
            disabled={adding || !addEmail.trim()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Add
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-sm">
            No subscribers found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Subscribed
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Emails Sent
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Last Email
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr
                  key={sub._id}
                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                    {sub.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        sub.unsubscribed
                          ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                      }`}
                    >
                      {sub.unsubscribed ? "Unsubscribed" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDistanceToNow(new Date(sub.createdAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {sub.emailsSent}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {sub.lastEmailSentAt
                      ? formatDistanceToNow(new Date(sub.lastEmailSentAt), {
                          addSuffix: true,
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(sub._id, sub.email)}
                      disabled={deletingId === sub._id}
                      className="text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Remove subscriber"
                    >
                      {deletingId === sub._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            Showing {(page - 1) * limit + 1}–
            {Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs rounded-lg ${
                  p === page
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

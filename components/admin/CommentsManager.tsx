"use client";

import { useState } from "react";

interface Author {
  _id: string;
  name?: string;
  email?: string;
}

interface PostRef {
  _id: string;
  title?: string;
  slug?: string;
}

interface Comment {
  _id: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  deleted: boolean;
  createdAt: string;
  author?: Author;
  post?: PostRef;
  parentComment?: string;
}

interface Props {
  initialComments: Comment[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function CommentsManager({ initialComments }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered =
    filter === "all" ? comments : comments.filter((c) => c.status === filter);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update comment");
      setComments((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status } : c))
      );
    } catch {
      setActionError("Failed to update comment. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const deleteComment = async (id: string) => {
    if (!confirm("Permanently delete this comment?")) return;
    setLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete comment");
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch {
      setActionError("Failed to delete comment. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const counts = {
    all: comments.length,
    pending: comments.filter((c) => c.status === "pending").length,
    approved: comments.filter((c) => c.status === "approved").length,
    rejected: comments.filter((c) => c.status === "rejected").length,
  };

  return (
    <div>
      {/* Error banner */}
      {actionError && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filter === f
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}{" "}
            <span className="ml-1 text-xs opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-400">No comments found.</div>
        )}
        {filtered.map((comment) => (
          <div
            key={comment._id}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {comment.author?.name ?? comment.author?.email ?? "Anonymous"}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[comment.status] ?? ""}`}
                  >
                    {comment.status}
                  </span>
                  {comment.parentComment && (
                    <span className="text-xs text-zinc-400">reply</span>
                  )}
                </div>

                {comment.post && (
                  <p className="text-xs text-zinc-400 mb-2">
                    On:{" "}
                    <a
                      href={`/posts/${comment.post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {comment.post.title}
                    </a>
                  </p>
                )}

                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                  {comment.body}
                </p>

                <p className="text-xs text-zinc-400 mt-2">
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {comment.status !== "approved" && (
                  <button
                    onClick={() => updateStatus(comment._id, "approved")}
                    disabled={loading === comment._id}
                    className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {comment.status !== "rejected" && (
                  <button
                    onClick={() => updateStatus(comment._id, "rejected")}
                    disabled={loading === comment._id}
                    className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
                <button
                  onClick={() => deleteComment(comment._id)}
                  disabled={loading === comment._id}
                  className="px-3 py-1 text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

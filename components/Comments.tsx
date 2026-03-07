"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface Author {
  _id: string;
  name: string;
  image?: string;
}

interface Comment {
  _id: string;
  body: string;
  author: Author;
  parentComment?: string;
  upvotes: number;
  createdAt: string;
}

interface Props {
  postId: string;
}

export default function Comments({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/comments?postId=${postId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
      })
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          body,
          honeypot: honeypotRef.current?.value ?? "",
        }),
      });

      if (res.status === 401) {
        setError("You must be signed in to comment.");
      } else if (res.ok) {
        setSuccess(true);
        setBody("");
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to submit comment.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
        {comments.length > 0 ? `${comments.length} Comment${comments.length !== 1 ? "s" : ""}` : "Comments"}
      </h2>

      {/* Comment list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-24" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6 mb-8">
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              {comment.author?.image ? (
                <Image
                  src={comment.author.image}
                  alt={comment.author.name}
                  width={32}
                  height={32}
                  className="rounded-full flex-shrink-0 w-8 h-8"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {comment.author?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {comment.author?.name}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">{comment.body}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-zinc-400">No comments yet. Be the first!</p>
          )}
        </div>
      )}

      {/* Comment form */}
      {success ? (
        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
          Comment submitted! It will appear after review.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Honeypot */}
          <input ref={honeypotRef} name="honeypot" type="text" className="hidden" tabIndex={-1} autoComplete="off" />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Leave a comment…"
            rows={4}
            required
            className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? "Posting…" : "Post Comment"}
          </button>
        </form>
      )}
    </section>
  );
}

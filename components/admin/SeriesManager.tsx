"use client";

import { useState } from "react";

interface SeriesDoc {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface PostDoc {
  _id: string;
  title: string;
  slug: string;
  series?: { _id: string; title: string; slug: string } | string | null;
  seriesOrder?: number;
}

interface Props {
  initialSeries: SeriesDoc[];
  posts: PostDoc[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const inputCls =
  "w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500";
const labelCls = "block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1";

interface SeriesFormState {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
}

const emptyForm: SeriesFormState = { title: "", slug: "", description: "", coverImage: "" };

export default function SeriesManager({ initialSeries, posts }: Props) {
  const [seriesList, setSeriesList] = useState<SeriesDoc[]>(initialSeries);
  const [form, setForm] = useState<SeriesFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleTitleChange = (value: string) => {
    setForm((f) => ({
      ...f,
      title: value,
      slug: editingId ? f.slug : slugify(value),
    }));
  };

  const startEdit = (s: SeriesDoc) => {
    setEditingId(s._id);
    setForm({
      title: s.title,
      slug: s.slug,
      description: s.description ?? "",
      coverImage: s.coverImage ?? "",
    });
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      slug: form.slug,
      description: form.description || undefined,
      coverImage: form.coverImage || undefined,
    };

    try {
      const url = editingId ? `/api/series/${editingId}` : "/api/series";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed with status ${res.status}`);
      }

      const saved: SeriesDoc = await res.json();

      if (editingId) {
        setSeriesList((prev) => prev.map((s) => (s._id === editingId ? saved : s)));
      } else {
        setSeriesList((prev) => [...prev, saved].sort((a, b) => a.title.localeCompare(b.title)));
      }

      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this series? Posts in it will be unaffected.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/series/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete series");
      setSeriesList((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete series.");
    } finally {
      setDeleting(null);
    }
  };

  const postsForSeries = (seriesId: string) =>
    posts
      .filter((p) => {
        const sid =
          typeof p.series === "object" && p.series !== null ? p.series._id : p.series;
        return sid === seriesId;
      })
      .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          {editingId ? "Edit Series" : "New Series"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4"
        >
          {error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className={labelCls}>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="Series title"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              required
              placeholder="series-slug"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className={labelCls}>Cover Image URL</label>
            <input
              type="url"
              value={form.coverImage}
              onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
              placeholder="https://..."
              className={inputCls}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Update Series" : "Create Series"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Series list */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          All Series ({seriesList.length})
        </h2>

        <div className="space-y-4">
          {seriesList.length === 0 && (
            <div className="text-center py-12 text-zinc-400">No series yet.</div>
          )}
          {seriesList.map((s) => {
            const seriesPosts = postsForSeries(s._id);
            return (
              <div
                key={s._id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-white">{s.title}</p>
                    <p className="text-xs text-zinc-400">/{s.slug}</p>
                    {s.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(s)}
                      className="px-3 py-1 text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:opacity-80 transition-opacity"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      disabled={deleting === s._id}
                      className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {seriesPosts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      Posts ({seriesPosts.length})
                    </p>
                    <ol className="space-y-1">
                      {seriesPosts.map((p) => (
                        <li key={p._id} className="flex items-center gap-2 text-xs">
                          <span className="text-zinc-400 w-4 text-right">
                            {p.seriesOrder ?? "—"}
                          </span>
                          <a
                            href={`/admin/posts/${p._id}/edit`}
                            className="text-zinc-700 dark:text-zinc-300 hover:underline truncate"
                          >
                            {p.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

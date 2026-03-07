"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Editor from "./Editor";

const RichEditor = dynamic(() => import("./RichEditor"), { ssr: false });

interface SerializedPost {
  _id?: string;
  title: string;
  subheading?: string;
  slug: string;
  coverImage?: string;
  coverImageAlt?: string;
  body: string;
  tags: string[];
  series?: { _id: string; title: string; slug: string } | null;
  seriesOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  status:
    | "draft"
    | "scheduled"
    | "published"
    | "archived"
    | "private"
    | "unlisted";
  publishDate?: string;
  scheduledFor?: string;
  sendNewsletter: boolean;
}

interface Props {
  post?: SerializedPost;
}

const STATUS_OPTIONS = [
  "draft",
  "published",
  "scheduled",
  "archived",
  "private",
  "unlisted",
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function PostEditor({ post }: Props) {
  const router = useRouter();
  const isEdit = Boolean(post?._id);

  const [title, setTitle] = useState(post?.title ?? "");
  const [subheading, setSubheading] = useState(post?.subheading ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(post?.coverImageAlt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [tagsInput, setTagsInput] = useState((post?.tags ?? []).join(", "));
  const [seriesId, setSeriesId] = useState(post?.series?._id ?? "");
  const [seriesOrder, setSeriesOrder] = useState(
    String(post?.seriesOrder ?? ""),
  );
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    post?.seoDescription ?? "",
  );
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl ?? "");
  const [status, setStatus] = useState<SerializedPost["status"]>(
    post?.status ?? "draft",
  );
  const [scheduledFor, setScheduledFor] = useState(
    post?.scheduledFor
      ? new Date(post.scheduledFor).toISOString().slice(0, 16)
      : "",
  );
  const [publishDate, setPublishDate] = useState(
    post?.publishDate
      ? new Date(post.publishDate).toISOString().slice(0, 16)
      : "",
  );
  const [sendNewsletter, setSendNewsletter] = useState(
    post?.sendNewsletter ?? false,
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (!slugManuallyEdited) {
        setSlug(slugify(value));
      }
    },
    [slugManuallyEdited],
  );

  const handleSlugChange = useCallback((value: string) => {
    setSlug(slugify(value));
    setSlugManuallyEdited(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setError("Body is required.");
      return;
    }

    setSaving(true);
    setError("");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: Record<string, unknown> = {
      title,
      subheading: subheading || undefined,
      slug,
      coverImage: coverImage || undefined,
      coverImageAlt: coverImageAlt || undefined,
      body,
      tags,
      series: seriesId || undefined,
      seriesOrder: seriesOrder ? Number(seriesOrder) : undefined,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      canonicalUrl: canonicalUrl || undefined,
      status,
      scheduledFor:
        status === "scheduled" && scheduledFor ? scheduledFor : undefined,
      publishDate:
        status === "published" && publishDate ? publishDate : undefined,
      sendNewsletter,
    };

    try {
      const url = isEdit ? `/api/posts/${post!._id}` : "/api/posts";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ?? `Request failed with status ${res.status}`,
        );
      }

      const data = await res.json();
      router.push(`/admin/posts/${data._id ?? data.id}/edit`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500";

  const labelCls =
    "block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1";

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div>
              <label className={labelCls}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder="Post title"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Subheading</label>
              <input
                type="text"
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
                placeholder="Optional subheading"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Body *</label>
              <Editor />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Publish
              </h2>

              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as SerializedPost["status"])
                  }
                  className={inputCls}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {status === "scheduled" && (
                <div>
                  <label className={labelCls}>Schedule For</label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}

              {status === "published" && (
                <div>
                  <label className={labelCls}>Publish Date</label>
                  <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving…" : isEdit ? "Update Post" : "Create Post"}
              </button>
            </div>

            <div>
              <label className={labelCls}>Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required
                placeholder="post-slug"
                className={inputCls}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

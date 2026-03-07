"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const RichEditor = dynamic(() => import("./Editor"), { ssr: false });

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

interface SeriesOption {
  _id: string;
  title: string;
  slug: string;
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

  // Series list for dropdown
  const [seriesList, setSeriesList] = useState<SeriesOption[]>([]);
  useEffect(() => {
    fetch("/api/series")
      .then((r) => r.json())
      .then((data: SeriesOption[]) => setSeriesList(data))
      .catch(() => {
        /* non-critical */
      });
  }, []);

  // Cover image upload
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUrlInput, setCoverUrlInput] = useState(post?.coverImage ?? "");
  const coverFileRef = useRef<HTMLInputElement>(null);

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

  // Upload cover image file to R2
  const handleCoverFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      setCoverUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("alt", file.name);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error((d as { error?: string }).error ?? "Upload failed");
        }
        const d = (await res.json()) as { url: string };
        setCoverImage(d.url);
        setCoverUrlInput(d.url);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Cover image upload failed",
        );
      } finally {
        setCoverUploading(false);
      }
    },
    [],
  );

  // Proxy an external cover image URL through R2
  const handleCoverUrlSubmit = useCallback(async () => {
    const url = coverUrlInput.trim();
    if (!url) return;
    setCoverUploading(true);
    try {
      const res = await fetch("/api/upload-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "URL upload failed");
      }
      const d = (await res.json()) as { url: string };
      setCoverImage(d.url);
      setCoverUrlInput(d.url);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Cover image URL upload failed",
      );
    } finally {
      setCoverUploading(false);
    }
  }, [coverUrlInput]);

  const handleSubmit = async (submitStatus?: SerializedPost["status"]) => {
    const effectiveStatus = submitStatus ?? status;
    if (!body.trim()) {
      toast.error("Body is required.");
      return;
    }
    if (effectiveStatus === "published" && !coverImage.trim()) {
      toast.error("A cover image is required before publishing.");
      return;
    }

    setSaving(true);

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
      status: effectiveStatus,
      scheduledFor:
        effectiveStatus === "scheduled" && scheduledFor
          ? scheduledFor
          : undefined,
      publishDate:
        effectiveStatus === "published" && publishDate
          ? publishDate
          : undefined,
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
          (data as { error?: string }).error ??
            `Request failed with status ${res.status}`,
        );
      }

      const data = (await res.json()) as { _id?: string; id?: string };
      router.push(`/admin/posts/${data._id ?? data.id}/edit`);
      router.refresh();
    } catch (err) {
      toast.error(
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
      <div className="flex items-start">
        {/* Main editor area */}
        <div className="flex-1 min-w-0 overflow-y-auto h-full">
          <RichEditor value={body} onChange={setBody} />
        </div>

        {/* Sidebar */}
        <div className="w-72 xl:w-80 shrink-0 overflow-y-auto  h-screen">
          <div className="sticky top-4 overflow-y-auto pr-1">
            {/* Title / Slug / Subheading */}
            <div className="bg-white dark:bg-zinc-900 py-6 p-4 space-y-3">
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
            </div>

            {/* Cover Image */}
            <div className="bg-white dark:bg-zinc-900 py-6 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wide">
                Cover Image
              </h2>

              {/* File upload */}
              <div>
                <label className={labelCls}>Upload file</label>
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleCoverFileChange}
                />
                <button
                  type="button"
                  onClick={() => coverFileRef.current?.click()}
                  disabled={coverUploading}
                  className="w-full px-3 py-2 text-sm border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-500 dark:text-zinc-400 hover:border-zinc-500 dark:hover:border-zinc-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {coverUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    "Choose image file"
                  )}
                </button>
              </div>

              {/* URL input */}
              <div>
                <label className={labelCls}>Or paste URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={coverUrlInput}
                    onChange={(e) => setCoverUrlInput(e.target.value)}
                    placeholder="https://..."
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={handleCoverUrlSubmit}
                    disabled={coverUploading || !coverUrlInput.trim()}
                    className="px-3 py-2 text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 whitespace-nowrap flex items-center gap-1.5"
                  >
                    {coverUploading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                    Use URL
                  </button>
                </div>
              </div>

              {/* Preview */}
              {coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImage}
                  alt={coverImageAlt || "Cover preview"}
                  className="w-full rounded-lg object-cover aspect-video"
                />
              )}

              <div>
                <label className={labelCls}>Alt Text</label>
                <input
                  type="text"
                  value={coverImageAlt}
                  onChange={(e) => setCoverImageAlt(e.target.value)}
                  placeholder="Describe the image"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-zinc-900 py-6 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wide">
                Tags
              </h2>
              <div>
                <label className={labelCls}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="nextjs, react, typescript"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Series */}
            <div className="bg-white dark:bg-zinc-900 py-6 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wide">
                Series
              </h2>
              <div>
                <label className={labelCls}>Series</label>
                <select
                  value={seriesId}
                  onChange={(e) => setSeriesId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— None —</option>
                  {seriesList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              {seriesId && (
                <div>
                  <label className={labelCls}>Order in Series</label>
                  <input
                    type="number"
                    min="1"
                    value={seriesOrder}
                    onChange={(e) => setSeriesOrder(e.target.value)}
                    placeholder="1"
                    className={inputCls}
                  />
                </div>
              )}
            </div>

            {/* SEO */}
            <div className="bg-white dark:bg-zinc-900 py-6 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wide">
                SEO
              </h2>
              <div>
                <label className={labelCls}>SEO Title</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Overrides title in search results"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>SEO Description</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta description (150–160 chars recommended)"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
                <p className="text-xs text-zinc-400 mt-1">
                  {seoDescription.length} / 160
                </p>
              </div>
              <div>
                <label className={labelCls}>Canonical URL</label>
                <input
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="https://example.com/original-post"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Publish */}
            <div className="bg-white dark:bg-zinc-900 py-6 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wide">
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
                  <label className={labelCls}>Publish Date (backdate)</label>
                  <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    Leave empty to use the current date/time.
                  </p>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendNewsletter}
                  onChange={(e) => setSendNewsletter(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-600"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Send newsletter on publish
                </span>
              </label>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSubmit("published")}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Publish"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit("draft")}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Draft"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

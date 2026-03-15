"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { JSONContent } from "@tiptap/core";
import CoverCropperModal from "./CoverCropperModal";

const RichEditor = dynamic(() => import("./Editor"), { ssr: false });

interface SerializedPost {
  _id?: string;
  title: string;
  subheading?: string;
  slug: string;
  coverImage?: string;
  coverImageAlt?: string;
  bodyJSON: JSONContent;
  tags: string[];
  series?: { _id: string; title: string; slug: string } | null;
  seriesOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  excerpt?: string; // ADD THIS
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

/** Maximum file size accepted before cropping (bytes) */
const MAX_COVER_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

export default function PostEditor({ post }: Props) {
  const router = useRouter();
  const isEdit = Boolean(post?._id);

  const [title, setTitle] = useState(post?.title ?? "");
  const [subheading, setSubheading] = useState(post?.subheading ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(post?.coverImageAlt ?? "");
  const [bodyJSON, setBodyJSON] = useState<JSONContent | null>(
    post?.bodyJSON ?? null,
  );
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
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");

  // When editing, default to custom slug mode so auto-generation doesn't overwrite existing slug
  const [customSlug, setCustomSlug] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Debounced slug availability check
  useEffect(() => {
    if (!slug) {
      setSlugAvailable(null);
      return;
    }
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    setSlugChecking(true);
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ slug });
        if (post?._id) params.set("excludeId", post._id);
        const res = await fetch(`/api/posts/check-slug?${params}`);
        const data = (await res.json()) as { available: boolean };
        setSlugAvailable(data.available);
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 500);
    return () => {
      if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    };
  }, [slug, post?._id]);

  // Cover image upload
  const [coverImageMethod, setCoverImageMethod] = useState<"upload" | "url">(
    "upload",
  );
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUrlInput, setCoverUrlInput] = useState(post?.coverImage ?? "");
  const coverFileRef = useRef<HTMLInputElement>(null);

  // Cropper state
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (!customSlug) {
        setSlug(slugify(value));
      }
    },
    [customSlug],
  );

  const handleSlugChange = useCallback((value: string) => {
    setSlug(slugify(value));
  }, []);

  // Upload a blob as cover image to R2
  const uploadCoverBlob = useCallback(async (blob: Blob, fileName: string) => {
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, fileName);
      formData.append("alt", fileName);
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
  }, []);

  // Open cropper when a file is selected
  const handleCoverFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      // Validate file size before cropping
      if (file.size > MAX_COVER_FILE_BYTES) {
        toast.error("File is too large. Maximum size is 15 MB.");
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setPendingFile(file);
      setCropperSrc(objectUrl);
    },
    [],
  );

  const handleCropComplete = useCallback(
    (croppedBlob: Blob) => {
      setCropperSrc(null);
      const fileName = pendingFile?.name ?? "cover.jpg";
      setPendingFile(null);
      uploadCoverBlob(croppedBlob, fileName);
    },
    [pendingFile, uploadCoverBlob],
  );

  const handleCropCancel = useCallback(() => {
    if (cropperSrc) URL.revokeObjectURL(cropperSrc);
    setCropperSrc(null);
    setPendingFile(null);
  }, [cropperSrc]);

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
    if (!bodyJSON) {
      toast.error("Body is required.");
      return;
    }
    if (effectiveStatus === "published" && !coverImage.trim()) {
      toast.error("A cover image is required before publishing.");
      return;
    }
    if (slugAvailable === false) {
      toast.error("Slug is already taken. Please choose a different slug.");
      return;
    }

    if (sendNewsletter && !excerpt.trim()) {
      toast.error("Excerpt is required to send the newsletter.");
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
      bodyJSON,
      tags,
      series: seriesId || undefined,
      seriesOrder: seriesOrder ? Number(seriesOrder) : undefined,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      canonicalUrl: canonicalUrl || undefined,
      excerpt: sendNewsletter ? excerpt : undefined, // ADD
      status: effectiveStatus,
      scheduledFor:
        effectiveStatus === "scheduled" && scheduledFor
          ? scheduledFor
          : undefined,
      publishDate:
        effectiveStatus === "published" && publishDate
          ? new Date(publishDate).toISOString()
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
      if (isEdit) {
        // Stay on the editor page with a success toast
        toast.success("Post updated successfully.");
        router.refresh();
      } else {
        // Redirect to the new post's edit page
        toast.success("Post created successfully.");
        router.push(`/admin/posts/${data._id ?? data.id}/edit`);
      }
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
      {/* Cover image cropper modal */}
      {cropperSrc && (
        <CoverCropperModal
          imageSrc={cropperSrc}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <div className="flex items-start">
        {/* Main editor area */}
        <div className="flex-1 min-w-0 overflow-y-auto h-full">
          <RichEditor value={bodyJSON} onChange={setBodyJSON} />
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
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Slug *</label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customSlug}
                      onChange={(e) => setCustomSlug(e.target.checked)}
                      className="rounded border-zinc-300 dark:border-zinc-600 h-3 w-3"
                    />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Custom</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    required
                    disabled={!customSlug}
                    placeholder="post-slug"
                    className={`${inputCls} pr-7 ${!customSlug ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  {slug && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      {slugChecking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                      ) : slugAvailable === true ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : slugAvailable === false ? (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      ) : null}
                    </span>
                  )}
                </div>
                {!customSlug ? (
                  <p className="text-xs text-zinc-400 mt-1">Auto-generated from title</p>
                ) : slugAvailable === false ? (
                  <p className="text-xs text-red-500 mt-1">Slug is already taken</p>
                ) : null}
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

              {/* Method toggle */}
              <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setCoverImageMethod("upload")}
                  className={`flex-1 py-1.5 font-medium transition-colors ${
                    coverImageMethod === "upload"
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setCoverImageMethod("url")}
                  className={`flex-1 py-1.5 font-medium transition-colors ${
                    coverImageMethod === "url"
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  Paste URL
                </button>
              </div>

              {/* File upload */}
              {coverImageMethod === "upload" && (
                <div>
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
              )}

              {/* URL input */}
              {coverImageMethod === "url" && (
                <div>
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
              )}

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

              {sendNewsletter && (
                <div>
                  <label className={labelCls}>Newsletter Excerpt *</label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Short summary that will appear in the email..."
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    Recommended: 120–200 characters
                  </p>
                </div>
              )}

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

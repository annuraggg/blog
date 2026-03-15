"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  image: string;
  bio: string;
  website: string;
  twitter: string;
}

async function getCroppedImg(imageSrc: string, croppedArea: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = croppedArea.width;
      canvas.height = croppedArea.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(
        image,
        croppedArea.x,
        croppedArea.y,
        croppedArea.width,
        croppedArea.height,
        0,
        0,
        croppedArea.width,
        croppedArea.height,
      );
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Canvas is empty"));
        resolve(blob);
      }, "image/jpeg");
    };
    image.onerror = () => reject(new Error("Failed to load image"));
  });
}

export default function ProfileForm({ user }: { user: ProfileData }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio);
  const [website, setWebsite] = useState(user.website);
  const [twitter, setTwitter] = useState(user.twitter);
  const [image, setImage] = useState(user.image);
  const [saving, setSaving] = useState(false);

  // Image cropper state
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    if (!rawImageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedImg(rawImageSrc, croppedAreaPixels);
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt", "Profile photo");
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { url: string };
      setImage(data.url);
      setRawImageSrc(null);
      toast.success("Photo cropped and ready. Save profile to apply.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, image, bio, website, twitter }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save profile");
      }
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-zinc-400";
  const labelCls = "block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile photo */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Profile Photo
        </h2>

        <div className="flex items-center gap-4">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt="Profile photo"
              className="h-16 w-16 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-500 dark:text-zinc-300">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <label className="cursor-pointer px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Choose photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
            {image && (
              <button
                type="button"
                onClick={() => setImage("")}
                className="ml-2 text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Cropper dialog */}
        {rawImageSrc && (
          <div className="space-y-3">
            <div className="relative w-full h-64 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden">
              <Cropper
                image={rawImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRawImageSrc(null)}
                className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                disabled={uploading}
                className="px-3 py-1.5 text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
              >
                {uploading && <Loader2 className="h-3 w-3 animate-spin" />}
                {uploading ? "Uploading…" : "Crop & Use"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Basic info */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Basic Info
        </h2>
        <div>
          <label className={labelCls}>Name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Email *</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="A short description about yourself"
          />
        </div>
      </div>

      {/* Social links */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Social Links
        </h2>
        <div>
          <label className={labelCls}>Website</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yoursite.com"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Twitter handle</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">@</span>
            <input
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="yourhandle"
              className={`${inputCls} flex-1`}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? "Saving…" : "Save Profile"}
      </button>
    </form>
  );
}

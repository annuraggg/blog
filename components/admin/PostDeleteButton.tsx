"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Props {
  postId: string;
}

export default function PostDeleteButton({ postId }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this post? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post");
      router.refresh();
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Failed to delete post. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50 flex items-center gap-1"
    >
      {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      Delete
    </button>
  );
}

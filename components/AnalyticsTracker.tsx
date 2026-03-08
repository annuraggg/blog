"use client";

import { useEffect } from "react";

interface Props {
  postId: string;
}

export default function AnalyticsTracker({ postId }: Props) {
  useEffect(() => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    }).catch((err) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[AnalyticsTracker] Failed to track view:", err);
      }
    });
  }, [postId]);

  return null;
}

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
    }).catch(() => {
      // Silently ignore analytics errors
    });
  }, [postId]);

  return null;
}

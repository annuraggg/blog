"use client";

import { useEffect, useRef, useState } from "react";
import type { TocItem } from "@/lib/tiptapUtils";

interface Props {
  headings: TocItem[];
}

export default function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    // Locate the Tiptap read-only editor container
    const container = document.querySelector<HTMLElement>(".simple-editor");
    if (!container) return;

    // Assign stable IDs to DOM headings in document order.
    // Tiptap renders headings in the same order as the JSONContent document,
    // so the index-based mapping is reliable for a read-only editor.
    // A text-content check is included as an extra guard.
    const domHeadings = Array.from(
      container.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"),
    );
    headings.forEach((item, i) => {
      const el = domHeadings[i];
      if (el && el.textContent?.trim() === item.text.trim()) {
        el.id = item.id;
      } else if (el && !el.id) {
        // fallback: assign even if text doesn't match exactly
        el.id = item.id;
      }
    });

    // Track active heading via IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: 0 },
    );
    domHeadings.forEach((h) => observerRef.current?.observe(h));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    console.log("Scrolling to:", id, el);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
    }
  };

  const minLevel = Math.min(...headings.map((i) => i.level));

  return (
    <nav
      aria-label="Table of contents"
      className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">
        On this page
      </p>
      <ul className="space-y-1">
        {headings.map((item) => {
          const indent = (item.level - minLevel) * 12;
          const isActive = activeId === item.id;
          return (
            <li key={item.id} style={{ paddingLeft: indent }}>
              <button
                onClick={() => handleClick(item.id)}
                className={`text-left text-sm leading-snug w-full py-0.5 transition-colors ${
                  isActive
                    ? "text-zinc-900 dark:text-white font-medium"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                {item.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

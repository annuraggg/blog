"use client";

import { useEffect, useRef, useState } from "react";
import type { TocItem } from "@/lib/tiptapUtils";

interface Props {
  headings: TocItem[];
  /** When true, renders a compact collapsible dropdown for mobile viewports. */
  mobile?: boolean;
}

/**
 * Offset (px) to subtract when scrolling to a heading so it is not hidden
 * behind the sticky navbar (h-16 / 64 px on mobile, h-20 / 80 px on desktop).
 * 88 px gives a few pixels of breathing room above the heading.
 */
const SCROLL_OFFSET = 88;

export default function TableOfContents({ headings, mobile = false }: Props) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? "");
  const intersectingRef = useRef<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const headingIds = headings.map((h) => h.id);

    /** Assign IDs to DOM headings and start observing them. */
    const setup = (): boolean => {
      const container = document.querySelector<HTMLElement>(".simple-editor");
      if (!container) return false;

      const domHeadings = Array.from(
        container.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"),
      );
      if (domHeadings.length === 0) return false;

      // Assign stable IDs by index (Tiptap renders headings in document order).
      headings.forEach((item, i) => {
        const el = domHeadings[i];
        if (el) el.id = item.id;
      });

      // Reset tracking state.
      intersectingRef.current = new Set();
      observerRef.current?.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              intersectingRef.current.add(entry.target.id);
            } else {
              intersectingRef.current.delete(entry.target.id);
            }
          });
          // Pick the topmost heading (first in document order) that is
          // currently inside the observation window.
          const topmost = headingIds.find((id) =>
            intersectingRef.current.has(id),
          );
          if (topmost) setActiveId(topmost);
        },
        // Top margin accounts for the sticky navbar; bottom margin keeps the
        // detection window in the upper portion of the viewport so the active
        // heading matches what the reader is looking at.
        { rootMargin: `-${SCROLL_OFFSET}px 0px -80% 0px`, threshold: 0 },
      );

      domHeadings.forEach((h) => observerRef.current?.observe(h));
      return true;
    };

    // Show the first heading as active right away.
    setActiveId(headings[0].id);

    if (!setup()) {
      // The Tiptap editor renders asynchronously; wait for it to appear.
      // Observe the nearest <main> element (or document.body as a fallback)
      // rather than the full document to limit unnecessary callbacks.
      const root =
        document.querySelector<HTMLElement>("main") ?? document.body;
      const mutationObserver = new MutationObserver(() => {
        if (setup()) mutationObserver.disconnect();
      });
      mutationObserver.observe(root, {
        childList: true,
        subtree: true,
      });
      return () => {
        mutationObserver.disconnect();
        observerRef.current?.disconnect();
      };
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      // Scroll so the heading sits just below the sticky navbar.
      const y =
        el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
      window.scrollTo({ top: y, behavior: "smooth" });
      history.pushState(null, "", `#${id}`);
    }
  };

  const minLevel = Math.min(...headings.map((i) => i.level));

  const items = (
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
  );

  if (mobile) {
    return (
      <details className="border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 select-none">
          On this page
        </summary>
        <div className="mt-3">{items}</div>
      </details>
    );
  }

  return (
    <nav
      aria-label="Table of contents"
      className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">
        On this page
      </p>
      {items}
    </nav>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Parse headings from the article
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(
        "article h1, article h2, article h3, article h4",
      ),
    );

    if (headings.length === 0) return;

    // Ensure each heading has an id
    headings.forEach((h) => {
      if (!h.id) {
        h.id = h.textContent
          ? h.textContent
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")
          : `heading-${Math.random().toString(36).slice(2, 7)}`;
      }
    });

    const tocItems: TocItem[] = headings.map((h) => ({
      id: h.id,
      text: h.textContent ?? "",
      level: parseInt(h.tagName[1], 10),
    }));
    setItems(tocItems);

    // Intersection observer for active section highlighting
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: 0 },
    );

    headings.forEach((h) => observerRef.current?.observe(h));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  if (items.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const minLevel = Math.min(...items.map((i) => i.level));

  return (
    <nav
      aria-label="Table of contents"
      className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">
        On this page
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
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

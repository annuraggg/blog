import type { JSONContent } from "@tiptap/core";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getNodeText(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(getNodeText).join("");
}

/**
 * Recursively traverse a Tiptap JSONContent document and collect all headings
 * (h1–h6) with stable slugified IDs.
 */
export function extractHeadings(doc: JSONContent | null | undefined): TocItem[] {
  if (!doc) return [];

  const items: TocItem[] = [];
  const idCounts: Record<string, number> = {};

  function traverse(node: JSONContent) {
    if (node.type === "heading" && node.attrs?.level) {
      const text = getNodeText(node);
      const base = slugify(text) || `heading-${items.length}`;
      const count = idCounts[base] ?? 0;
      idCounts[base] = count + 1;
      const id = count === 0 ? base : `${base}-${count}`;
      items.push({ id, text, level: node.attrs.level as number });
    }
    (node.content ?? []).forEach(traverse);
  }

  traverse(doc);
  return items;
}

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function TiptapRenderer({ content }: { content: string }) {
  const editor = useEditor({
    editable: false,
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
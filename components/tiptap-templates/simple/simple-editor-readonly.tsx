"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";

// Extensions
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Selection } from "@tiptap/extensions";
import { Markdown } from "tiptap-markdown";
import { Mathematics } from "@tiptap/extension-mathematics";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { createLowlight, all } from "lowlight";

import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";

import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

import "@/components/tiptap-templates/simple/simple-editor.scss";

const lowlight = createLowlight(all);

export function ReadOnlyEditor({
  content,
}: {
  content?: JSONContent | string;
}) {
  const editor = useEditor({
    editable: false, // ← THE MAGIC SWITCH
    immediatelyRender: false,

    editorProps: {
      attributes: {
        class: "simple-editor readonly-editor",
      },
    },

    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        codeBlock: false,
        link: {
          openOnClick: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      Markdown.configure({
        html: true,
        tightLists: true,
      }),
      Mathematics.configure({
        katexOptions: { throwOnError: false },
      }),
      CodeBlockLowlight.configure({ lowlight }),
    ],

    content,
  });

  if (!editor) return null;

  return (
    <div className="font-sans text-xl leading-relaxed">
      <EditorContent editor={editor}  />
    </div>
  );
}

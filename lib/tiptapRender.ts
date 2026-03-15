import { generateHTML } from "@tiptap/html";
import { generateText, type JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { Typography } from "@tiptap/extension-typography";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Node } from "@tiptap/core";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { createLowlight, all } from "lowlight";

const lowlight = createLowlight(all);

// Minimal server-safe stub for imageUpload nodes (no ReactNodeViewRenderer)
const ImageUploadNodeStub = Node.create({
  name: "imageUpload",
  group: "block",
  renderHTML() {
    return ["div", { "data-type": "image-upload" }];
  },
});

const extensions = [
  StarterKit.configure({ codeBlock: false }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Highlight.configure({ multicolor: true }),
  Image,
  Typography,
  Superscript,
  Subscript,
  TaskList,
  TaskItem.configure({ nested: true }),
  ImageUploadNodeStub,
  CodeBlockLowlight.configure({ lowlight }),
];

export function renderTiptapHTML(content: JSONContent): string {
  return generateHTML(content, extensions);
}

export function renderTiptapText(content: JSONContent): string {
  return generateText(content, extensions);
}

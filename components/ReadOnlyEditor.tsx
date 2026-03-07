import React from "react";
import { ReadOnlyEditor } from "./tiptap-templates/simple/simple-editor-readonly";
import type { JSONContent } from "@tiptap/core";

interface EditorProps {
  content: JSONContent | null;
}

const Editor = ({ content }: EditorProps) => {
  return (
    <div className="w-full ">
      <ReadOnlyEditor content={content ?? undefined} />
    </div>
  );
};

export default Editor;

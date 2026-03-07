import React from "react";
import { SimpleEditor } from "../tiptap-templates/simple/simple-editor";
import type { JSONContent } from "@tiptap/core";

interface EditorProps {
  value: JSONContent | null;
  onChange: (content: JSONContent) => void;
}

const Editor = ({ value, onChange }: EditorProps) => {
  return (
    <div className="w-full ">
      <SimpleEditor initialContent={value ?? undefined} onChange={onChange} />
    </div>
  );
};

export default Editor;

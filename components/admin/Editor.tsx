import React from "react";
import { SimpleEditor } from "../tiptap-templates/simple/simple-editor";

interface EditorProps {
  value: string;
  onChange: (content: string) => void;
}

const Editor = ({ value, onChange }: EditorProps) => {
  return (
    <div className="w-full ">
      <SimpleEditor initialContent={value} onChange={onChange} />
    </div>
  );
};

export default Editor;

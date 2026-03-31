"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { cn } from "@/utils/helpers";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="space-y-2">
      <div className="h-10 bg-neutral-100 rounded-t-xl animate-pulse" />
      <div className="h-32 bg-neutral-50 rounded-b-xl animate-pulse" />
    </div>
  ),
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

const TOOLBAR_OPTIONS = [
  ["bold", "italic", "underline", "strike"],
  [{ header: 1 }, { header: 2 }, { header: 3 }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "link"],
  ["clean"],
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  label,
  className,
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR_OPTIONS,
    }),
    []
  );

  return (
    <div className={cn("rich-text-editor", className)}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="[&_.ql-toolbar]:border-neutral-200 [&_.ql-toolbar]:rounded-t-xl [&_.ql-toolbar]:border [&_.ql-toolbar]:border-b-0 [&_.ql-container]:border [&_.ql-container]:border-neutral-200 [&_.ql-container]:rounded-b-xl [&_.ql-container]:text-sm [&_.ql-editor]:min-h-[120px] [&_.ql-container:focus-within]:border-[#E84672] [&_.ql-toolbar:has(+.ql-container:focus-within)]:border-[#E84672]">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          modules={modules}
        />
      </div>
    </div>
  );
}

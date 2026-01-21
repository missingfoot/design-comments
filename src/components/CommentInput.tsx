import { useState, useRef, useEffect } from "react";

interface CommentInputProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
  inline?: boolean;
  collapsed?: boolean;
  onExpand?: () => void;
  darkMode?: boolean;
  submitLabel?: string;
}

export function CommentInput({
  onSubmit,
  onCancel,
  placeholder = "Add a comment...",
  autoFocus = false,
  compact = false,
  inline = false,
  collapsed = false,
  onExpand,
  darkMode = false,
  submitLabel = "Reply",
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  const baseClass = inline
    ? "w-full"
    : `rounded-lg shadow-xl border overflow-hidden ${
        compact ? "w-full" : "w-72"
      } ${darkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-neutral-200"}`;

  // Collapsed state - show placeholder text that expands on click
  if (collapsed) {
    return (
      <div
        data-design-comments="comment-input"
        className="w-full cursor-text"
        onClick={(e) => {
          e.stopPropagation();
          onExpand?.();
        }}
      >
        <div className={`text-sm ${darkMode ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-400 hover:text-neutral-600"}`}>
          Reply...
        </div>
      </div>
    );
  }

  return (
    <div
      data-design-comments="comment-input"
      className={baseClass}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        className={`w-full text-sm resize-none border-none outline-none leading-normal max-h-32 overflow-y-auto ${
          darkMode ? "scrollbar-thin-dark" : "scrollbar-thin"
        } ${
          inline ? "p-0 bg-transparent" : darkMode ? "p-3 bg-neutral-900" : "p-3 bg-white"
        } ${darkMode ? "text-white placeholder-neutral-500" : "text-neutral-900 placeholder-neutral-400"}`}
      />
      <div className={`flex items-center gap-2 ${
        inline
          ? "pt-2"
          : `justify-end px-3 py-2 border-t ${
              darkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"
            }`
      }`}>
        <div className={`flex gap-2 ${inline ? "ml-auto" : ""}`}>
          <button
            onClick={onCancel}
            className={`px-2 py-1 text-sm ${darkMode ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-500 hover:text-neutral-700"}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

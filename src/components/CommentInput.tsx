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
    ? "dc-w-full"
    : `dc-rounded-lg dc-shadow-xl dc-border dc-overflow-hidden ${
        compact ? "dc-w-full" : "dc-w-72"
      } ${darkMode ? "dc-bg-neutral-900 dc-border-neutral-700" : "dc-bg-white dc-border-neutral-200"}`;

  // Collapsed state - show placeholder text that expands on click
  if (collapsed) {
    return (
      <div
        data-design-comments="comment-input"
        className="dc-w-full dc-cursor-text"
        onClick={(e) => {
          e.stopPropagation();
          onExpand?.();
        }}
      >
        <div className={`dc-text-sm ${darkMode ? "dc-text-neutral-500 hover:dc-text-neutral-300" : "dc-text-neutral-400 hover:dc-text-neutral-600"}`}>
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
        className={`dc-w-full dc-text-sm dc-resize-none dc-border-none dc-outline-none dc-leading-normal dc-max-h-32 dc-overflow-y-auto ${
          darkMode ? "dc-scrollbar-thin-dark" : "dc-scrollbar-thin"
        } ${
          inline ? "dc-p-0 dc-bg-transparent" : darkMode ? "dc-p-3 dc-bg-neutral-900" : "dc-p-3 dc-bg-white"
        } ${darkMode ? "dc-text-white dc-placeholder-neutral-500" : "dc-text-neutral-900 dc-placeholder-neutral-400"}`}
      />
      <div className={`dc-flex dc-items-center dc-gap-2 ${
        inline
          ? "dc-pt-2"
          : `dc-justify-end dc-px-3 dc-py-2 dc-border-t ${
              darkMode ? "dc-bg-neutral-800 dc-border-neutral-700" : "dc-bg-neutral-50 dc-border-neutral-200"
            }`
      }`}>
        <div className={`dc-flex dc-gap-2 ${inline ? "dc-ml-auto" : ""}`}>
          <button
            onClick={onCancel}
            className={`dc-px-2 dc-py-1 dc-text-sm ${darkMode ? "dc-text-neutral-400 hover:dc-text-neutral-200" : "dc-text-neutral-500 hover:dc-text-neutral-700"}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="dc-px-3 dc-py-1 dc-text-sm dc-bg-blue-500 dc-text-white dc-rounded dc-disabled:opacity-50 hover:dc-bg-blue-600"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

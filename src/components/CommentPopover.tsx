import { useState } from "react";
import type { CommentThread, Comment } from "../hooks/useComments";
import { CommentInput } from "./CommentInput";
import { formatRelativeTime } from "../lib/time";
import type { PopoverPosition } from "./CommentPins";

interface CommentPopoverProps {
  thread: CommentThread;
  onReply: (content: string) => void;
  darkMode: boolean;
  position?: PopoverPosition;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onEngage?: () => void;
  onDisengage?: () => void;
}

export function CommentPopover({
  thread,
  onReply,
  darkMode,
  position = { side: "right", above: false },
  onMouseEnter,
  onMouseLeave,
  onEngage,
  onDisengage,
}: CommentPopoverProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);

  const handleReply = (content: string) => {
    onReply(content);
    setShowReplyInput(false);
    onDisengage?.();
  };

  const handleExpand = () => {
    setShowReplyInput(true);
    onEngage?.();
  };

  const handleCancel = () => {
    setShowReplyInput(false);
    onDisengage?.();
  };

  // Build position classes based on calculated position
  const horizontalClass = position.side === "right"
    ? "left-full ml-2"
    : "right-full mr-2";

  // Vertical positioning: bottom: 0 anchors popover bottom at pin, so it grows upward
  const verticalStyle = position.above
    ? { bottom: 0 } // popover grows upward from pin
    : { top: 0 }; // popover grows downward from pin

  return (
    <div
      data-design-comments="popover"
      className={`absolute ${horizontalClass} w-72 rounded-lg shadow-xl border overflow-hidden z-[10002] ${
        darkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-neutral-200"
      }`}
      style={verticalStyle}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Thread content */}
      <div className={`max-h-64 overflow-y-auto ${darkMode ? "scrollbar-thin-dark" : "scrollbar-thin"}`}>
        <CommentItem comment={thread} darkMode={darkMode} />
        {thread.replies.map((reply) => (
          <CommentItem key={reply.id} comment={reply} isReply darkMode={darkMode} />
        ))}
      </div>

      {/* Reply section */}
      <div className={`border-t px-3 py-3 ${
        darkMode ? "border-neutral-700" : "border-neutral-100"
      }`}>
        <CommentInput
          onSubmit={handleReply}
          onCancel={handleCancel}
          placeholder="Write a reply..."
          autoFocus={showReplyInput}
          compact
          inline
          collapsed={!showReplyInput}
          onExpand={handleExpand}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  isReply = false,
  darkMode = false,
}: {
  comment: Comment;
  isReply?: boolean;
  darkMode?: boolean;
}) {
  return (
    <div
      className={`p-3 ${
        isReply
          ? darkMode
            ? "border-t border-neutral-700"
            : "border-t border-neutral-100"
          : ""
      } ${comment.resolved ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
            style={{ backgroundColor: comment.authorColor }}
          >
            {comment.author[0].toUpperCase()}
          </div>
          <span className={`text-sm font-medium ${darkMode ? "text-white" : "text-neutral-900"}`}>
            {comment.author}
          </span>
        </div>
        <span className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
          {formatRelativeTime(comment.createdAt)}
        </span>
      </div>
      <p className={`text-sm whitespace-pre-wrap ${darkMode ? "text-neutral-300" : "text-neutral-700"}`}>
        {comment.content}
      </p>
    </div>
  );
}

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
    ? "dc-left-full dc-ml-2"
    : "dc-right-full dc-mr-2";

  // Vertical positioning: bottom: 0 anchors popover bottom at pin, so it grows upward
  const verticalStyle = position.above
    ? { bottom: 0 } // popover grows upward from pin
    : { top: 0 }; // popover grows downward from pin

  return (
    <div
      data-design-comments="popover"
      className={`dc-absolute ${horizontalClass} dc-w-72 dc-rounded-lg dc-shadow-xl dc-border dc-overflow-hidden dc-z-[10002] ${
        darkMode ? "dc-bg-neutral-900 dc-border-neutral-700" : "dc-bg-white dc-border-neutral-200"
      }`}
      style={verticalStyle}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Thread content */}
      <div className={`dc-max-h-64 dc-overflow-y-auto ${darkMode ? "dc-scrollbar-thin-dark" : "dc-scrollbar-thin"}`}>
        <CommentItem comment={thread} darkMode={darkMode} />
        {thread.replies.map((reply) => (
          <CommentItem key={reply.id} comment={reply} isReply darkMode={darkMode} />
        ))}
      </div>

      {/* Reply section */}
      <div className={`dc-border-t dc-px-3 dc-py-3 ${
        darkMode ? "dc-border-neutral-700" : "dc-border-neutral-100"
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
      className={`dc-p-3 ${
        isReply
          ? darkMode
            ? "dc-border-t dc-border-neutral-700"
            : "dc-border-t dc-border-neutral-100"
          : ""
      } ${comment.resolved ? "dc-opacity-60" : ""}`}
    >
      <div className="dc-flex dc-items-center dc-justify-between dc-mb-1">
        <div className="dc-flex dc-items-center dc-gap-2">
          <div
            className="dc-w-5 dc-h-5 dc-rounded-full dc-flex dc-items-center dc-justify-center dc-text-white dc-text-xs"
            style={{ backgroundColor: comment.authorColor }}
          >
            {comment.author[0].toUpperCase()}
          </div>
          <span className={`dc-text-sm dc-font-medium ${darkMode ? "dc-text-white" : "dc-text-neutral-900"}`}>
            {comment.author}
          </span>
        </div>
        <span className={`dc-text-xs ${darkMode ? "dc-text-neutral-500" : "dc-text-neutral-400"}`}>
          {formatRelativeTime(comment.createdAt)}
        </span>
      </div>
      <p className={`dc-text-sm dc-whitespace-pre-wrap ${darkMode ? "dc-text-neutral-300" : "dc-text-neutral-700"}`}>
        {comment.content}
      </p>
    </div>
  );
}

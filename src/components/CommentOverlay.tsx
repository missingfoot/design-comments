import { useState, useEffect } from "react";
import { useProject } from "../hooks/useProject";
import { usePageUrl } from "../hooks/usePageUrl";
import { useComments } from "../hooks/useComments";
import { useAnchoring } from "../hooks/useAnchoring";
import { getUser, createUser, type User } from "../lib/user";
import { createAnchor } from "../lib/anchor";
import { CommentPins } from "./CommentPins";
import { Sidebar } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { AuthModal } from "./AuthModal";
import { CommentInput } from "./CommentInput";

export function CommentOverlay() {
  const [user, setUser] = useState<User | null>(getUser);
  const [commentMode, setCommentMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPosition, setSidebarPosition] = useState<"left" | "right">("right");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("dc-dark-mode");
    return saved === "true";
  });
  const [pendingAnchor, setPendingAnchor] = useState<{
    anchor: ReturnType<typeof createAnchor>;
    position: { x: number; y: number };
  } | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null
  );

  const { projectId, isLoading: projectLoading } = useProject();
  const pageUrl = usePageUrl();
  const { threads, addComment, resolveComment, deleteComment } = useComments(
    projectId,
    pageUrl
  );
  const positions = useAnchoring(threads);

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem("dc-dark-mode", String(darkMode));
  }, [darkMode]);

  // Keyboard shortcut: Press 'C' to toggle comment mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isEditable =
        tagName === "input" ||
        tagName === "textarea" ||
        target.isContentEditable ||
        target.closest("[contenteditable]");

      if (isEditable) return;

      // Ignore if modifier keys are pressed (Ctrl+C, Cmd+C, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Toggle comment mode on 'C' or 'c'
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setCommentMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Handle click on page elements when in comment mode
  const handlePageClick = (e: React.MouseEvent) => {
    if (!commentMode || !user) return;

    e.preventDefault();
    e.stopPropagation();

    // Hide the capture layer temporarily to find element underneath
    const captureLayer = e.currentTarget as HTMLElement;
    captureLayer.style.pointerEvents = "none";

    const target = document.elementFromPoint(e.clientX, e.clientY);

    captureLayer.style.pointerEvents = "auto";

    if (!target) return;

    // Ignore clicks on our own UI
    if (target.closest("[data-design-comments]")) return;

    const anchor = createAnchor(target, e.clientX, e.clientY);

    setPendingAnchor({
      anchor,
      position: {
        x: e.clientX,
        y: e.clientY,
      },
    });
  };

  const handleSubmitComment = (content: string) => {
    if (!pendingAnchor || !user) return;
    addComment(pendingAnchor.anchor, content, user);
    setPendingAnchor(null);
    setCommentMode(false);
  };

  const handleCancelComment = () => {
    setPendingAnchor(null);
  };

  const handleAuth = (name: string) => {
    const newUser = createUser(name);
    setUser(newUser);
  };

  // Show auth modal if no user
  if (!user) {
    return <AuthModal onSubmit={handleAuth} />;
  }

  if (projectLoading) {
    return null;
  }

  // Comment mode cursor
  const commentCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath d='M14,.5H2c-.828,0-1.5,.672-1.5,1.5V11c0,.828,.672,1.5,1.5,1.5h3.5l2.5,3,2.5-3h3.5c.828,0,1.5-.672,1.5-1.5V2c0-.828-.672-1.5-1.5-1.5Z' fill='white' stroke='%23212121' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") 8 15, crosshair`;

  return (
    <div data-design-comments="root">
      {/* Comment mode cursor */}
      {commentMode && (
        <style>{`
          html, body, body * {
            cursor: ${commentCursor} !important;
          }
          [data-design-comments] input,
          [data-design-comments] textarea {
            cursor: text !important;
          }
        `}</style>
      )}

      {/* Click capture layer for comment mode */}
      {commentMode && (
        <div
          data-design-comments="capture"
          onClick={handlePageClick}
          className="dc-fixed dc-inset-0 dc-z-[9998]"
        />
      )}

      {/* Comment pins */}
      <CommentPins
        threads={threads}
        positions={positions}
        selectedId={selectedCommentId}
        onSelect={setSelectedCommentId}
        onReply={(commentId, content) => {
          const thread = threads.find((t) => t.id === commentId);
          if (thread && user) {
            addComment(thread.anchor, content, user, commentId);
          }
        }}
        darkMode={darkMode}
      />

      {/* Pending comment input */}
      {pendingAnchor && (
        <PendingCommentInput
          position={pendingAnchor.position}
          userColor={user?.color || "#3b82f6"}
          onSubmit={handleSubmitComment}
          onCancel={handleCancelComment}
          darkMode={darkMode}
        />
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          threads={threads}
          selectedId={selectedCommentId}
          onSelect={setSelectedCommentId}
          onClose={() => setSidebarOpen(false)}
          onDelete={deleteComment}
          onResolve={resolveComment}
          position={sidebarPosition}
          onTogglePosition={() => setSidebarPosition(sidebarPosition === "right" ? "left" : "right")}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
      )}

      {/* Toolbar */}
      <Toolbar
        commentMode={commentMode}
        onToggleCommentMode={() => setCommentMode(!commentMode)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        darkMode={darkMode}
      />
    </div>
  );
}

const INPUT_WIDTH = 280;
const INPUT_HEIGHT = 80;
const MARGIN = 16;

interface PendingCommentInputProps {
  position: { x: number; y: number };
  userColor: string;
  onSubmit: (content: string) => void;
  onCancel: () => void;
  darkMode: boolean;
}

function PendingCommentInput({
  position,
  userColor,
  onSubmit,
  onCancel,
  darkMode,
}: PendingCommentInputProps) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Determine horizontal position
  const spaceOnRight = viewportWidth - position.x;
  const showOnLeft = spaceOnRight < INPUT_WIDTH + MARGIN + 16;

  // Determine vertical adjustment
  const spaceBelow = viewportHeight - position.y;
  const spaceAbove = position.y;

  let verticalTransform = "-50%"; // center by default
  if (spaceBelow < INPUT_HEIGHT / 2 + MARGIN) {
    // Not enough space below, align to bottom
    verticalTransform = "-100%";
  } else if (spaceAbove < INPUT_HEIGHT / 2 + MARGIN) {
    // Not enough space above, align to top
    verticalTransform = "0%";
  }

  const inputStyle = showOnLeft
    ? {
        right: viewportWidth - position.x + 16,
        top: position.y,
        transform: `translateY(${verticalTransform})`,
      }
    : {
        left: position.x + 16,
        top: position.y,
        transform: `translateY(${verticalTransform})`,
      };

  return (
    <>
      {/* Bubble dot at click position */}
      <div
        data-design-comments="pending-dot"
        className="dc-fixed dc-z-[10001] dc-w-4 dc-h-4 dc-rounded-full dc-border-2 dc-border-white"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
          backgroundColor: userColor,
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      />
      {/* Input positioned smartly */}
      <div
        data-design-comments="input"
        className="dc-fixed dc-z-[10001]"
        style={inputStyle}
      >
        <CommentInput
          onSubmit={onSubmit}
          onCancel={onCancel}
          placeholder="Add a comment..."
          autoFocus
          darkMode={darkMode}
        />
      </div>
    </>
  );
}

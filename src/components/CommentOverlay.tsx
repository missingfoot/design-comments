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
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("dc-sidebar-open");
    return saved === "true"; // Default to closed (false)
  });
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

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem("dc-sidebar-open", String(sidebarOpen));
  }, [sidebarOpen]);

  // Keyboard shortcut: Press 'C' to toggle comment mode
  // Only active when user is authenticated (not during auth modal)
  useEffect(() => {
    if (!user) return;

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
  }, [user]);

  // Handle click on page elements when in comment mode
  const handlePageClick = (e: React.MouseEvent) => {
    if (!commentMode || !user) return;

    e.preventDefault();
    e.stopPropagation();

    // Close any open comment popover when clicking to create a new one
    setSelectedCommentId(null);

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
    // Stay in comment mode - user can press C or click button to exit
    // Comment is created as a pin, user can click it to open if needed
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
          [data-design-comments="sidebar"],
          [data-design-comments="sidebar"] *,
          [data-design-comments="toolbar"],
          [data-design-comments="toolbar"] *,
          [data-design-comments="popover"],
          [data-design-comments="popover"] * {
            cursor: default !important;
          }
          [data-design-comments] input,
          [data-design-comments] textarea {
            cursor: text !important;
          }
          [data-design-comments] button {
            cursor: pointer !important;
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

      {/* Pending comment - shows as a full pin with input popover */}
      {pendingAnchor && (
        <PendingCommentPin
          position={pendingAnchor.position}
          userColor={user?.color || "#3b82f6"}
          pinNumber={threads.length + 1}
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

const POPOVER_WIDTH = 288;
const MARGIN = 16;
const MIN_SPACE_BELOW = 200;

interface PendingCommentPinProps {
  position: { x: number; y: number };
  userColor: string;
  pinNumber: number;
  onSubmit: (content: string) => void;
  onCancel: () => void;
  darkMode: boolean;
}

function PendingCommentPin({
  position,
  userColor,
  pinNumber,
  onSubmit,
  onCancel,
  darkMode,
}: PendingCommentPinProps) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;

  // Calculate popover position (same logic as CommentPins)
  const spaceOnRight = viewportWidth - position.x;
  const spaceOnLeft = position.x;
  const showOnLeft = !(spaceOnRight >= POPOVER_WIDTH + MARGIN) &&
    (spaceOnLeft >= POPOVER_WIDTH + MARGIN || spaceOnLeft > spaceOnRight);

  // Check available space below and above
  const spaceBelow = viewportHeight - position.y - MARGIN;
  const spaceAbove = position.y - MARGIN;
  const showAbove = spaceBelow < MIN_SPACE_BELOW && spaceAbove > spaceBelow;

  // Popover positioning classes and styles
  const horizontalClass = showOnLeft ? "dc-right-full dc-mr-2" : "dc-left-full dc-ml-2";
  const verticalStyle = showAbove
    ? { bottom: 0 } // popover grows upward from pin
    : { top: 0 }; // popover grows downward from pin

  return (
    <div
      data-design-comments="pending-pin"
      className="dc-fixed dc-pointer-events-auto dc-z-[10003]"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Pin marker - same style as existing pins */}
      <div
        className="dc-w-7 dc-h-7 dc-rounded-full dc-flex dc-items-center dc-justify-center dc-text-white dc-text-xs dc-font-medium dc-shadow-lg dc-border-2 dc-border-white dc-scale-110"
        style={{ backgroundColor: userColor }}
      >
        {pinNumber}
      </div>

      {/* Input popover - same style as comment popover */}
      <div
        data-design-comments="popover"
        className={`dc-absolute ${horizontalClass} dc-w-72 dc-rounded-lg dc-shadow-xl dc-border dc-overflow-hidden dc-z-[10002] ${
          darkMode ? "dc-bg-neutral-900 dc-border-neutral-700" : "dc-bg-white dc-border-neutral-200"
        }`}
        style={verticalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dc-p-3">
          <CommentInput
            onSubmit={onSubmit}
            onCancel={onCancel}
            placeholder="Add a comment..."
            autoFocus
            inline
            darkMode={darkMode}
            submitLabel="Submit"
          />
        </div>
      </div>
    </div>
  );
}

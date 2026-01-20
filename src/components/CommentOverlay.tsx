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

  // Custom cursors
  const userColorEncoded = encodeURIComponent(user.color);
  const defaultCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%23212121' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.1666 9.16667L4.1666 4.16667L9.1666 21.1667L12.9999 13L21.1666 9.16667Z' stroke='%23212121' stroke-width='2' fill='white'/%3E%3C/g%3E%3C/svg%3E") 4 4, default`;
  const pointerCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%23212121' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M7.99995 12V3C7.99995 1.89543 8.89538 1 9.99995 1V1C11.1045 1 11.9999 1.89543 11.9999 3V7.5L18.4522 9.12095C20.1446 9.52767 21.2363 11.1655 20.9562 12.8777L19.4999 22H8.99995V21.4762C8.99995 20.7351 8.72562 20.0202 8.22984 19.4693L5.78351 16.7511C4.95721 15.833 4.5 14.6415 4.5 13.4063V11C4.5 9.89543 5.39543 9 6.5 9H7.5' stroke='%23212121' stroke-width='2' fill='white'/%3E%3C/g%3E%3C/svg%3E") 10 1, pointer`;
  const commentCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%23212121' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m20,3H4c-1.105,0-2,.895-2,2v11c0,1.105.895,2,2,2h5l3,4,3-4h5c1.105,0,2-.895,2-2V5c0-1.105-.895-2-2-2Z' fill='white' stroke='%23212121' stroke-width='2'/%3E%3C/g%3E%3C/svg%3E") 12 22, crosshair`;

  return (
    <div data-design-comments="root">
      {/* Global cursor style */}
      <style>{`
        html, body, body * {
          cursor: ${commentMode ? commentCursor : defaultCursor} !important;
        }
        a, button, [role="button"], input[type="submit"], input[type="button"], select, label[for], [onclick] {
          cursor: ${pointerCursor} !important;
        }
        [data-design-comments] input,
        [data-design-comments] textarea {
          cursor: text !important;
        }
        [data-design-comments] button {
          cursor: ${pointerCursor} !important;
        }
      `}</style>

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
        <>
          {/* Bubble dot at click position */}
          <div
            data-design-comments="pending-dot"
            className="dc-fixed dc-z-[10001] dc-w-4 dc-h-4 dc-rounded-full dc-border-2 dc-border-white"
            style={{
              left: pendingAnchor.position.x,
              top: pendingAnchor.position.y,
              transform: "translate(-50%, -50%)",
              backgroundColor: user?.color || "#3b82f6",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            }}
          />
          {/* Input to the right of the dot */}
          <div
            data-design-comments="input"
            className="dc-fixed dc-z-[10001]"
            style={{
              left: pendingAnchor.position.x + 16,
              top: pendingAnchor.position.y,
              transform: "translateY(-50%)",
            }}
          >
            <CommentInput
              onSubmit={handleSubmitComment}
              onCancel={handleCancelComment}
              placeholder="Add a comment..."
              autoFocus
            />
          </div>
        </>
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

import { useState } from "react";
import type { CommentThread } from "../hooks/useComments";
import { formatRelativeTime } from "../lib/time";

interface SidebarProps {
  threads: CommentThread[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onResolve: (id: string, resolved: boolean) => void;
  position: "left" | "right";
  onTogglePosition: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Sidebar({
  threads,
  selectedId,
  onSelect,
  onClose,
  onDelete,
  onResolve,
  position,
  onTogglePosition,
  darkMode,
  onToggleDarkMode,
}: SidebarProps) {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    threadId: string;
    resolved: boolean;
  } | null>(null);

  const filteredThreads = threads
    .filter((thread) => {
      if (filter === "open") return !thread.resolved;
      if (filter === "resolved") return thread.resolved;
      return true;
    })
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const openCount = threads.filter((t) => !t.resolved).length;
  const resolvedCount = threads.filter((t) => t.resolved).length;

  const handleContextMenu = (e: React.MouseEvent, thread: CommentThread) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      threadId: thread.id,
      resolved: thread.resolved,
    });
  };

  const handleResolve = () => {
    if (contextMenu) {
      onResolve(contextMenu.threadId, !contextMenu.resolved);
      setContextMenu(null);
    }
  };

  const handleDelete = () => {
    if (contextMenu) {
      onDelete(contextMenu.threadId);
      setContextMenu(null);
    }
  };

  return (
    <div
      data-design-comments="sidebar"
      className={`dc-fixed dc-top-4 dc-bottom-4 dc-w-80 dc-rounded-lg dc-shadow-2xl dc-border dc-flex dc-flex-col dc-z-[10000] ${
        position === "right" ? "dc-right-4" : "dc-left-4"
      } ${
        darkMode
          ? "dc-bg-neutral-900 dc-border-neutral-700"
          : "dc-bg-white dc-border-neutral-200"
      }`}
      onClick={() => setContextMenu(null)}
    >
      {/* Header */}
      <div className="dc-flex dc-items-center dc-justify-between dc-px-4 dc-py-3">
        <h2 className={`dc-font-semibold ${darkMode ? "dc-text-white" : "dc-text-neutral-900"}`}>Comments</h2>
        <button
          onClick={onClose}
          className={`dc-p-1 ${darkMode ? "dc-text-neutral-400 hover:dc-text-neutral-200" : "dc-text-neutral-400 hover:dc-text-neutral-600"}`}
        >
          <svg
            className="dc-w-5 dc-h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Filter tabs */}
      <div className={`dc-flex dc-gap-1 dc-px-4 dc-pb-2 dc-border-b ${
        darkMode ? "dc-border-neutral-700" : "dc-border-neutral-200"
      }`}>
        <FilterTab
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
          count={threads.length}
          darkMode={darkMode}
        />
        <FilterTab
          active={filter === "open"}
          onClick={() => setFilter("open")}
          label="Open"
          count={openCount}
          darkMode={darkMode}
        />
        <FilterTab
          active={filter === "resolved"}
          onClick={() => setFilter("resolved")}
          label="Resolved"
          count={resolvedCount}
          darkMode={darkMode}
        />
      </div>

      {/* Comment list */}
      <div className={`dc-flex-1 dc-overflow-y-auto ${darkMode ? "dc-scrollbar-thin-dark" : "dc-scrollbar-thin"}`}>
        {filteredThreads.length === 0 ? (
          <div className={`dc-p-8 dc-text-center dc-text-sm ${darkMode ? "dc-text-neutral-500" : "dc-text-neutral-400"}`}>
            {filter === "all"
              ? "No comments yet. Click the + button to add one!"
              : `No ${filter} comments`}
          </div>
        ) : (
          filteredThreads.map((thread, index) => {
            const commentNumber = threads.indexOf(thread) + 1;
            const isLast = index === filteredThreads.length - 1;
            return (
              <button
                key={thread.id}
                onClick={() => onSelect(thread.id)}
                onContextMenu={(e) => handleContextMenu(e, thread)}
                className={`dc-w-full dc-text-left dc-p-4 ${isLast ? "" : "dc-border-b"} ${
                  darkMode
                    ? `dc-border-neutral-700 ${selectedId === thread.id ? "dc-bg-slate-800" : "hover:dc-bg-neutral-700"}`
                    : `dc-border-neutral-100 ${selectedId === thread.id ? "dc-bg-blue-50" : "hover:dc-bg-neutral-50"}`
                }`}
              >
                <div className="dc-flex dc-items-start dc-gap-3">
                  <div
                    className="dc-w-6 dc-h-6 dc-rounded-full dc-flex dc-items-center dc-justify-center dc-text-white dc-text-xs dc-font-medium dc-flex-shrink-0"
                    style={{ backgroundColor: thread.authorColor }}
                  >
                    {commentNumber}
                  </div>
                  <div className="dc-flex-1 dc-min-w-0">
                    <div className="dc-flex dc-items-center dc-justify-between dc-mb-1">
                      <div className="dc-flex dc-items-center dc-gap-2">
                        <span className={`dc-font-medium dc-text-sm ${darkMode ? "dc-text-white" : "dc-text-neutral-900"}`}>
                          {thread.author}
                        </span>
                        {thread.resolved && (
                          <span className={`dc-text-xs dc-px-1.5 dc-rounded ${
                            darkMode ? "dc-text-green-400 dc-bg-green-900" : "dc-text-green-600 dc-bg-green-100"
                          }`}>
                            ✓
                          </span>
                        )}
                      </div>
                      <span className={`dc-text-xs ${darkMode ? "dc-text-neutral-500" : "dc-text-neutral-400"}`}>
                        {formatRelativeTime(thread.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`dc-text-sm dc-line-clamp-2 ${
                        thread.resolved ? "dc-line-through dc-opacity-60" : ""
                      } ${darkMode ? "dc-text-neutral-400" : "dc-text-neutral-600"}`}
                    >
                      {thread.content}
                    </p>
                    {thread.replies.length > 0 && (
                      <span className={`dc-text-xs dc-mt-1 dc-block ${darkMode ? "dc-text-neutral-500" : "dc-text-neutral-400"}`}>
                        {thread.replies.length}{" "}
                        {thread.replies.length === 1 ? "reply" : "replies"}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer with position toggle and dark mode */}
      <div className={`dc-flex dc-items-center dc-justify-between dc-px-2 dc-py-2 dc-border-t dc-rounded-b-lg ${
        darkMode ? "dc-bg-neutral-800 dc-border-neutral-700" : "dc-bg-neutral-50 dc-border-neutral-200"
      }`}>
        <button
          onClick={onTogglePosition}
          className={`dc-flex dc-items-center dc-gap-2 dc-px-2 dc-py-1.5 dc-text-sm dc-rounded ${
            darkMode
              ? "dc-text-neutral-300 hover:dc-text-white hover:dc-bg-neutral-700"
              : "dc-text-neutral-700 hover:dc-text-neutral-900 hover:dc-bg-neutral-200"
          } ${position === "right" ? "" : "dc-order-2"}`}
        >
          {position === "right" ? (
            <>
              <svg className="dc-w-4 dc-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dock left
            </>
          ) : (
            <>
              Dock right
              <svg className="dc-w-4 dc-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
        <button
          onClick={onToggleDarkMode}
          className={`dc-p-2 dc-rounded ${
            darkMode
              ? "dc-text-neutral-300 hover:dc-text-white hover:dc-bg-neutral-700"
              : "dc-text-neutral-700 hover:dc-text-neutral-900 hover:dc-bg-neutral-200"
          } ${position === "right" ? "" : "dc-order-1"}`}
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? (
            <svg className="dc-w-4 dc-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="dc-w-4 dc-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          data-design-comments="context-menu"
          className={`dc-fixed dc-rounded-lg dc-shadow-xl dc-border dc-py-1 dc-z-[10001] ${
            darkMode ? "dc-bg-neutral-800 dc-border-neutral-700" : "dc-bg-white dc-border-neutral-200"
          }`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleResolve}
            className={`dc-w-full dc-px-4 dc-py-2 dc-text-left dc-text-sm ${
              darkMode ? "dc-text-neutral-300 hover:dc-bg-neutral-700" : "dc-text-neutral-700 hover:dc-bg-neutral-50"
            }`}
          >
            {contextMenu.resolved ? "Reopen" : "Resolve"}
          </button>
          <button
            onClick={handleDelete}
            className={`dc-w-full dc-px-4 dc-py-2 dc-text-left dc-text-sm ${
              darkMode ? "dc-text-red-400 hover:dc-bg-neutral-700" : "dc-text-red-600 hover:dc-bg-red-50"
            }`}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count,
  darkMode,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  darkMode: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`dc-flex dc-items-center dc-gap-1.5 dc-px-3 dc-py-1 dc-text-sm dc-rounded-full ${
        active
          ? darkMode
            ? "dc-bg-white dc-text-neutral-900"
            : "dc-bg-neutral-900 dc-text-white"
          : darkMode
            ? "dc-text-neutral-400 hover:dc-bg-neutral-700"
            : "dc-text-neutral-600 hover:dc-bg-neutral-100"
      }`}
    >
      {label}
      <span
        className={`dc-px-1.5 dc-py-0.5 dc-text-xs dc-rounded-full dc-min-w-[20px] dc-text-center ${
          active
            ? darkMode
              ? "dc-bg-neutral-900/20 dc-text-neutral-900"
              : "dc-bg-white/20 dc-text-white"
            : darkMode
              ? "dc-bg-neutral-700 dc-text-neutral-300"
              : "dc-bg-neutral-200 dc-text-neutral-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

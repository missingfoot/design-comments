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
      className={`fixed top-4 bottom-4 w-80 rounded-lg shadow-2xl border flex flex-col z-[10000] ${
        position === "right" ? "right-4" : "left-4"
      } ${
        darkMode
          ? "bg-neutral-900 border-neutral-700"
          : "bg-white border-neutral-200"
      }`}
      onClick={() => setContextMenu(null)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className={`font-semibold ${darkMode ? "text-white" : "text-neutral-900"}`}>Comments</h2>
        <button
          onClick={onClose}
          className={`p-1 ${darkMode ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-400 hover:text-neutral-600"}`}
        >
          <svg
            className="w-5 h-5"
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
      <div className={`flex gap-1 px-4 pb-2 border-b ${
        darkMode ? "border-neutral-700" : "border-neutral-200"
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
      <div className={`flex-1 overflow-y-auto ${darkMode ? "scrollbar-thin-dark" : "scrollbar-thin"}`}>
        {filteredThreads.length === 0 ? (
          <div className={`p-8 text-center text-sm ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
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
                className={`w-full text-left p-4 ${isLast ? "" : "border-b"} ${
                  darkMode
                    ? `border-neutral-700 ${selectedId === thread.id ? "bg-slate-800" : "hover:bg-neutral-700"}`
                    : `border-neutral-100 ${selectedId === thread.id ? "bg-blue-50" : "hover:bg-neutral-50"}`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: thread.authorColor }}
                  >
                    {commentNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${darkMode ? "text-white" : "text-neutral-900"}`}>
                          {thread.author}
                        </span>
                        {thread.resolved && (
                          <span className={`text-xs px-1.5 rounded ${
                            darkMode ? "text-green-400 bg-green-900" : "text-green-600 bg-green-100"
                          }`}>
                            ✓
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                        {formatRelativeTime(thread.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`text-sm line-clamp-2 ${
                        thread.resolved ? "line-through opacity-60" : ""
                      } ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}
                    >
                      {thread.content}
                    </p>
                    {thread.replies.length > 0 && (
                      <span className={`text-xs mt-1 block ${darkMode ? "text-neutral-500" : "text-neutral-400"}`}>
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
      <div className={`flex items-center justify-between px-2 py-2 border-t rounded-b-lg ${
        darkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"
      }`}>
        <button
          onClick={onTogglePosition}
          className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded ${
            darkMode
              ? "text-neutral-300 hover:text-white hover:bg-neutral-700"
              : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200"
          } ${position === "right" ? "" : "order-2"}`}
        >
          {position === "right" ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dock left
            </>
          ) : (
            <>
              Dock right
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded ${
            darkMode
              ? "text-neutral-300 hover:text-white hover:bg-neutral-700"
              : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200"
          } ${position === "right" ? "" : "order-1"}`}
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          data-design-comments="context-menu"
          className={`fixed rounded-lg shadow-xl border py-1 z-[10001] ${
            darkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
          }`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleResolve}
            className={`w-full px-4 py-2 text-left text-sm ${
              darkMode ? "text-neutral-300 hover:bg-neutral-700" : "text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {contextMenu.resolved ? "Reopen" : "Resolve"}
          </button>
          <button
            onClick={handleDelete}
            className={`w-full px-4 py-2 text-left text-sm ${
              darkMode ? "text-red-400 hover:bg-neutral-700" : "text-red-600 hover:bg-red-50"
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
      className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-full ${
        active
          ? darkMode
            ? "bg-white text-neutral-900"
            : "bg-neutral-900 text-white"
          : darkMode
            ? "text-neutral-400 hover:bg-neutral-700"
            : "text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      {label}
      <span
        className={`px-1.5 py-0.5 text-xs rounded-full min-w-[20px] text-center ${
          active
            ? darkMode
              ? "bg-neutral-900/20 text-neutral-900"
              : "bg-white/20 text-white"
            : darkMode
              ? "bg-neutral-700 text-neutral-300"
              : "bg-neutral-200 text-neutral-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

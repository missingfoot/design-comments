import type { User } from "../lib/user";

interface ToolbarProps {
  commentMode: boolean;
  onToggleCommentMode: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  user: User;
  darkMode: boolean;
}

export function Toolbar({
  commentMode,
  onToggleCommentMode,
  sidebarOpen,
  onToggleSidebar,
  user,
  darkMode,
}: ToolbarProps) {
  return (
    <div
      data-design-comments="toolbar"
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full shadow-xl border px-2 py-1.5 z-[10000] ${
        darkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-neutral-200"
      }`}
    >
      {/* User avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
        style={{ backgroundColor: user.color }}
        title={user.name}
      >
        {user.name[0].toUpperCase()}
      </div>

      <div className={`w-px h-6 ${darkMode ? "bg-neutral-600" : "bg-neutral-200"}`} />

      {/* Comment mode toggle */}
      <button
        onClick={onToggleCommentMode}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          commentMode
            ? darkMode
              ? "bg-white text-neutral-900"
              : "bg-neutral-900 text-white"
            : darkMode
              ? "text-neutral-300 hover:bg-neutral-700"
              : "text-neutral-700 hover:bg-neutral-100"
        }`}
        title="Add comment (C)"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Comment
      </button>

      <div className={`w-px h-6 ${darkMode ? "bg-neutral-600" : "bg-neutral-200"}`} />

      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className={`p-2 rounded-full ${
          sidebarOpen
            ? darkMode
              ? "bg-white text-neutral-900"
              : "bg-neutral-900 text-white"
            : darkMode
              ? "text-neutral-300 hover:bg-neutral-700"
              : "text-neutral-700 hover:bg-neutral-100"
        }`}
        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
      </button>
    </div>
  );
}

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
      className={`dc-fixed dc-bottom-4 dc-left-1/2 dc--translate-x-1/2 dc-flex dc-items-center dc-gap-2 dc-rounded-full dc-shadow-xl dc-border dc-px-2 dc-py-1.5 dc-z-[10000] ${
        darkMode ? "dc-bg-neutral-900 dc-border-neutral-700" : "dc-bg-white dc-border-neutral-200"
      }`}
    >
      {/* User avatar */}
      <div
        className="dc-w-7 dc-h-7 dc-rounded-full dc-flex dc-items-center dc-justify-center dc-text-white dc-text-xs dc-font-medium"
        style={{ backgroundColor: user.color }}
        title={user.name}
      >
        {user.name[0].toUpperCase()}
      </div>

      <div className={`dc-w-px dc-h-6 ${darkMode ? "dc-bg-neutral-900" : "dc-bg-neutral-200"}`} />

      {/* Comment mode toggle */}
      <button
        onClick={onToggleCommentMode}
        className={`dc-flex dc-items-center dc-gap-2 dc-px-3 dc-py-1.5 dc-rounded-full dc-text-sm dc-font-medium ${
          commentMode
            ? darkMode
              ? "dc-bg-white dc-text-neutral-900"
              : "dc-bg-neutral-900 dc-text-white"
            : darkMode
              ? "dc-text-neutral-300 hover:dc-bg-neutral-800"
              : "dc-text-neutral-700 hover:dc-bg-neutral-100"
        }`}
        title="Add comment"
      >
        <svg
          className="dc-w-4 dc-h-4"
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

      <div className={`dc-w-px dc-h-6 ${darkMode ? "dc-bg-neutral-900" : "dc-bg-neutral-200"}`} />

      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className={`dc-p-2 dc-rounded-full ${
          sidebarOpen
            ? darkMode
              ? "dc-bg-white dc-text-neutral-900"
              : "dc-bg-neutral-900 dc-text-white"
            : darkMode
              ? "dc-text-neutral-300 hover:dc-bg-neutral-800"
              : "dc-text-neutral-700 hover:dc-bg-neutral-100"
        }`}
        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        <svg
          className="dc-w-4 dc-h-4"
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

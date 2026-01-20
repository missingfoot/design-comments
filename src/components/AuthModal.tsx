import { useState } from "react";

interface AuthModalProps {
  onSubmit: (name: string) => void;
}

export function AuthModal({ onSubmit }: AuthModalProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <div
      data-design-comments="auth"
      className="dc-fixed dc-inset-0 dc-bg-black/50 dc-flex dc-items-center dc-justify-center dc-z-[10002]"
    >
      <div className="dc-bg-white dc-rounded-xl dc-shadow-2xl dc-p-6 dc-w-80">
        <div className="dc-text-center dc-mb-6">
          <div className="dc-w-12 dc-h-12 dc-bg-blue-100 dc-rounded-full dc-flex dc-items-center dc-justify-center dc-mx-auto dc-mb-3">
            <svg
              className="dc-w-6 dc-h-6 dc-text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h2 className="dc-text-lg dc-font-semibold dc-text-gray-900">
            Join the discussion
          </h2>
          <p className="dc-text-sm dc-text-gray-500 dc-mt-1">
            Enter your name to start commenting
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="dc-w-full dc-px-4 dc-py-2 dc-border dc-border-gray-300 dc-rounded-lg dc-text-sm dc-mb-4 focus:dc-outline-none focus:dc-ring-2 focus:dc-ring-blue-500 focus:dc-border-transparent"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="dc-w-full dc-py-2 dc-bg-blue-500 dc-text-white dc-rounded-lg dc-font-medium dc-text-sm dc-disabled:opacity-50 hover:dc-bg-blue-600 dc-transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

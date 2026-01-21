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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10002]"
    >
      <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-blue-600"
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
          <h2 className="text-lg font-semibold text-gray-900">
            Join the discussion
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your name to start commenting
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-2 bg-blue-500 text-white rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

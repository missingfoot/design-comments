import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CommentOverlay } from "./components/CommentOverlay";
import "./index.css";

// Development entry point - mounts without Shadow DOM for Vite HMR support
// Production build (embed.tsx) uses Shadow DOM for style isolation
const container = document.createElement("div");
container.id = "design-comments-root";
document.body.appendChild(container);

createRoot(container).render(
  <StrictMode>
    <CommentOverlay />
  </StrictMode>
);

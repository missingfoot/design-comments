import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CommentOverlay } from "./components/CommentOverlay";
import "./index.css";

// Development entry point - mounts directly to a container
const container = document.createElement("div");
container.id = "design-comments-root";
document.body.appendChild(container);

createRoot(container).render(
  <StrictMode>
    <CommentOverlay />
  </StrictMode>
);

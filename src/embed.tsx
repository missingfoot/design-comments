import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CommentOverlay } from "./components/CommentOverlay";

// Embed entry point - production bundle
// Styles are bundled inline

function init() {
  // Create container
  const container = document.createElement("div");
  container.id = "design-comments-root";
  container.setAttribute("data-design-comments", "container");
  document.body.appendChild(container);

  // Mount React app
  createRoot(container).render(
    <StrictMode>
      <CommentOverlay />
    </StrictMode>
  );
}

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Export for manual initialization if needed
export { init };

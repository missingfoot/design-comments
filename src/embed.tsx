import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CommentOverlay } from "./components/CommentOverlay";
import "./index.css";

// CSS is injected as a variable by the build process
declare const __DESIGN_COMMENTS_CSS__: string;

// Embed entry point - production bundle with Shadow DOM isolation

function init() {
  // Create container element
  const container = document.createElement("div");
  container.id = "design-comments-root";
  document.body.appendChild(container);

  // Create shadow root for style isolation
  const shadow = container.attachShadow({ mode: "open" });

  // Inject styles into shadow DOM (not document.head)
  if (typeof __DESIGN_COMMENTS_CSS__ !== "undefined") {
    const style = document.createElement("style");
    style.textContent = __DESIGN_COMMENTS_CSS__;
    shadow.appendChild(style);
  }

  // Create mount point inside shadow
  const mountPoint = document.createElement("div");
  mountPoint.setAttribute("data-design-comments", "container");
  shadow.appendChild(mountPoint);

  // Mount React app into shadow DOM
  createRoot(mountPoint).render(
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

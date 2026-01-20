import { useEffect, useState } from "react";

/**
 * Track page URL changes for SPA support
 */
export function usePageUrl() {
  const [pageUrl, setPageUrl] = useState(getPageUrl());

  useEffect(() => {
    const handleRouteChange = () => {
      setPageUrl(getPageUrl());
    };

    // Listen for popstate (back/forward)
    window.addEventListener("popstate", handleRouteChange);

    // Intercept pushState
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleRouteChange();
    };

    // Intercept replaceState
    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleRouteChange();
    };

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return pageUrl;
}

/**
 * Get normalized page URL (pathname without query params)
 */
function getPageUrl(): string {
  // Use pathname for standard routing
  let url = window.location.pathname;

  // Handle hash-based routing
  if (window.location.hash.startsWith("#/")) {
    url = window.location.hash.slice(1);
  }

  // Normalize trailing slash
  if (url !== "/" && url.endsWith("/")) {
    url = url.slice(0, -1);
  }

  return url || "/";
}

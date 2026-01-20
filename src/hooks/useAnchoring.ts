import { useEffect, useState, useCallback } from "react";
import { getElementPosition, type Anchor } from "../lib/anchor";
import type { CommentThread } from "./useComments";

interface Position {
  x: number;
  y: number;
  found: boolean;
}

/**
 * Track positions of comment pins, updating on scroll/resize/DOM changes
 */
export function useAnchoring(threads: CommentThread[]) {
  const [positions, setPositions] = useState<Map<string, Position>>(new Map());

  const updatePositions = useCallback(() => {
    const newPositions = new Map<string, Position>();

    threads.forEach((thread) => {
      const pos = getElementPosition(thread.anchor);
      newPositions.set(thread.id, pos);
    });

    setPositions(newPositions);
  }, [threads]);

  useEffect(() => {
    updatePositions();

    // Update on scroll and resize
    window.addEventListener("scroll", updatePositions, { passive: true });
    window.addEventListener("resize", updatePositions);

    // Update on DOM changes
    const observer = new MutationObserver(updatePositions);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      window.removeEventListener("scroll", updatePositions);
      window.removeEventListener("resize", updatePositions);
      observer.disconnect();
    };
  }, [updatePositions]);

  return positions;
}

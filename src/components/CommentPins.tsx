import { useState, useEffect, useRef } from "react";
import type { CommentThread } from "../hooks/useComments";
import { CommentPopover } from "./CommentPopover";

interface Position {
  x: number;
  y: number;
  found: boolean;
}

export interface PopoverPosition {
  side: "left" | "right";
  bottom: number | null; // if set, use bottom positioning instead of top
}

const POPOVER_WIDTH = 288; // dc-w-72 = 18rem = 288px
const POPOVER_MAX_HEIGHT = 350; // max possible height
const MARGIN = 16; // margin from viewport edges

/**
 * Calculate optimal popover position to keep it within viewport
 * Popover top aligns with pin by default, shifts up if would go off bottom
 */
function calculatePopoverPosition(pinX: number, pinY: number): PopoverPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Determine horizontal side
  const spaceOnRight = viewportWidth - pinX;
  const spaceOnLeft = pinX;
  const side: "left" | "right" =
    spaceOnRight >= POPOVER_WIDTH + MARGIN ? "right" :
    spaceOnLeft >= POPOVER_WIDTH + MARGIN ? "left" :
    spaceOnRight >= spaceOnLeft ? "right" : "left";

  // Check if popover would go off bottom
  // Top of popover aligns with pin, so bottom would be at pinY + POPOVER_MAX_HEIGHT
  const wouldOverflowBottom = pinY + POPOVER_MAX_HEIGHT > viewportHeight - MARGIN;

  return {
    side,
    bottom: wouldOverflowBottom ? MARGIN : null,
  };
}

interface CommentPinsProps {
  threads: CommentThread[];
  positions: Map<string, Position>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReply: (commentId: string, content: string) => void;
  darkMode: boolean;
}

export function CommentPins({
  threads,
  positions,
  selectedId,
  onSelect,
  onReply,
  darkMode,
}: CommentPinsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!selectedId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      // Don't close if clicking inside a popover or pin
      if (target.closest('[data-design-comments="popover"]') ||
          target.closest('[data-design-comments="pin"]')) {
        return;
      }
      onSelect(null);
    };

    // Delay to avoid closing immediately on the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedId, onSelect]);

  return (
    <div ref={containerRef} data-design-comments="pins" className="dc-pointer-events-none">
      {threads.map((thread, index) => {
        const pos = positions.get(thread.id);
        // Don't render pin if position not calculated yet or element not found/visible
        if (!pos || !pos.found) return null;

        const isSelected = selectedId === thread.id;
        const isHovered = hoveredId === thread.id && !selectedId; // Don't show hover when something is selected
        const showPopover = isSelected || isHovered;
        const commentNumber = index + 1;

        return (
          <div
            key={thread.id}
            data-design-comments="pin"
            className={`dc-fixed dc-pointer-events-auto ${showPopover ? "dc-z-[10003]" : "dc-z-[9999]"}`}
            style={{
              left: pos.x,
              top: pos.y - window.scrollY,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Pin marker */}
            <button
              onClick={() => onSelect(isSelected ? null : thread.id)}
              onMouseEnter={() => setHoveredId(thread.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                dc-w-7 dc-h-7 dc-rounded-full dc-flex dc-items-center dc-justify-center
                dc-text-white dc-text-xs dc-font-medium dc-shadow-lg
                dc-transition-transform dc-cursor-pointer dc-border-2 dc-border-white
                ${isSelected ? "dc-scale-110" : "hover:dc-scale-105"}
                ${thread.resolved ? "dc-opacity-50" : ""}
              `}
              style={{ backgroundColor: thread.authorColor }}
              title={`#${commentNumber} - ${thread.author}: ${thread.content.slice(0, 50)}...`}
            >
              {commentNumber}
            </button>

            {/* Popover */}
            {showPopover && (
              <CommentPopover
                thread={thread}
                onReply={(content) => onReply(thread.id, content)}
                darkMode={darkMode}
                position={calculatePopoverPosition(pos.x, pos.y - window.scrollY)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

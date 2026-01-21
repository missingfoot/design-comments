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
  above: boolean; // if true, popover appears above the pin using translateY(-100%)
}

const POPOVER_WIDTH = 288; // w-72 = 18rem = 288px
const MARGIN = 16; // margin from viewport edges
const MIN_SPACE_BELOW = 200; // minimum space needed below before flipping above

/**
 * Calculate optimal popover position to keep it within viewport
 * Uses height-agnostic positioning with translateY(-100%) for above placement
 */
function calculatePopoverPosition(pinX: number, pinY: number): PopoverPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;

  // Determine horizontal side
  const spaceOnRight = viewportWidth - pinX;
  const spaceOnLeft = pinX;
  const side: "left" | "right" =
    spaceOnRight >= POPOVER_WIDTH + MARGIN ? "right" :
    spaceOnLeft >= POPOVER_WIDTH + MARGIN ? "left" :
    spaceOnRight >= spaceOnLeft ? "right" : "left";

  // Check available space below and above
  const spaceBelow = viewportHeight - pinY - MARGIN;
  const spaceAbove = pinY - MARGIN;

  // Go above if not enough space below and more space above
  const above = spaceBelow < MIN_SPACE_BELOW && spaceAbove > spaceBelow;

  return {
    side,
    above,
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

const HOVER_CLOSE_DELAY = 150; // ms delay before closing popover on mouse leave

export function CommentPins({
  threads,
  positions,
  selectedId,
  onSelect,
  onReply,
  darkMode,
}: CommentPinsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [engagedId, setEngagedId] = useState<string | null>(null); // tracks if user is interacting with popover
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnterPin = (threadId: string) => {
    // Cancel any pending close
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredId(threadId);
  };

  const handleMouseLeavePin = (threadId: string) => {
    // Don't close if user is engaged (focused on reply input)
    if (engagedId === threadId) return;

    // Delay closing to allow mouse to travel to popover
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredId((current) => (current === threadId ? null : current));
    }, HOVER_CLOSE_DELAY);
  };

  const handleMouseEnterPopover = (_threadId: string) => {
    // Cancel any pending close - mouse made it to the popover
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleMouseLeavePopover = (threadId: string) => {
    // Don't close if user is engaged (focused on reply input)
    if (engagedId === threadId) return;

    // Close immediately when leaving popover (unless going back to pin)
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredId((current) => (current === threadId ? null : current));
    }, HOVER_CLOSE_DELAY);
  };

  const handlePopoverEngage = (threadId: string) => {
    setEngagedId(threadId);
  };

  const handlePopoverDisengage = (threadId: string) => {
    setEngagedId((current) => (current === threadId ? null : current));
  };

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
    <div ref={containerRef} data-design-comments="pins" className="pointer-events-none">
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
            className={`fixed pointer-events-auto ${showPopover ? "z-[10003]" : "z-[9999]"}`}
            style={{
              left: pos.x,
              top: pos.y - window.scrollY,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Pin marker */}
            <button
              onClick={() => onSelect(isSelected ? null : thread.id)}
              onMouseEnter={() => handleMouseEnterPin(thread.id)}
              onMouseLeave={() => handleMouseLeavePin(thread.id)}
              className={`
                w-7 h-7 rounded-full flex items-center justify-center
                text-white text-xs font-medium shadow-lg
                transition-transform cursor-pointer border-2 border-white
                ${isSelected ? "scale-110" : "hover:scale-105"}
                ${thread.resolved ? "opacity-50" : ""}
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
                onMouseEnter={() => handleMouseEnterPopover(thread.id)}
                onMouseLeave={() => handleMouseLeavePopover(thread.id)}
                onEngage={() => handlePopoverEngage(thread.id)}
                onDisengage={() => handlePopoverDisengage(thread.id)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

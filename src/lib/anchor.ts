import { getCssSelector } from "css-selector-generator";

export interface TextQuote {
  exact: string;
  prefix?: string;
  suffix?: string;
}

export interface Anchor {
  // Strategy 1: CSS Selector (fastest, but fragile if classes change)
  selector: string;
  // Strategy 2: XPath (more robust to class changes)
  xpath?: string;
  // Strategy 3: Text quote with context (survives restructuring)
  textQuote?: TextQuote;
  // Position relative to the element (as percentage of element dimensions)
  // This ensures the pin stays at the same relative spot on the element
  // regardless of viewport size or element position changes
  offset: { x: number; y: number };
  // Legacy: old viewport-based positioning (for backward compatibility with existing comments)
  rect?: { x: number; y: number };
}

/**
 * Generate XPath for an element
 */
function getXPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let sibling: Element | null = current.previousElementSibling;

    while (sibling) {
      if (sibling.nodeName === current.nodeName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }

    const tagName = current.nodeName.toLowerCase();
    parts.unshift(`${tagName}[${index}]`);
    current = current.parentElement;
  }

  return "/" + parts.join("/");
}

/**
 * Get text context around an element for fuzzy matching
 */
function getTextQuote(element: Element): TextQuote | undefined {
  const text = element.textContent?.trim();
  if (!text || text.length === 0) return undefined;

  const exact = text.slice(0, 100);

  // Get prefix (text before this element)
  let prefix: string | undefined;
  const prevSibling = element.previousSibling;
  if (prevSibling?.textContent) {
    prefix = prevSibling.textContent.trim().slice(-50);
  }

  // Get suffix (text after this element)
  let suffix: string | undefined;
  const nextSibling = element.nextSibling;
  if (nextSibling?.textContent) {
    suffix = nextSibling.textContent.trim().slice(0, 50);
  }

  return { exact, prefix, suffix };
}

/**
 * Create an anchor for a DOM element at a specific click position
 */
export function createAnchor(element: Element, clickX?: number, clickY?: number): Anchor {
  const rect = element.getBoundingClientRect();

  // Calculate click position relative to element (as percentage of element size)
  // If no click position provided, default to top-left corner (0%, 0%)
  let offsetX = 0;
  let offsetY = 0;

  if (clickX !== undefined && clickY !== undefined) {
    // Convert click position to percentage offset within the element
    offsetX = ((clickX - rect.left) / rect.width) * 100;
    offsetY = ((clickY - rect.top) / rect.height) * 100;

    // Clamp to element bounds (0-100%)
    offsetX = Math.max(0, Math.min(100, offsetX));
    offsetY = Math.max(0, Math.min(100, offsetY));
  }

  return {
    selector: getCssSelector(element, {
      selectors: ["id", "class", "tag", "nthchild"],
      combineBetweenSelectors: true,
      includeTag: true,
    }),
    xpath: getXPath(element),
    textQuote: getTextQuote(element),
    offset: { x: offsetX, y: offsetY },
  };
}

/**
 * Find element by XPath
 */
function findByXPath(xpath: string): Element | null {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue as Element | null;
  } catch {
    return null;
  }
}

/**
 * Find element by text quote with fuzzy matching
 */
function findByTextQuote(textQuote: TextQuote): Element | null {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT
  );

  let bestMatch: Element | null = null;
  let bestScore = 0;

  while (walker.nextNode()) {
    const el = walker.currentNode as Element;
    const text = el.textContent?.trim();

    if (!text) continue;

    // Check if element contains the exact text
    if (text.includes(textQuote.exact)) {
      let score = 1;

      // Boost score if prefix matches
      if (textQuote.prefix) {
        const prevText = el.previousSibling?.textContent?.trim() || "";
        if (prevText.endsWith(textQuote.prefix)) {
          score += 0.5;
        }
      }

      // Boost score if suffix matches
      if (textQuote.suffix) {
        const nextText = el.nextSibling?.textContent?.trim() || "";
        if (nextText.startsWith(textQuote.suffix)) {
          score += 0.5;
        }
      }

      // Prefer elements with text that more closely matches (not too much extra text)
      const lengthRatio = textQuote.exact.length / text.length;
      score += lengthRatio * 0.5;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = el;
      }
    }
  }

  return bestMatch;
}

/**
 * Find an element from an anchor using multiple strategies in order
 */
export function findElement(anchor: Anchor): Element | null {
  // Strategy 1: CSS Selector (fastest)
  try {
    const matches = document.querySelectorAll(anchor.selector);
    if (matches.length === 1) {
      return matches[0];
    }
    // If multiple matches and we have text, try to disambiguate
    if (matches.length > 1 && anchor.textQuote) {
      for (const el of matches) {
        if (el.textContent?.includes(anchor.textQuote.exact)) {
          return el;
        }
      }
    }
  } catch {
    // Invalid selector, continue to next strategy
  }

  // Strategy 2: XPath
  if (anchor.xpath) {
    const el = findByXPath(anchor.xpath);
    if (el) return el;
  }

  // Strategy 3: Text quote with fuzzy matching
  if (anchor.textQuote) {
    const el = findByTextQuote(anchor.textQuote);
    if (el) return el;
  }

  // Strategy 4: Return null - caller should use absolute position fallback
  return null;
}

/**
 * Check if an element is fully clipped (hidden) by an ancestor with overflow:hidden
 */
function isClippedByAncestor(element: Element, elementRect: DOMRect): boolean {
  let ancestor = element.parentElement;

  while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
    const ancestorStyle = window.getComputedStyle(ancestor);
    const overflow = ancestorStyle.overflow;
    const overflowX = ancestorStyle.overflowX;
    const overflowY = ancestorStyle.overflowY;

    // Check if ancestor clips content
    const clipsContent =
      overflow === "hidden" || overflow === "clip" ||
      overflowX === "hidden" || overflowX === "clip" ||
      overflowY === "hidden" || overflowY === "clip";

    if (clipsContent) {
      const ancestorRect = ancestor.getBoundingClientRect();

      // Element is clipped if it's entirely outside the ancestor bounds
      if (
        elementRect.right <= ancestorRect.left ||
        elementRect.left >= ancestorRect.right ||
        elementRect.bottom <= ancestorRect.top ||
        elementRect.top >= ancestorRect.bottom
      ) {
        return true;
      }
    }

    ancestor = ancestor.parentElement;
  }

  return false;
}

/**
 * Check if an element is actually visible in the DOM
 * Handles: display:none, visibility:hidden, opacity:0, zero dimensions,
 * off-screen transforms, and overflow clipping by ancestors
 */
function isElementVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);

  // Check common visibility-hiding properties
  if (style.display === "none") return false;
  if (style.visibility === "hidden") return false;
  if (style.opacity === "0") return false;

  // Check if element has dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;

  // Check if element is completely off-screen (handles transform: translateX(-100%) etc.)
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  if (rect.right < 0 || rect.left > viewportWidth) return false;
  if (rect.bottom < 0 || rect.top > viewportHeight) return false;

  // Check if element is clipped by an ancestor with overflow:hidden
  if (isClippedByAncestor(element, rect)) return false;

  return true;
}

/**
 * Get the current position of a comment pin based on the element's actual position
 * Returns the element's current bounding rect + the stored offset percentage
 */
export function getElementPosition(
  anchor: Anchor
): { x: number; y: number; found: boolean } {
  const element = findElement(anchor);

  // If element not found or not visible, return found: false
  if (!element || !isElementVisible(element)) {
    return { x: 0, y: 0, found: false };
  }

  // Get the element's current position
  const rect = element.getBoundingClientRect();

  // Use stored offset if available, otherwise default to element center (for legacy comments)
  const offsetX = anchor.offset?.x ?? 50;
  const offsetY = anchor.offset?.y ?? 50;

  // Calculate pin position using element's current rect + offset percentage
  const x = rect.left + (offsetX / 100) * rect.width;
  const y = rect.top + (offsetY / 100) * rect.height + window.scrollY;

  return { x, y, found: true };
}

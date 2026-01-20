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
  // Strategy 4: Absolute fallback (percentage-based)
  rect: { x: number; y: number };
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
  // Use click position if provided, otherwise fall back to element center
  const rect = element.getBoundingClientRect();
  const x = clickX ?? rect.left + rect.width / 2;
  const y = clickY ?? rect.top + rect.height / 2;

  return {
    selector: getCssSelector(element, {
      selectors: ["id", "class", "tag", "nthchild"],
      combineBetweenSelectors: true,
      includeTag: true,
    }),
    xpath: getXPath(element),
    textQuote: getTextQuote(element),
    rect: {
      x: (x / window.innerWidth) * 100,
      y: ((y + window.scrollY) / document.body.scrollHeight) * 100,
    },
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
 * Get the current position of an element or fallback to anchor rect
 * Always uses the stored percentage position (exact click coordinates)
 * Element finding is used to determine if the anchor is still valid
 */
export function getElementPosition(
  anchor: Anchor
): { x: number; y: number; found: boolean } {
  const element = findElement(anchor);

  // Always use stored percentage position - this is the exact click point
  const pos = {
    x: (anchor.rect.x / 100) * window.innerWidth,
    y: (anchor.rect.y / 100) * document.body.scrollHeight,
    found: element !== null,
  };

  return pos;
}

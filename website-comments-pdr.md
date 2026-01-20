# Website Commenting Tool — Product Design & Requirements

A lightweight, Figma-style commenting and collaboration tool for reviewing code-based web projects.

---

## Overview

### Problem
Existing tools like [Pastel](https://usepastel.com) are heavy, expensive, and designed for agencies. We need something lighter and more developer-friendly for sharing code prototypes with clients and collaborators.

### Solution
A drop-in script that adds real-time commenting, presence, and demo capabilities to any web project, powered by InstantDB for multiplayer sync.

### Core Principles
- **Lightweight** — Single script injection, no build step required
- **Real-time** — Figma-like multiplayer presence and collaboration
- **Developer-first** — Works with any framework, minimal setup
- **Element-aware** — Comments anchor to DOM elements, not just coordinates

---

## Features

| Feature | Priority | Complexity |
|---------|----------|------------|
| Element-anchored comments | P0 | Medium |
| Threaded replies | P0 | Easy |
| Live cursors | P1 | Easy |
| Presence (who's on what page) | P1 | Easy |
| Click avatar to jump to their page | P1 | Trivial |
| Presenter mode (interaction mirroring) | P2 | Medium |
| Resolved/unresolved states | P1 | Easy |
| Comment sidebar | P1 | Easy |

---

## Technical Architecture

### Approach: Injected Script

Since we're reviewing our own code projects, we control the source. The cleanest approach is a script that gets dropped into any project:

```html
<script src="https://yourcommenttool.com/embed.js" data-project="project-id"></script>
```

This avoids iframe restrictions (X-Frame-Options) and feels native to the page.

### Data Layer: InstantDB

InstantDB provides real-time sync, presence, and rooms out of the box.

```
npm install @instantdb/react
```

### Schema

```typescript
// InstantDB Schema

interface Project {
  id: string
  url: string
  name: string
  createdAt: number
}

interface Comment {
  id: string
  projectId: string        // link -> projects
  pageUrl: string          // specific page within the project
  anchor: Anchor           // element anchoring data (see below)
  content: string
  author: string
  authorAvatar?: string
  resolved: boolean
  createdAt: number
  parentId?: string        // link -> comments (for threads)
}

interface Anchor {
  selector: string         // CSS selector to the element
  xpath?: string           // XPath as backup
  text?: string            // text content snippet for fuzzy matching
  rect: {                  // fallback absolute position (percentages)
    x: number
    y: number
  }
}
```

### Presence Schema (via InstantDB Rooms)

```typescript
interface UserPresence {
  odor: string
  name: string
  avatar?: string
  pageUrl: string          // which page they're viewing
  cursor: {                // null if on different page
    x: number
    y: number
  } | null
  following?: string       // odor of user they're following (presenter mode)
}
```

---

## Feature: Element-Anchored Comments

### Research Findings

Industry tools (Pastel, Hypothesis, Marker.io) use a **multi-strategy anchoring approach** with fallbacks:

1. **CSS Selector** — fastest, but fragile if classes change
2. **XPath** — more robust to class changes
3. **Text Quote** — survives restructuring, uses fuzzy matching
4. **Absolute Position** — final fallback

The W3C Web Annotation Data Model formalizes this with selector types:
- `RangeSelector` — XPath + offsets
- `TextPositionSelector` — character offsets in document
- `TextQuoteSelector` — exact text + prefix/suffix context

### Recommended Libraries

| Library | Purpose | URL |
|---------|---------|-----|
| `css-selector-generator` | Generate shortest unique CSS selector | https://github.com/fczbkk/css-selector-generator |
| `unique-selector` | Alternative with configurable strategies | https://github.com/ericclemmons/unique-selector |
| `diff-match-patch` | Fuzzy text matching for text-based anchoring | https://github.com/google/diff-match-patch |

### Implementation Plan

#### Phase 1: Basic Anchoring

```typescript
import { getCssSelector } from 'css-selector-generator';

function createAnchor(element: Element): Anchor {
  const rect = element.getBoundingClientRect();
  
  return {
    selector: getCssSelector(element, {
      selectors: ['id', 'class', 'tag', 'nthchild'],
      combineBetweenSelectors: true,
    }),
    text: element.textContent?.slice(0, 100)?.trim(),
    rect: {
      x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
      y: ((rect.top + rect.height / 2 + window.scrollY) / document.body.scrollHeight) * 100,
    }
  };
}
```

#### Phase 2: Re-anchoring on Render

```typescript
function findElement(anchor: Anchor): Element | null {
  // Strategy 1: CSS Selector
  try {
    const matches = document.querySelectorAll(anchor.selector);
    if (matches.length === 1) return matches[0];
  } catch (e) {}

  // Strategy 2: Text content search
  if (anchor.text) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT
    );
    while (walker.nextNode()) {
      const el = walker.currentNode as Element;
      if (el.textContent?.includes(anchor.text)) {
        return el;
      }
    }
  }

  // Strategy 3: Return null, render at absolute position
  return null;
}
```

#### Phase 3: Live Repositioning

```typescript
function useCommentPositions(comments: Comment[]) {
  const [positions, setPositions] = useState<Map<string, DOMRect>>();

  useEffect(() => {
    const updatePositions = () => {
      const newPositions = new Map();
      comments.forEach(comment => {
        const el = findElement(comment.anchor);
        if (el) {
          newPositions.set(comment.id, el.getBoundingClientRect());
        }
      });
      setPositions(newPositions);
    };

    // Update on scroll, resize, and DOM changes
    window.addEventListener('scroll', updatePositions);
    window.addEventListener('resize', updatePositions);
    
    const observer = new MutationObserver(updatePositions);
    observer.observe(document.body, { childList: true, subtree: true });

    updatePositions();

    return () => {
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
      observer.disconnect();
    };
  }, [comments]);

  return positions;
}
```

---

## Feature: Threaded Replies

### Data Model

Simple parent-child relationship via `parentId`:

```typescript
interface Comment {
  // ... other fields
  parentId?: string  // null = top-level comment, otherwise = reply
}
```

### Implementation Plan

```typescript
// Query comments and group by thread
function useThreadedComments(projectId: string, pageUrl: string) {
  const { data } = useQuery({
    comments: {
      $: { where: { projectId, pageUrl } }
    }
  });

  const threads = useMemo(() => {
    const topLevel = data?.comments.filter(c => !c.parentId) ?? [];
    const replies = data?.comments.filter(c => c.parentId) ?? [];
    
    return topLevel.map(parent => ({
      ...parent,
      replies: replies
        .filter(r => r.parentId === parent.id)
        .sort((a, b) => a.createdAt - b.createdAt)
    }));
  }, [data]);

  return threads;
}
```

### UI Components

```
CommentPin (on page)
  └── CommentPopover
        ├── ParentComment
        ├── Reply[]
        └── ReplyInput
```

---

## Feature: Presence — Who's on What Page

### Implementation Plan

Using InstantDB rooms for presence:

```typescript
import { useRoom } from '@instantdb/react';

function usePresence(projectId: string, currentPageUrl: string, user: User) {
  const room = useRoom(`project-${projectId}`);

  // Broadcast our presence
  useEffect(() => {
    room.useSyncPresence({
      odor: user.odor,
      name: user.name,
      avatar: user.avatar,
      pageUrl: currentPageUrl,
      cursor: null,
    });
  }, [currentPageUrl]);

  // Get all users' presence
  const { peers } = room.usePresence();

  // Group by page
  const usersByPage = useMemo(() => {
    const grouped = new Map<string, UserPresence[]>();
    Object.values(peers).forEach(peer => {
      const existing = grouped.get(peer.pageUrl) ?? [];
      grouped.set(peer.pageUrl, [...existing, peer]);
    });
    return grouped;
  }, [peers]);

  return { peers, usersByPage };
}
```

### UI: Avatar Stack in Sidebar

```tsx
function PresenceSidebar({ usersByPage, currentPage, onNavigate }) {
  return (
    <div className="presence-sidebar">
      {Array.from(usersByPage.entries()).map(([pageUrl, users]) => (
        <div 
          key={pageUrl} 
          className={pageUrl === currentPage ? 'current' : ''}
          onClick={() => onNavigate(pageUrl)}
        >
          <span className="page-name">{getPageName(pageUrl)}</span>
          <div className="avatar-stack">
            {users.map(user => (
              <img 
                key={user.odor} 
                src={user.avatar} 
                title={user.name}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Feature: Live Cursors

### Implementation Plan

Throttled cursor broadcasting via presence:

```typescript
function useLiveCursors(room: Room, currentPageUrl: string) {
  // Broadcast cursor position (throttled)
  useEffect(() => {
    const handleMouseMove = throttle((e: MouseEvent) => {
      room.updatePresence({
        cursor: {
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100,
        }
      });
    }, 50); // 20fps

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Get cursors of users on same page
  const { peers } = room.usePresence();
  
  const cursorsOnThisPage = Object.values(peers)
    .filter(p => p.pageUrl === currentPageUrl && p.cursor);

  return cursorsOnThisPage;
}
```

### UI: Cursor Rendering

```tsx
function LiveCursors({ cursors }) {
  return (
    <div className="cursors-layer">
      {cursors.map(peer => (
        <div
          key={peer.odor}
          className="cursor"
          style={{
            left: `${peer.cursor.x}%`,
            top: `${peer.cursor.y}%`,
            '--cursor-color': peer.color,
          }}
        >
          <CursorIcon />
          <span className="cursor-label">{peer.name}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Feature: Click Avatar to Jump to Their Page

### Implementation Plan

Trivial — just navigate on click:

```typescript
function AvatarButton({ user, onNavigate }) {
  return (
    <button 
      onClick={() => onNavigate(user.pageUrl)}
      title={`Jump to ${user.name}'s location`}
    >
      <img src={user.avatar} alt={user.name} />
    </button>
  );
}
```

---

## Feature: Presenter Mode (Interaction Mirroring)

### Research Findings

Two levels of mirroring:

| Level | What viewers see | Use case |
|-------|------------------|----------|
| **Visual only** | Cursor moves, click ripples, scroll position | "Look at this" |
| **Full replay** | Their page responds to presenter's clicks | "Follow my demo" |

### Level 1: Visual Mirroring

Already covered by live cursors + adding:

```typescript
// Presenter broadcasts clicks
room.publish('presenter-click', {
  x: e.clientX / window.innerWidth * 100,
  y: e.clientY / window.innerHeight * 100,
});

// Viewers show ripple animation
room.subscribe('presenter-click', ({ x, y }) => {
  showClickRipple(x, y);
});
```

### Level 2: Interaction Replay

```typescript
// Event types to broadcast
type InteractionEvent = 
  | { type: 'click'; selector: string; }
  | { type: 'scroll'; position: { x: number; y: number } }
  | { type: 'input'; selector: string; value: string }
  | { type: 'navigate'; url: string };

// Presenter broadcasts interactions
function usePresenterBroadcast(room: Room, isPresenting: boolean) {
  useEffect(() => {
    if (!isPresenting) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      room.publish('interaction', {
        type: 'click',
        selector: getCssSelector(target),
      });
    };

    const handleScroll = throttle(() => {
      room.publish('interaction', {
        type: 'scroll',
        position: { x: window.scrollX, y: window.scrollY },
      });
    }, 100);

    document.addEventListener('click', handleClick, true);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isPresenting]);
}
```

```typescript
// Viewer replays interactions
function useViewerReplay(room: Room, isFollowing: boolean) {
  useEffect(() => {
    if (!isFollowing) return;

    const unsubscribe = room.subscribe('interaction', (event) => {
      switch (event.type) {
        case 'click':
          const el = document.querySelector(event.selector);
          el?.click();
          break;
        case 'scroll':
          window.scrollTo(event.position.x, event.position.y);
          break;
        case 'input':
          const input = document.querySelector(event.selector) as HTMLInputElement;
          if (input) input.value = event.value;
          break;
        case 'navigate':
          window.location.href = event.url;
          break;
      }
    });

    return unsubscribe;
  }, [isFollowing]);
}
```

### UX Considerations

- **Presenter role toggle** — explicit "Start presenting" button
- **Follow toggle for viewers** — "Following James..." with opt-out
- **Visual indicator** — badge showing follow state
- **Click highlight** — flash the clicked element for viewers
- **Interaction queue** — small buffer for smooth playback

### Gotchas

1. **State divergence** — if viewer's page is in different state, clicks may hit wrong elements
2. **Auth/sessions** — user-specific content won't match
3. **Rapid interactions** — needs throttling to avoid jank

---

## UI Components Breakdown

```
<CommentOverlay>
  ├── <CommentPins />           // Markers on page elements
  │     └── <Pin />
  │           └── <CommentPopover />
  │                 ├── <Comment />
  │                 ├── <Reply />[]
  │                 └── <ReplyInput />
  │
  ├── <LiveCursors />           // Other users' cursors
  │     └── <Cursor />
  │
  ├── <ClickRipples />          // Visual feedback for presenter clicks
  │
  ├── <Sidebar />               // Main UI panel
  │     ├── <PresenceList />    // Who's on what page
  │     ├── <CommentList />     // All comments for current page
  │     └── <PresenterControls />
  │
  └── <Toolbar />               // Toggle comment mode, settings
        ├── <CommentModeToggle />
        └── <FollowingIndicator />
</CommentOverlay>
```

---

## Development Plan

### Phase 1: Core Commenting (MVP)

**Goal:** Basic commenting that works

1. [ ] Set up InstantDB project and schema
2. [ ] Create embed script boilerplate
3. [ ] Implement click-to-place comment pins
4. [ ] Basic CSS selector anchoring
5. [ ] Comment input popover
6. [ ] Persist comments to InstantDB
7. [ ] Render existing comments on page load
8. [ ] Basic sidebar with comment list

### Phase 2: Robust Anchoring

**Goal:** Comments stay attached to elements

1. [ ] Integrate `css-selector-generator`
2. [ ] Add text content fallback
3. [ ] Add absolute position fallback
4. [ ] Implement `findElement()` with strategies
5. [ ] Add ResizeObserver/MutationObserver repositioning
6. [ ] Handle scroll position for pins

### Phase 3: Threads & Resolution

**Goal:** Organize feedback

1. [ ] Add reply functionality
2. [ ] Thread UI in popover
3. [ ] Resolved/unresolved toggle
4. [ ] Filter sidebar by resolved state

### Phase 4: Presence

**Goal:** See who's here

1. [ ] Set up InstantDB room for project
2. [ ] Broadcast user presence
3. [ ] Show avatars in sidebar grouped by page
4. [ ] Click-to-jump-to-page

### Phase 5: Live Cursors

**Goal:** Figma-style awareness

1. [ ] Broadcast cursor position (throttled)
2. [ ] Render peer cursors on same page
3. [ ] Cursor labels with names
4. [ ] Hide cursors when user leaves

### Phase 6: Presenter Mode

**Goal:** Demo prototypes live

1. [ ] Presenter role toggle
2. [ ] Broadcast click events
3. [ ] Visual-only mode (click ripples)
4. [ ] Full replay mode (trigger clicks)
5. [ ] Viewer follow toggle
6. [ ] Scroll sync
7. [ ] Navigation sync

### Phase 7: Polish

1. [ ] Keyboard shortcuts
2. [ ] Mobile support
3. [ ] Dark mode
4. [ ] Export comments (JSON, CSV)
5. [ ] Notifications for new comments
6. [ ] Comment mentions (@name)

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| **Framework** | React (compiled to vanilla JS bundle) | Component model, hooks for state |
| **Real-time** | InstantDB | Built-in presence, rooms, sync |
| **Styling** | CSS-in-JS or Tailwind (scoped) | Avoid conflicts with host page |
| **Selector Generation** | `css-selector-generator` | Well-maintained, configurable |
| **Build** | Vite | Fast, outputs single bundle |

---

## File Structure

```
/src
  /components
    CommentOverlay.tsx      # Root component
    CommentPin.tsx          # Individual pin marker
    CommentPopover.tsx      # Comment thread popover
    Sidebar.tsx             # Main sidebar panel
    LiveCursors.tsx         # Cursor rendering
    PresenceList.tsx        # Who's online
    PresenterControls.tsx   # Start/stop presenting
  /hooks
    useComments.ts          # CRUD for comments
    useAnchoring.ts         # Element finding logic
    usePresence.ts          # Room presence
    useLiveCursors.ts       # Cursor sync
    usePresenter.ts         # Presenter mode logic
  /lib
    anchor.ts               # Anchor creation & resolution
    instantdb.ts            # DB client setup
    embed.ts                # Script entry point
  /styles
    overlay.css             # Scoped styles
```

---

## Open Questions

1. **Auth** — How do users identify themselves? Anonymous with name prompt? Link to existing auth?
2. **Project management** — Dashboard for managing projects, or just URL-based?
3. **Notifications** — Email/push when new comments? Or just real-time in-app?
4. **Permissions** — Can anyone with the link comment, or invite-only?
5. **History** — Keep version history of comments? Audit log?

---

## References

- [W3C Web Annotation Data Model](https://www.w3.org/TR/annotation-model/)
- [Hypothesis Fuzzy Anchoring](https://web.hypothes.is/blog/fuzzy-anchoring/)
- [Apache Annotator](https://annotator.apache.org/)
- [css-selector-generator](https://github.com/fczbkk/css-selector-generator)
- [InstantDB Docs](https://instantdb.com/docs)
- [Pastel](https://usepastel.com) — competitor reference

# Design Comments

A lightweight, Figma-style commenting tool that can be injected into any website. Add contextual comments to any element on a page with real-time sync.

## Features

- **Element-anchored comments** - Click any element to add a comment pin
- **Real-time sync** - Comments sync instantly across all viewers via InstantDB
- **Threaded replies** - Reply to comments to create discussion threads
- **Resolve/delete** - Mark comments as resolved or delete via right-click menu
- **Dark mode** - Toggle between light and dark themes (persists to localStorage)
- **Sidebar** - View all comments with filtering (All/Open/Resolved)
- **Anonymous auth** - Simple name prompt, no account required
- **Domain scoped** - Comments are automatically scoped per domain

## Usage

### Quick Test (Browser Console)

Paste this in your browser console on any website:

```javascript
const s = document.createElement('script');
s.src = 'https://design-comments.netlify.app/embed.iife.js';
document.body.appendChild(s);
```

### Add to Your Site

```html
<script src="https://design-comments.netlify.app/embed.iife.js"></script>
```

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

### InstantDB

The app uses InstantDB for real-time data sync. To use your own InstantDB instance:

1. Create an app at [instantdb.com](https://instantdb.com)
2. Set the environment variable `VITE_INSTANT_APP_ID` to your app ID
3. Push the schema: `npx instant-cli push-schema`

For Netlify deployment, add `VITE_INSTANT_APP_ID` in Site settings → Environment variables.

## Tech Stack

- React 18
- TypeScript
- Vite (IIFE bundle output)
- Tailwind CSS (prefixed with `dc-`)
- InstantDB (real-time sync)

## License

MIT

// router.js — deep links (Patch 81). Format: #/<appId>[/<item>].
// replaceState only — no history entry per focus change, so browser Back
// leaves the site in one press.
//
// The address bar tracks the *focused* window. Apps report their current item
// (post slug, project slug, game id) whenever it changes; the router remembers
// it per app and only shows it while that app is the focused one, so a window
// that re-renders in the background never hijacks the URL.

export function readRoute() {
  const m = location.hash.match(/^#\/([a-z]+)(?:\/([^/?#]+))?/i);
  if (!m) return null;
  let item = null;
  if (m[2]) {
    try { item = decodeURIComponent(m[2]); } catch { item = null; }
  }
  return { app: m[1], item };
}

let current = null;       // focused app id (or null)
const items = new Map();  // app id -> current item (or null)

function write() {
  const app = current;
  const item = app ? items.get(app) : null;
  const h = app ? `#/${app}${item ? '/' + encodeURIComponent(item) : ''}` : ' ';
  const next = h === ' ' ? location.pathname + location.search : h;
  if (h === ' ' ? !location.hash : location.hash === h) return;
  history.replaceState(null, '', next);
}

// writeRoute(app)        — focus changed to `app` (null: nothing focused).
// writeRoute(app, item)  — `app` is now showing `item` (null: its list/grid).
export function writeRoute(app, item) {
  if (item === undefined) {
    current = app || null;
  } else if (app) {
    items.set(app, item || null);
    if (app !== current) return;
  }
  write();
}

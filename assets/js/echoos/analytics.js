// analytics.js — visit counting with GoatCounter (goatcounter.com): no cookies,
// no personal data, aggregate counts only.
//
// EchoOS is one page with #/ routes, so a page-view script alone would only
// ever see "home". The OS reports what visitors actually look at:
//   page views  /                  a desktop load
//               /blog/<slug>       a post opened in the Blog window
//               /projects/<slug>   a project opened in the Projects window
//               /404               a missing URL (title = the path that failed)
//   events      app:<id>           a window opened
//               game:<id>          an Arcade game started
//               resume:view, resume:download
//
// Nothing is sent when the build has no site code (dev builds), on localhost
// (count.js refuses), or when the browser sends Do Not Track or Global
// Privacy Control.

const root = document.getElementById('echoos-root');
const code = (root && root.dataset.goatcounter) || '';
const optedOut = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
const enabled = Boolean(code) && !optedOut;

const queue = [];
let ready = false;
let unavailable = false; // count.js failed to load: send nothing
let countsOff = false; // counter endpoint failed: stop asking, keep tracking
let resolveTracker;
const trackerLoaded = new Promise((resolve) => { resolveTracker = resolve; });
const counts = new Map();

if (enabled) {
  // count.js reads its settings from window.goatcounter before it loads;
  // no_onload stops it counting the bare page, since the OS counts views itself.
  window.goatcounter = { ...(window.goatcounter || {}), no_onload: true };
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
  s.addEventListener('load', () => {
    ready = true;
    resolveTracker(true);
    for (const hit of queue.splice(0)) send(hit);
  });
  s.addEventListener('error', () => {
    unavailable = true;
    queue.length = 0;
    resolveTracker(false);
  });
  document.head.appendChild(s);
} else {
  resolveTracker(false);
}

function send(hit) {
  if (window.goatcounter && typeof window.goatcounter.count === 'function') window.goatcounter.count(hit);
}

function hit(h) {
  if (!enabled || unavailable) return;
  if (ready) send(h);
  else queue.push(h);
}

export function trackView(path, title) {
  hit({ path, title: title || path });
}

export function trackEvent(name, title) {
  hit({ path: name, title: title || name, event: true });
}

// Public per-path counter (GoatCounter's "visitor counter" setting). `path` is a
// page path or 'TOTAL' for the whole site; `start` limits it to the last 'week'
// or 'month' (default: all time). Resolves to a number, or null when counting
// is off, the setting is disabled, or the request fails, so callers can simply
// hide the count.
export async function liveCount(path, start = '') {
  // A blocked tracker is a signal to leave analytics alone. Reuse requests for
  // repeated post visits and stop after the counter endpoint fails.
  if (!enabled || !(await trackerLoaded) || countsOff) return null;
  const key = `${path}?${start}`;
  if (!counts.has(key)) counts.set(key, fetchCount(path, start));
  return counts.get(key);
}

async function fetchCount(path, start) {
  const query = start ? `?start=${start}` : '';
  try {
    const res = await fetch(`https://${code}.goatcounter.com/counter/${encodeURIComponent(path)}.json${query}`);
    // 404 just means no recorded views for this path yet (new post, or hits
    // still being processed); anything else means the counter is off or down.
    if (res.status === 404) return null;
    if (!res.ok) { countsOff = true; return null; }
    const data = await res.json();
    const n = Number(String(data.count ?? '').replace(/[^\d]/g, ''));
    return Number.isFinite(n) ? n : null;
  } catch {
    countsOff = true;
    return null;
  }
}

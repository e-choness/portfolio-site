// stats-data.js — the nightly visit statistics (assets/data/stats.json), written
// by scripts/fetch-stats.mjs in the deploy workflow from GoatCounter's API.
// Loaded once and shared by the Stats app, the Blog list and the terminal.
// Resolves to null when there's no file yet (local builds, or before the first
// nightly run), so every caller can show its empty state.

let promise = null;

export function loadStats(content) {
  const url = content && content.site && content.site.statsUrl;
  if (!promise) {
    promise = url
      ? fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null)
      : Promise.resolve(null);
  }
  return promise;
}

export const fmt = (n) => Number(n || 0).toLocaleString('en-US');

// "3 h ago", "2 days ago"
export function ago(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

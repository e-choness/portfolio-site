// stats-data.js — visit statistics for the Stats app, the telemetry panel, the
// Blog list and the terminal, from two sources:
//   stats.json  the nightly snapshot (assets/data/stats.json), written by
//               scripts/fetch-stats.mjs in the deploy workflow from GoatCounter's
//               API: daily chart, top posts, windows, games, countries.
//   liveCount   GoatCounter's public counter (analytics.js), for current totals.
// Both are optional: local builds have neither, and a blocked tracker or a
// failed nightly sync leaves one missing, so every caller has an empty state.
import { liveCount } from './analytics.js';

let promise = null;

// The nightly snapshot, fetched once; null when the build has none.
export function loadStats(content) {
  const url = content && content.site && content.site.statsUrl;
  if (!promise) {
    promise = url
      ? fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null)
      : Promise.resolve(null);
  }
  return promise;
}

// Visit totals { last7, last30, allTime }: live counts where the counter
// answers, else the nightly snapshot; null for a figure neither has.
export async function loadVisits(content) {
  const [stats, week, month, all] = await Promise.all([
    loadStats(content),
    liveCount('TOTAL', 'week'),
    liveCount('TOTAL', 'month'),
    liveCount('TOTAL'),
  ]);
  const nightly = (stats && stats.visits) || {};
  return {
    last7: week ?? nightly.last7 ?? null,
    last30: month ?? nightly.last30 ?? null,
    allTime: all ?? nightly.allTime ?? null,
  };
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

// The Arcade game's display name, from the registry in content.json.
export function gameName(content, id) {
  const game = ((content && content.arcade) || []).find((g) => g.id === id);
  return (game && game.name) || id;
}

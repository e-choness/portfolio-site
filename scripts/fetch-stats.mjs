// scripts/fetch-stats.mjs — pull aggregate visit statistics from GoatCounter's
// API into assets/data/stats.json, which the Stats app, the telemetry panel,
// the Blog list and the terminal read. Runs in the deploy workflow (nightly,
// and on every push) with the API token from the GOATCOUNTER_TOKEN repository
// secret, so the token never reaches the browser. The output file is git-ignored.
//
//   GOATCOUNTER_TOKEN=… [STATS_FALLBACK_URL=…] node scripts/fetch-stats.mjs [site-code]
//
// Without a token it does nothing and exits 0, so local builds and forks work.
// If the API fails, it keeps the last good snapshot: STATS_FALLBACK_URL (the
// workflow passes the live site's stats.json) is downloaded instead, so one bad
// night never empties the Stats app. Either way it never fails the deploy.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const code = process.argv[2] || process.env.GOATCOUNTER_CODE || 'echoness';
const token = process.env.GOATCOUNTER_TOKEN;
const fallbackUrl = process.env.STATS_FALLBACK_URL;
// STATS_OUT redirects the output (the unit tests use it).
const outFile = process.env.STATS_OUT || fileURLToPath(new URL('../assets/data/stats.json', import.meta.url));
const inCI = Boolean(process.env.GITHUB_ACTIONS);

// GitHub Actions turns these into annotations on the run summary.
const warn = (msg) => console.log(inCI ? `::warning title=Visit stats::${msg}` : `fetch-stats: ${msg}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// GoatCounter allows 4 API requests per second per client, so requests go one
// at a time, and a 429 waits out the reset it reports before trying again.
async function api(path, params = {}) {
  const url = new URL(`https://${code}.goatcounter.com/api/v0${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (res.status === 429 && attempt < 5) {
      const wait = Number(res.headers.get('retry-after') || res.headers.get('x-rate-limit-reset')) || 1;
      await sleep((wait + 0.25) * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }
}

// The API wants times rounded to the hour, in RFC 3339.
const hour = (ms) => {
  const d = new Date(ms);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString().replace('.000Z', 'Z');
};

async function collect() {
  const now = Date.now();
  const end = hour(now + 3600e3); // include the current hour
  const since30 = hour(now - 30 * 86400e3);
  const EPOCH = '2024-01-01T00:00:00Z'; // before the site started counting

  const total30 = await api('/stats/total', { start: since30, end });
  const totalAll = await api('/stats/total', { start: EPOCH, end });
  const hits30 = await api('/stats/hits', { start: since30, end, limit: 100 });
  const hitsAll = await api('/stats/hits', { start: EPOCH, end, limit: 100 });
  const locations = await api('/stats/locations', { start: since30, end, limit: 5 });

  // Daily totals for the last 30 days, oldest first, with missing days as 0.
  const perDay = new Map((total30.stats || []).map((s) => [s.day, s.daily || 0]));
  const daily = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now - i * 86400e3).toISOString().slice(0, 10);
    daily.push({ day, count: perDay.get(day) || 0 });
  }

  const pageHits = (list) => (list.hits || []).filter((h) => !h.event);
  const eventHits = (list) => (list.hits || []).filter((h) => h.event);
  const byPrefix = (hits, prefix, n) =>
    hits
      .filter((h) => h.path.startsWith(prefix))
      .sort((a, b) => b.count - a.count)
      .slice(0, n)
      .map((h) => ({ path: h.path, title: h.title, count: h.count }));
  const eventsFor = (prefix) =>
    eventHits(hits30)
      .filter((h) => h.path.startsWith(prefix))
      .map((h) => ({ id: h.path.slice(prefix.length), count: h.count }))
      .sort((a, b) => b.count - a.count);
  const eventCount = (name) => (eventHits(hits30).find((h) => h.path === name) || {}).count || 0;

  return {
    generatedAt: new Date(now).toISOString(),
    visits: {
      last7: daily.slice(-7).reduce((sum, d) => sum + d.count, 0),
      last30: total30.total || 0,
      allTime: totalAll.total || 0,
    },
    daily,
    // All-time views per post/project path, for read counts next to each post.
    pages: Object.fromEntries(
      pageHits(hitsAll)
        .filter((h) => h.path.startsWith('/blog/') || h.path.startsWith('/projects/'))
        .map((h) => [h.path, h.count])
    ),
    top: {
      posts: byPrefix(pageHits(hits30), '/blog/', 5),
      projects: byPrefix(pageHits(hits30), '/projects/', 3),
    },
    apps: eventsFor('app:'),
    games: eventsFor('game:'),
    resume: { views: eventCount('resume:view'), downloads: eventCount('resume:download') },
    countries: (locations.stats || []).map((s) => ({ name: s.name || s.id, count: s.count })),
  };
}

// The snapshot the live site serves now, or null.
async function lastGood() {
  if (!fallbackUrl) return null;
  try {
    const res = await fetch(fallbackUrl);
    if (!res.ok) return null;
    const stats = await res.json();
    return stats && stats.generatedAt ? stats : null;
  } catch {
    return null;
  }
}

async function save(stats) {
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(stats, null, 2) + '\n');
}

if (!token) {
  warn('GOATCOUNTER_TOKEN is not set; skipping. The Stats app will show live totals only.');
  process.exit(0);
}

try {
  const stats = await collect();
  await save(stats);
  console.log(
    `fetch-stats: ${stats.visits.last30} visits in 30 days, ${Object.keys(stats.pages).length} pages, ` +
      `${stats.apps.length} app events → assets/data/stats.json`
  );
} catch (err) {
  const previous = await lastGood();
  if (previous) {
    await save(previous);
    warn(`GoatCounter API failed (${err.message}); redeploying the snapshot from ${previous.generatedAt}.`);
  } else {
    warn(`GoatCounter API failed (${err.message}) and there is no earlier snapshot; the Stats app will show live totals only.`);
  }
}

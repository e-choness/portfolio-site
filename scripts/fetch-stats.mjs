// scripts/fetch-stats.mjs — pull aggregate visit statistics from GoatCounter's
// API into assets/data/stats.json, which the Stats app, the Blog list and the
// terminal read. Runs in the deploy workflow (nightly, and on every push) with
// the API token from the GOATCOUNTER_TOKEN repository secret, so the token
// never reaches the browser. The output file is git-ignored.
//
//   GOATCOUNTER_TOKEN=… node scripts/fetch-stats.mjs [site-code]
//
// Without a token it does nothing and exits 0, so local builds and forks work.
import { mkdir, writeFile } from 'node:fs/promises';

const code = process.argv[2] || process.env.GOATCOUNTER_CODE || 'echoness';
const token = process.env.GOATCOUNTER_TOKEN;
const outFile = new URL('../assets/data/stats.json', import.meta.url);

if (!token) {
  // In CI a missing token means the Stats app ships empty; say so on the run
  // page instead of passing silently.
  const msg = 'fetch-stats: GOATCOUNTER_TOKEN is not set; skipping.';
  console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg} The Stats app will show no visit data.` : msg);
  process.exit(0);
}

async function api(path, params = {}) {
  const url = new URL(`https://${code}.goatcounter.com/api/v0${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// The API wants times rounded to the hour, in RFC 3339.
const hour = (ms) => {
  const d = new Date(ms);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString().replace('.000Z', 'Z');
};
const now = Date.now();
const end = hour(now + 3600e3); // include the current hour
const daysAgo = (n) => hour(now - n * 86400e3);
const EPOCH = '2024-01-01T00:00:00Z'; // before the site started counting

const [total30, totalAll, hits30, hitsAll, locations] = await Promise.all([
  api('/stats/total', { start: daysAgo(30), end }),
  api('/stats/total', { start: EPOCH, end }),
  api('/stats/hits', { start: daysAgo(30), end, limit: 100 }),
  api('/stats/hits', { start: EPOCH, end, limit: 100 }),
  api('/stats/locations', { start: daysAgo(30), end, limit: 5 }),
]);

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

const stats = {
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

await mkdir(new URL('.', outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(stats, null, 2) + '\n');
console.log(
  `fetch-stats: ${stats.visits.last30} visits in 30 days, ${Object.keys(stats.pages).length} pages, ` +
    `${stats.apps.length} app events → assets/data/stats.json`
);

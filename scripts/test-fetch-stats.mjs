// Unit tests for scripts/fetch-stats.mjs. Each case runs the script in a child
// process with fetch() replaced by a scripted fake (--import), writing to a
// temp file via STATS_OUT, so nothing touches the network or the real
// assets/data/stats.json.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const script = fileURLToPath(new URL('./fetch-stats.mjs', import.meta.url));

// The fake answers from FAKE_PLAN: a list of [urlFragment, status, body]
// entries, each used once in order of first match; every URL is logged to
// FAKE_LOG so tests can count requests.
const FAKE = `
import { appendFileSync } from 'node:fs';
const plan = JSON.parse(process.env.FAKE_PLAN);
globalThis.fetch = async (input) => {
  const url = String(input);
  appendFileSync(process.env.FAKE_LOG, url + '\\n');
  const i = plan.findIndex(([frag]) => url.includes(frag));
  if (i < 0) throw new Error('unexpected request ' + url);
  const [, status, body] = plan.splice(i, 1)[0];
  return new Response(JSON.stringify(body), { status, headers: { 'retry-after': '0' } });
};`;

async function run(plan, { token = 'secret', fallback } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'fetch-stats-'));
  const fake = join(dir, 'fake.mjs');
  await writeFile(fake, FAKE);
  const out = join(dir, 'stats.json');
  const log = join(dir, 'requests.log');
  await writeFile(log, '');
  const env = {
    ...process.env, STATS_OUT: out, FAKE_PLAN: JSON.stringify(plan), FAKE_LOG: log,
    GOATCOUNTER_TOKEN: token, STATS_FALLBACK_URL: fallback || '', GITHUB_ACTIONS: '',
  };
  try {
    const { stdout } = await promisify(execFile)(
      process.execPath, ['--import', pathToFileURL(fake).href, script, 'example'], { env });
    const stats = await readFile(out, 'utf8').then(JSON.parse, () => null);
    const requests = (await readFile(log, 'utf8')).split('\n').filter(Boolean);
    return { stdout, stats, requests };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const today = new Date().toISOString().slice(0, 10);
const API = [
  ['/stats/total?start=2024', 200, { total: 900, stats: [] }],
  ['/stats/total', 200, { total: 42, stats: [{ day: today, daily: 5 }] }],
  ['/stats/hits?start=2024', 200, { hits: [{ path: '/blog/a', title: 'A', count: 30 }] }],
  ['/stats/hits', 200, { hits: [
    { path: '/blog/a', title: 'A', count: 9 },
    { path: 'app:blog', title: 'app:blog', count: 4, event: true },
    { path: 'resume:download', title: 'resume:download', count: 2, event: true },
  ] }],
  ['/stats/locations', 200, { stats: [{ id: 'CA', name: 'Canada', count: 12 }] }],
];

test('a rate-limited request waits and retries, then the snapshot is written', async () => {
  const { stats, requests } = await run([['/stats/total', 429, { error: 'rate limited' }], ...API]);
  assert.equal(requests.length, API.length + 1);
  assert.deepEqual(stats.visits, { last7: 5, last30: 42, allTime: 900 });
  assert.equal(stats.pages['/blog/a'], 30);
  assert.deepEqual(stats.apps, [{ id: 'blog', count: 4 }]);
  assert.equal(stats.resume.downloads, 2);
  assert.deepEqual(stats.countries, [{ name: 'Canada', count: 12 }]);
});

test('an API failure redeploys the last good snapshot', async () => {
  const previous = { generatedAt: '2026-01-01T00:00:00.000Z', visits: { last7: 1, last30: 2, allTime: 3 } };
  const { stats, stdout } = await run(
    [['/stats/total', 500, { error: 'down' }], ['live.example/stats.json', 200, previous]],
    { fallback: 'https://live.example/stats.json' });
  assert.deepEqual(stats, previous);
  assert.match(stdout, /redeploying the snapshot from 2026-01-01/);
});

test('an API failure with no earlier snapshot writes nothing and still exits 0', async () => {
  const { stats, stdout } = await run([['/stats/total', 401, { error: 'bad token' }]]);
  assert.equal(stats, null);
  assert.match(stdout, /no earlier snapshot/);
});

test('without a token it skips without any request', async () => {
  const { stats, requests } = await run([], { token: '' });
  assert.equal(stats, null);
  assert.equal(requests.length, 0);
});

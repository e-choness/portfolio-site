import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('../assets/js/echoos/analytics.js', import.meta.url), 'utf8')
  .replace(/^export /gm, '') + '\nglobalThis.api = { liveCount, trackView };';

function setup({ privacy = false, code = 'example', fetcher } = {}) {
  const listeners = {};
  const requests = [];
  const scripts = [];
  const context = {
    navigator: { globalPrivacyControl: privacy },
    window: {},
    document: {
      getElementById: () => ({ dataset: { goatcounter: code } }),
      createElement: () => ({ dataset: {}, addEventListener: (event, fn) => { listeners[event] = fn; } }),
      head: { appendChild: script => scripts.push(script) },
    },
    fetch: async url => {
      requests.push(url);
      return fetcher ? fetcher(url) : { ok: true, json: async () => ({ count: '1,234' }) };
    },
  };
  runInNewContext(source, context);
  return { api: context.api, listeners, requests, scripts };
}

test('privacy opt-out and disabled analytics make no requests', async () => {
  for (const options of [{ privacy: true }, { code: '' }]) {
    const env = setup(options);
    assert.equal(await env.api.liveCount('/blog/example'), null);
    assert.equal(env.scripts.length, 0);
    assert.equal(env.requests.length, 0);
  }
});

test('blocked tracker settles pending counters without requesting them', async () => {
  const env = setup();
  const count = env.api.liveCount('/blog/first');
  env.listeners.error();
  assert.equal(await count, null);
  assert.equal(await env.api.liveCount('/blog/second'), null);
  env.api.trackView('/blog/second');
  assert.equal(env.requests.length, 0);
});

test('healthy counters deduplicate concurrent and repeat requests', async () => {
  const env = setup();
  env.listeners.load();
  assert.deepEqual(await Promise.all([
    env.api.liveCount('/blog/example'), env.api.liveCount('/blog/example'),
  ]), [1234, 1234]);
  assert.equal(await env.api.liveCount('/blog/example'), 1234);
  assert.equal(env.requests.length, 1);
});

test('failed counters stop later requests for other posts', async () => {
  for (const fetcher of [async () => { throw Error('blocked'); }, async () => ({ ok: false })]) {
    const env = setup({ fetcher });
    env.listeners.load();
    assert.equal(await env.api.liveCount('/blog/first'), null);
    assert.equal(await env.api.liveCount('/blog/second'), null);
    assert.equal(env.requests.length, 1);
  }
});

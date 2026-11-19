// Captures the README media from a served dev build (see run.sh):
//   banner → .github/readme/banner-{light,dark}.webp  (2400×800, lossless)
//   tour   → .github/readme/tour.webp                 (1280×720, near-lossless, animated)
// Neither uses lossy (VP8) WebP, so there are no compression blocks around text
// or in gradients. Near-lossless moves pixel values by at most ±2, which keeps
// the tour about a quarter smaller than lossless with no visible difference.
// Math.random is seeded, so re-running gives the same wallpaper and game
// layouts, and the images only change when the site does.
import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { connect, sleep } from './cdp.mjs';

const BASE = 'http://127.0.0.1:4000';
const OUT = fileURLToPath(new URL('../../.github/readme/', import.meta.url));
const run = promisify(execFile);
const what = process.argv[2] || 'all';

const cdp = await connect();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'no-preference' }],
});

// mulberry32: a tiny seeded PRNG standing in for Math.random.
const seeded = (seed) => `(() => { let a = ${seed} >>> 0; Math.random = () => {
  a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;

// Holds the wallpaper canvas on its last frame, redrawing once per theme
// change. Behind open windows the real one only drifts a few pixels a second,
// but that drift changes every frame of the tour and multiplies its size.
const STILL_WALLPAPER = `(() => {
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, opts) {
    const ctx = getContext.call(this, type, opts);
    if (type !== '2d' || !this.classList.contains('os-wallpaper')) return ctx;
    let frames = 0, theme = null, draw = true;
    const drawing = new Set(['clearRect', 'fillRect', 'fill', 'stroke']);
    return new Proxy(ctx, {
      get(t, k) {
        if (k === 'clearRect') {   // the first call of every wallpaper frame
          const now = document.documentElement.dataset.echoTheme;
          draw = frames++ < 20 || now !== theme;
          theme = now;
        }
        const v = t[k];
        if (typeof v !== 'function') return v;
        return drawing.has(k) ? (...a) => { if (draw) v.apply(t, a); } : v.bind(t);
      },
      set(t, k, v) { t[k] = v; return true; },
    });
  };
})();`;

let initScript = null;
// Fresh profile at the given viewport: empty storage plus `storage` presets,
// written before any page script runs, then loads the OS at `hash`.
async function scene({ width, height, scale = 1, storage = {}, seed = 11, hash = '', still = false }) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
  await cdp.send('Storage.clearDataForOrigin', { origin: BASE, storageTypes: 'all' });
  if (initScript) await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: initScript });
  const presets = Object.entries({ 'echoos-sound': 'off', ...storage })
    .map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join('');
  ({ identifier: initScript } = await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `${seeded(seed)} ${still ? STILL_WALLPAPER : ''} try { localStorage.clear(); ${presets} } catch {}`,
  }));
  await cdp.send('Page.navigate', { url: 'about:blank' });
  await cdp.send('Page.navigate', { url: `${BASE}/${hash}` });
}

const desktopReady = () => cdp.until(`document.querySelector('.os-dock') && !document.querySelector('.os-boot')`, 20000);

// --- banner ----------------------------------------------------------------

// The banner is the live OS: real windows over the real wallpaper, with the
// menu bar, dock, icons and toasts hidden and a title block laid over the left.
// The viewport is larger than the banner so windows can run off its edges.
const B = { w: 1200, h: 400, top: 200, scale: 2 };
const POST = 'guardrails-that-tell-you-the-truth';
const PROJECT_PAGE = 'songforge';
const at = (x, y, w, h) => ({ x, y: y + B.top, w, h });
const WINS = { blog: at(560, 30, 600, 460), proj: at(884, 132, 420, 330), term: at(488, 212, 410, 280) };

const BANNER_CSS = `
  .os-menubar,.os-dock,.os-desktop,.os-ticker,.os-toasts,.os-notif,.os-welcome,.os-tabbar,
  .os-win[data-app="about"],.os-win-resize{display:none!important}
  .rb{position:absolute;left:68px;top:${B.top}px;height:${B.h}px;width:410px;z-index:1;display:flex;
    flex-direction:column;justify-content:center;font-family:var(--font-sans);color:var(--ink)}
  .rb-mark{display:flex;align-items:center;gap:14px}
  .rb-square{width:40px;height:40px;border-radius:11px;background:var(--accent);flex:none}
  .rb-word{font:800 66px/1 var(--font-sans);letter-spacing:-.035em}
  .rb-caret{width:14px;height:50px;background:var(--accent);opacity:.8;margin-left:-8px;align-self:flex-end;margin-bottom:3px}
  .rb-bar{width:60px;height:4px;border-radius:2px;background:var(--accent);margin:22px 0 16px}
  .rb-tag{font:500 18px/1.45 var(--font-sans);color:var(--ink-soft);max-width:380px;margin:0}
  .rb-apps{display:flex;gap:6px;margin-top:20px}
  .rb-app{font:500 11.5px/1 var(--font-mono);padding:6px 8px;white-space:nowrap;border-radius:var(--r-ctl);color:var(--ink-soft);
    background:var(--glass);border:1px solid var(--line);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
  .rb-app b{color:var(--accent);font-weight:600;margin-right:5px}`;

async function banner(theme) {
  await scene({
    width: 1400, height: 800, scale: B.scale, seed: 23, hash: `#/blog/${POST}`,
    storage: { 'echoos-theme': theme, 'echoos-visited': '1', 'echoos-guide-done': '1', 'echoos-wins': JSON.stringify(WINS) },
  });
  await desktopReady();
  // Reader scrolled past the hero to the post title (the heroes are small
  // lossy WebPs that look soft at 2×), project page with its vector banner.
  await cdp.until(`document.querySelector('.os-win[data-app="blog"] h1')`);
  await cdp.js(`(() => {
    const h1 = document.querySelector('.os-win[data-app="blog"] h1');
    let s = h1.parentElement;
    while (s && !(s.scrollHeight > s.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(s).overflowY))) s = s.parentElement;
    if (s) s.scrollTop += h1.getBoundingClientRect().top - s.getBoundingClientRect().top - 84;
  })()`);
  await cdp.js(`location.hash = '#/proj/${PROJECT_PAGE}'`);
  await cdp.until(`document.querySelector('.os-win[data-app="proj"] img[src$=".svg"]')?.complete`);
  await cdp.js(`location.hash = '#/term'`);
  const input = '.os-win[data-app="term"] .os-term-input';
  await cdp.until(`document.querySelector('${input}')`);
  await cdp.js(`document.querySelector('${input}').focus()`);
  await cdp.type('neofetch', 10);
  await cdp.key('Enter', { code: 'Enter', keyCode: 13, text: '\r' });

  // Title block: brand mark as on the boot screen, apps as listed in apps.yml.
  await cdp.js(`(async () => {
    const style = document.createElement('style');
    style.textContent = ${JSON.stringify(BANNER_CSS)};
    document.head.appendChild(style);
    const { apps } = await (await fetch('/assets/data/content.json')).json();
    const pick = ['blog', 'proj', 'arcade', 'term', 'stats'];
    const chips = pick.map((id) => apps.find((a) => a.id === id)).filter(Boolean)
      .map((a) => '<span class="rb-app"><b>' + a.glyph + '</b>' + a.label + '</span>').join('');
    const el = document.createElement('div');
    el.className = 'rb';
    el.innerHTML = '<div class="rb-mark"><span class="rb-square"></span><span class="rb-word">EchoOS</span><span class="rb-caret"></span></div>'
      + '<div class="rb-bar"></div><p class="rb-tag">Echo Yin’s portfolio, built as a desktop operating system that runs in your browser.</p>'
      + '<div class="rb-apps">' + chips + '</div>';
    document.getElementById('echoos-root').appendChild(el);
    await document.fonts.ready;
  })()`);
  await sleep(1500); // window open animations finish

  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'png', clip: { x: 0, y: B.top, width: B.w, height: B.h, scale: 1 }, captureBeyondViewport: false,
  });
  const png = `/tmp/banner-${theme}.png`;
  await writeFile(png, data, 'base64');
  const out = `${OUT}banner-${theme}.webp`;
  await run('cwebp', ['-quiet', '-lossless', '-z', '9', '-metadata', 'none', png, '-o', out]);
  console.log(`banner-${theme}.webp`);
}

// --- tour ------------------------------------------------------------------

// A visible pointer (headless screenshots have none) that glides between
// targets, with a ring on each click.
const POINTER = `(() => {
  const c = document.createElement('div');
  c.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M5 3l15 9-6.6 1.6-3.7 6.4z" fill="#17142b" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  Object.assign(c.style, { position: 'fixed', left: 0, top: 0, zIndex: 2147483647, pointerEvents: 'none',
    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.35))', transform: 'translate(900px,560px)' });
  document.documentElement.appendChild(c);
  let x = 905, y = 563;
  window.__pointer = (nx, ny, ms) => {
    c.style.transition = 'transform ' + ms + 'ms cubic-bezier(.45,.05,.25,1)';
    c.style.transform = 'translate(' + (nx - 5) + 'px,' + (ny - 3) + 'px)';
    x = nx; y = ny;
  };
  window.__ring = () => {
    const r = document.createElement('div');
    Object.assign(r.style, { position: 'fixed', left: (x - 15) + 'px', top: (y - 15) + 'px', width: '30px', height: '30px',
      borderRadius: '50%', border: '2px solid var(--accent)', zIndex: 2147483646, pointerEvents: 'none',
      transition: 'transform .45s ease-out, opacity .45s ease-out' });
    document.documentElement.appendChild(r);
    requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transform = 'scale(1.9)'; r.style.opacity = '0'; }));
    setTimeout(() => r.remove(), 520);
  };
})()`;

async function pointTo(selector, ms = 650) {
  const p = await cdp.center(selector);
  await cdp.js(`window.__pointer(${p.x}, ${p.y}, ${ms})`);
  await sleep(ms + 50);
  await cdp.mouse(p.x, p.y);
  return p;
}

async function click(selector) {
  const p = await pointTo(selector);
  await cdp.js('window.__ring()');
  await cdp.mouse(p.x, p.y, 'mousePressed');
  await sleep(70);
  await cdp.mouse(p.x, p.y, 'mouseReleased');
}

async function smoothScroll(windowSel, targetSel, offset = 60) {
  await cdp.js(`(() => {
    const t = document.querySelector(${JSON.stringify(`${windowSel} ${targetSel}`)});
    let s = t && t.parentElement;
    while (s && !(s.scrollHeight > s.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(s).overflowY))) s = s.parentElement;
    if (s) s.scrollTo({ top: s.scrollTop + t.getBoundingClientRect().top - s.getBoundingClientRect().top - ${offset}, behavior: 'smooth' });
  })()`);
}

// Screenshots as fast as Chromium renders them until `script` finishes. Each
// frame lasts until the next one, so playback runs at real speed; repeated
// frames are dropped and fold into the previous frame's duration.
async function record(dir, script) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const frames = [];
  let recording = true;
  let prev = '';
  const t0 = Date.now();
  const loop = (async () => {
    while (recording) {
      // A capture during a navigation commit fails; just take the next one.
      const data = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true })
        .then((r) => r.data, () => sleep(30).then(() => prev));
      if (data === prev) continue;
      prev = data;
      const file = `${dir}/${String(frames.length).padStart(4, '0')}.png`;
      frames.push({ t: Date.now() - t0, file });
      await writeFile(file, data, 'base64');
    }
  })();
  try { await script(); } finally { recording = false; await loop; }
  return frames;
}

// Tags the first element under `selector` whose text includes `text`, so it
// can be clicked by name rather than by position.
const byText = async (selector, text) => {
  await cdp.until(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => e.textContent.includes(${JSON.stringify(text)}));
    if (el) el.dataset.tour = 'pick';
    return !!el;
  })()`);
  return '[data-tour="pick"]';
};

const PROJECT = 'SongForge'; // its banner is an SVG, so the detail view stays sharp

async function tour() {
  await scene({ width: 1280, height: 720, scale: 1, seed: 5, still: true });
  const frames = await record(process.env.TOUR_FRAMES || '/tmp/tour', async () => {
    await desktopReady();
    await sleep(1600);                                    // boot → About window, welcome toast
    await cdp.js(POINTER);
    await cdp.key('k', { code: 'KeyK', keyCode: 75, modifiers: 2 });   // Ctrl+K: Spotlight
    await cdp.until(`document.querySelector('.os-spotlight-input')`);
    await sleep(450);
    await cdp.type('guardrails', 90);
    await sleep(700);
    await cdp.key('Enter', { code: 'Enter', keyCode: 13, text: '\r' });
    await cdp.until(`document.querySelector('.os-win[data-app="blog"] svg[aria-roledescription]')`);
    await sleep(1300);
    await smoothScroll('.os-win[data-app="blog"]', 'svg[aria-roledescription]', 70);
    await sleep(1500);
    await click('.os-mb-theme');                          // dark mode; the diagram re-renders
    await sleep(1700);
    await click('.os-win[data-app="blog"] .os-win-close');
    await sleep(500);
    await click('.os-dock-item[data-app="proj"]');
    await sleep(1200);
    await click(await byText('.os-win[data-app="proj"] .os-proj-title', PROJECT));
    await sleep(1500);
    await click('.os-win[data-app="proj"] .os-win-close');
    await sleep(400);
    await click('.os-dock-item[data-app="arcade"]');
    await cdp.until(`document.querySelector('.os-arcade-card[data-game="orrery"]')`);
    await sleep(800);
    await click('.os-arcade-card[data-game="orrery"]');
    await sleep(3400);
    await click('.os-dock-item[data-app="term"]');
    await cdp.until(`document.activeElement && document.activeElement.matches('.os-term-input')`);
    await sleep(400);
    await cdp.type('neofetch', 90);
    await cdp.key('Enter', { code: 'Enter', keyCode: 13, text: '\r' });
    await sleep(2400);
  });

  // img2webp: per-frame -d applies to the frame after it.
  const args = ['-loop', '0', '-near_lossless', '60', '-lossless', '-q', '100', '-m', '6'];
  frames.forEach((f, i) => {
    const next = frames[i + 1];
    args.push('-d', String(next ? Math.max(20, next.t - f.t) : 2500), f.file);
  });
  const out = `${OUT}tour.webp`;
  await run('img2webp', [...args, '-o', out], { maxBuffer: 1 << 26 });
  console.log(`tour.webp: ${frames.length} frames, ${(frames.at(-1).t / 1000).toFixed(1)} s`);
}

try {
  if (what === 'banner' || what === 'all') { await banner('light'); await banner('dark'); }
  if (what === 'tour' || what === 'all') await tour();
  if (cdp.errors.length) console.log('page exceptions:\n  ' + cdp.errors.join('\n  '));
} finally {
  cdp.close();
}

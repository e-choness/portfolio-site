---
---
// apps/arcade.js — game grid + canvas runner + HUD + touch pad (§6.7).
// Reads the registry from _data/arcade.yml and drives games.js, which fetches a
// game's module on demand; the theme object is built from the live computed
// custom properties every time a game starts.
import { store } from '../store.js';
import { beep } from '../sound.js';

function readProp(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function hexToRgba(hex, a) {
  if (typeof hex !== 'string') return `rgba(122, 79, 184, ${a})`;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return `rgba(122, 79, 184, ${a})`;
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// overlay = color-mix(in oklab, var(--bg) 72%, transparent) resolved to rgba.
// Probe the browser first; if color-mix is unsupported, fall back to straight
// alpha on --bg (a visually equivalent flat rgba).
function resolveOverlay() {
  try {
    const probe = document.createElement('div');
    probe.style.background = 'color-mix(in oklab, var(--bg) 72%, transparent)';
    document.body.appendChild(probe);
    const v = getComputedStyle(probe).backgroundColor;
    probe.remove();
    if (v && v !== 'rgba(0, 0, 0, 0)') return v;
  } catch { /* probe failed — fall through */ }
  return hexToRgba(readProp('--bg', '#f1eee8'), 0.72);
}

function buildTheme() {
  return {
    bg: readProp('--bg', '#f1eee8'),
    ink: readProp('--ink', '#211d27'),
    muted: readProp('--muted', '#6f6a78'),
    accent: readProp('--accent', '#7a4fb8'),
    accentSoft: readProp('--accent-soft', 'rgba(122,79,184,.11)'),
    soft: readProp('--accent-soft', 'rgba(122,79,184,.11)'),
    surface: readProp('--surface', '#fbfaf7'),
    line: readProp('--line', 'rgba(33,29,39,.13)'),
    overlay: resolveOverlay(),
    beep,
  };
}

// The whole arcade registry: card, HUD and exhibit copy for every game, in the
// order they appear. games.js only knows how to run an id — everything a human
// would want to edit lives in _data/arcade.yml.
const ARCADE = {{ site.data.arcade | jsonify }};

export function renderArcade(bodyEl, { toast }) {
  const games = ARCADE;
  let current = null;
  let runner = null;
  let alive = true;

  bodyEl.innerHTML = `
    <div class="os-arcade">
      <div class="os-arcade-grid"></div>
      <div class="os-arcade-footnote">Every sprite, sound and explosion is generated in JavaScript — no image or audio files. High scores persist in your browser.</div>
      <div class="os-arcade-stage" hidden>
        <div class="os-arcade-hud">
          <button type="button" class="os-arcade-back" aria-label="Back to games">‹<span class="os-arcade-back-label"> games</span></button>
          <span class="os-arcade-name"></span>
          <span class="os-arcade-score"></span>
          <span class="os-arcade-spacer"></span>
          <div class="os-arcade-actions">
            <button type="button" class="os-arcade-exhibit-btn">exhibit</button>
            <button type="button" class="os-arcade-restart">restart</button>
          </div>
        </div>
        <div class="os-arcade-canvas-wrap"><canvas class="os-arcade-canvas" tabindex="0"></canvas></div>
        <p class="os-arcade-hint"></p>
        <div class="os-arcade-pad"></div>
        <div class="os-arcade-exhibit"></div>
      </div>
    </div>`;

  const grid = bodyEl.querySelector('.os-arcade-grid');
  const footnote = bodyEl.querySelector('.os-arcade-footnote');
  const stage = bodyEl.querySelector('.os-arcade-stage');
  const canvas = bodyEl.querySelector('.os-arcade-canvas');
  const nameEl = bodyEl.querySelector('.os-arcade-name');
  const scoreEl = bodyEl.querySelector('.os-arcade-score');
  const hintEl = bodyEl.querySelector('.os-arcade-hint');
  const padEl = bodyEl.querySelector('.os-arcade-pad');
  const exhibitEl = bodyEl.querySelector('.os-arcade-exhibit');

  function renderExhibit(ex) {
    if (!ex || !ex.origin) { exhibitEl.hidden = true; return; }
    const srcs = (ex.sources || []).length
      ? `<div class="os-arcade-exhibit-sources">${ex.sources.map((s, i) =>
          `<a class="os-arcade-exhibit-src" href="${s.url}" target="_blank" rel="noopener noreferrer">[${i + 1}] ${s.label}</a>`
        ).join('')}</div>`
      : '';
    exhibitEl.hidden = false;
    exhibitEl.innerHTML = `
      <div class="os-arcade-exhibit-header">
        <span class="os-arcade-exhibit-marker">◈</span>
        <span class="os-arcade-exhibit-label">exhibit</span>
        <span class="os-arcade-exhibit-credit">${ex.credit}</span>
      </div>
      <div class="os-arcade-exhibit-body">
        <p class="os-arcade-exhibit-origin">${ex.origin}</p>
        <p class="os-arcade-exhibit-fact"><span class="os-arcade-exhibit-star" aria-hidden="true">★</span>${ex.fact}</p>
        ${srcs}
      </div>`;
  }

  // --- grid ----------------------------------------------------------------
  const hiscores = () => (window.EchoGames ? window.EchoGames.highscores() : {});
  for (const game of games) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'os-arcade-card';
    b.dataset.game = game.id;
    b.innerHTML = `<span class="os-arcade-card-glyph"></span><strong class="os-arcade-card-name"></strong><span class="os-arcade-card-tag"></span><span class="os-arcade-card-hi"></span>`;
    b.querySelector('.os-arcade-card-glyph').textContent = game.glyph || '▪';
    b.querySelector('.os-arcade-card-name').textContent = game.name;
    b.querySelector('.os-arcade-card-tag').textContent = game.tag;
    b.querySelector('.os-arcade-card-hi').textContent = `★ ${hiscores()[game.id] || 0}`;
    b.addEventListener('click', () => startGame(game));
    // Hover or keyboard focus is a good enough signal to go and fetch the module.
    const warm = () => window.EchoGames.preload([game.id], game.data ? [game.data] : []);
    b.addEventListener('pointerenter', warm, { once: true });
    b.addEventListener('focus', warm, { once: true });
    grid.appendChild(b);
  }

  // The Arcade is open, so the games are about to be wanted. Fetch the rest in
  // the background once the browser is idle — on touch there is no hover to
  // warm them, and the whole set is ~65 KB gzipped.
  const whenIdle = window.requestIdleCallback || ((fn) => setTimeout(fn, 400));
  whenIdle(() => {
    if (!alive) return;
    window.EchoGames.preload(games.map((g) => g.id), games.map((g) => g.data).filter(Boolean));
  });

  // --- canvas / runner ------------------------------------------------------
  canvas.width = 620;
  canvas.height = 400;

  function arcXY(e, type) {
    if (!runner) return;
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const src = e.touches && e.touches.length ? e.touches[0] : e;
    const x = (src.clientX - r.left) * (canvas.width / r.width);
    const y = (src.clientY - r.top) * (canvas.height / r.height);
    runner.pointer(x, y, type);
  }

  const onCanvasDown = (e) => { canvas.focus({ preventScroll: true }); arcXY(e, 'down'); };
  const onCanvasMove = (e) => arcXY(e, 'move');
  const onCanvasTouch = (e) => { e.preventDefault(); arcXY(e, e.type === 'touchstart' ? 'down' : 'move'); };
  // 'up' is delivered for games that track a drag. It goes on the window so a
  // release outside the canvas still ends the drag; games that only care about
  // 'down' and 'move' ignore it.
  const onUp = (e) => { if (runner) runner.pointer(0, 0, 'up'); void e; };

  canvas.addEventListener('mousedown', onCanvasDown);
  canvas.addEventListener('mousemove', onCanvasMove);
  canvas.addEventListener('touchstart', onCanvasTouch, { passive: false });
  canvas.addEventListener('touchmove', onCanvasTouch, { passive: false });
  canvas.addEventListener('touchend', onUp);
  canvas.addEventListener('touchcancel', onUp);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('echoos:game-restart', () => { if (current && alive) startGame(current); });

  // Paint a single line of status straight onto the canvas — used while a game's
  // module is in flight, so the stage never shows the previous game's last frame.
  function canvasNotice(msg) {
    const c = canvas.getContext('2d');
    c.fillStyle = readProp('--bg', '#f1eee8');
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = readProp('--muted', '#6f6a78');
    c.font = '13px "IBM Plex Mono", monospace';
    c.textAlign = 'center';
    c.fillText(msg, canvas.width / 2, canvas.height / 2);
  }

  // start() now resolves only once the game's module has arrived. The token
  // guards against a second start — or a teardown — landing while one is in
  // flight, which would otherwise leave an orphaned game looping on the canvas.
  let startToken = 0;
  // Score and high score sit in their own spans so mobile can stack them.
  function setScore(s, h) {
    scoreEl.innerHTML = `<span>SCORE ${s}</span><span class="os-arcade-score-sep"> · </span><span>HI ${h}</span>`;
  }
  function startRunner(game) {
    const token = ++startToken;
    if (runner) { runner.stop(); runner = null; }
    const hi = hiscores()[game.id] || 0;
    setScore(0, hi);
    // An already-fetched module resolves on a microtask, so only announce the
    // wait if there actually is one — otherwise every restart would flash.
    let waiting = true;
    setTimeout(() => { if (waiting && token === startToken) canvasNotice('loading…'); }, 120);
    window.EchoGames.start(canvas, game.id, buildTheme(), (s, over, h) => {
      setScore(s, h);
    }, game.data).then((r) => {
      waiting = false;
      if (token !== startToken || !alive) { r.stop(); return; }
      runner = r;
    }, () => {
      waiting = false;
      if (token !== startToken || !alive) return;
      canvasNotice('could not load this game');
      toast(`Arcade: ${game.name} failed to load`);
    });
  }

  function startGame(game) {
    current = game;
    grid.hidden = true;
    footnote.hidden = true;
    stage.hidden = false;
    nameEl.textContent = game.name;
    hintEl.textContent = game.hint || '';
    padEl.innerHTML = '';
    if (game.pad) {
      const frag = document.createDocumentFragment();
      for (const { key, label, hold } of game.pad) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'os-pad-btn';
        b.textContent = label;
        b.style.touchAction = 'none';
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (!runner) return;
          if (hold) runner.hold(key, true); else runner.key(key);
        });
        if (hold) {
          const release = () => { if (runner) runner.hold(key, false); };
          b.addEventListener('pointerup', release);
          b.addEventListener('pointercancel', release);
          b.addEventListener('pointerleave', release);
        }
        frag.appendChild(b);
      }
      padEl.appendChild(frag);
    }
    bodyEl.scrollTop = 0;
    renderExhibit(game);
    startRunner(game);
  }

  function back() {
    startToken++;
    if (runner) runner.stop();
    runner = null;
    current = null;
    stage.hidden = true;
    footnote.hidden = false;
    grid.hidden = false;
    // Refresh hi score display on all cards after a game session.
    const hi = hiscores();
    for (const b of grid.querySelectorAll('.os-arcade-card')) {
      b.querySelector('.os-arcade-card-hi').textContent = `★ ${hi[b.dataset.game] || 0}`;
    }
  }

  bodyEl.addEventListener('click', (e) => {
    const restart = e.target.closest('.os-arcade-restart');
    if (restart && current) startGame(current);
    const backBtn = e.target.closest('.os-arcade-back');
    if (backBtn) back();
    const exhibitBtn = e.target.closest('.os-arcade-exhibit-btn');
    if (exhibitBtn) exhibitEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Re-start the current game when the theme changes (compare previous value to avoid restart on unrelated state).
  let lastTheme = store.get().theme;
  const unsubTheme = store.subscribe((s) => {
    if (s.theme === lastTheme) return;
    lastTheme = s.theme;
    if (current && alive && !stage.hidden) startRunner(current);
  });

  const onStart = (e) => {
    const id = e.detail && e.detail.id;
    const g = games.find((x) => x.id === id);
    if (g) startGame(g);
  };
  document.addEventListener('echoos:start-game', onStart);

  // Return teardown function
  return () => {
    back();
    alive = false;
    if (runner) runner.stop();
    unsubTheme();
    document.removeEventListener('echoos:start-game', onStart);
    canvas.removeEventListener('mousedown', onCanvasDown);
    canvas.removeEventListener('mousemove', onCanvasMove);
    canvas.removeEventListener('touchstart', onCanvasTouch);
    canvas.removeEventListener('touchmove', onCanvasTouch);
    canvas.removeEventListener('touchend', onUp);
    canvas.removeEventListener('touchcancel', onUp);
    window.removeEventListener('mouseup', onUp);
  };
}

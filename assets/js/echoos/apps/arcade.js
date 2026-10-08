---
---
// apps/arcade.js — game grid + canvas runner + HUD + touch pad (§6.7).
// Reads the registry from _data/arcade.yml and drives games.js, which fetches a
// game's module on demand; the theme object is built from the live computed
// custom properties every time a game starts.
import { store } from '../store.js';
import { beep } from '../sound.js';
import { writeRoute } from '../router.js';

function readProp(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function hexToRgba(hex, a) {
  if (typeof hex !== 'string') return `rgba(106, 90, 214, ${a})`;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return `rgba(106, 90, 214, ${a})`;
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
  return hexToRgba(readProp('--bg', '#e8e4ef'), 0.72);
}

function buildTheme() {
  return {
    bg: readProp('--bg', '#e8e4ef'),
    ink: readProp('--ink', '#211d27'),
    muted: readProp('--muted', '#6f6a78'),
    accent: readProp('--accent', '#6a5ad6'),
    accentSoft: readProp('--accent-soft', 'rgba(106,90,214,.12)'),
    soft: readProp('--accent-soft', 'rgba(106,90,214,.12)'),
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
        <div class="os-arcade-modes" role="tablist" aria-label="Game mode" hidden></div>
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
  const hudEl = bodyEl.querySelector('.os-arcade-hud');
  const wrapEl = bodyEl.querySelector('.os-arcade-canvas-wrap');
  const modesEl = bodyEl.querySelector('.os-arcade-modes');

  // Fit the canvas into the stage: as wide as the window allows, but never
  // taller than the height left after the HUD, hint and touch pad — so a
  // maximized window shows the whole play field (the exhibit scrolls below).
  function fitCanvas() {
    if (stage.hidden) return;
    const chrome = hudEl.offsetHeight + modesEl.offsetHeight + hintEl.offsetHeight + padEl.offsetHeight;
    const availH = stage.clientHeight - chrome - 2; // 2 = canvas border
    const availW = wrapEl.clientWidth;
    const w = Math.max(200, Math.min(availW, availH * (canvas.width / canvas.height)));
    canvas.style.width = `${Math.floor(w)}px`;
  }
  const fitObserver = new ResizeObserver(fitCanvas);
  fitObserver.observe(stage);

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

  // --- modes -----------------------------------------------------------------
  // A game may list `modes` in arcade.yml. The chosen one is remembered per
  // game, passed to the module as env.mode, and may override the entry's hint,
  // pad, size and exhibit. Each mode keeps its own high score: the first under
  // the bare game id (so existing scores carry over), the rest as <id>-<mode>.
  const MODE_KEY = 'echoos-arcade-modes';
  const MODE_FIELDS = ['hint', 'pad', 'size', 'credit', 'origin', 'fact', 'sources'];
  const savedModes = () => { try { return JSON.parse(localStorage.getItem(MODE_KEY) || '{}'); } catch { return {}; } };
  function modeOf(game) {
    if (!game.modes || !game.modes.length) return null;
    return game.modes.find((m) => m.id === savedModes()[game.id]) || game.modes[0];
  }
  function setMode(game, id) {
    try { localStorage.setItem(MODE_KEY, JSON.stringify({ ...savedModes(), [game.id]: id })); } catch { /* private mode */ }
  }
  const scoreIdOf = (game, mode) => (!mode || mode === game.modes[0] ? game.id : `${game.id}-${mode.id}`);
  // The game as it should be shown right now: the entry, with the mode's overrides.
  function viewOf(game) {
    const mode = modeOf(game);
    const view = { ...game };
    if (mode) for (const f of MODE_FIELDS) if (mode[f] !== undefined) view[f] = mode[f];
    return view;
  }

  // --- grid ----------------------------------------------------------------
  const hiscores = () => (window.EchoGames ? window.EchoGames.highscores() : {});
  // A card's "best" is the best across all of its modes.
  const bestOf = (game, hs) => Math.max(0, ...(game.modes || [null]).map((m) => hs[scoreIdOf(game, m)] || 0));
  const hiLabel = (h) => (h ? `best ${h}` : 'new');
  const setHi = (el, h) => { el.textContent = hiLabel(h); el.classList.toggle('is-best', !!h); };
  for (const game of games) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'os-arcade-card';
    b.dataset.game = game.id;
    b.innerHTML = `<span class="os-arcade-card-glyph" aria-hidden="true"></span><span class="os-arcade-card-text"><span class="os-arcade-card-head"><strong class="os-arcade-card-name"></strong><span class="os-arcade-card-hi"></span></span><span class="os-arcade-card-tag"></span></span>`;
    b.querySelector('.os-arcade-card-glyph').textContent = game.glyph || '▪';
    b.querySelector('.os-arcade-card-name').textContent = game.name;
    b.querySelector('.os-arcade-card-tag').textContent = game.tag;
    setHi(b.querySelector('.os-arcade-card-hi'), bestOf(game, hiscores()));
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
  // Most games share one 620×400 field; an entry's `size` overrides it (the
  // dino runs on Chrome's long, low strip). The CSS aspect-ratio follows.
  const DEFAULT_SIZE = [620, 400];
  function sizeCanvas([w, h]) {
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    canvas.style.aspectRatio = `${w} / ${h}`;
  }
  sizeCanvas(DEFAULT_SIZE);

  // What is still held once the event is over: bit 1 for the left button or
  // first finger, bit 2 for the right button or a second finger. Games that
  // drag or have a secondary action read it; the rest ignore it.
  const heldOf = (e) => (e.touches ? (e.touches.length ? 1 | (e.touches.length > 1 ? 2 : 0) : 0) : e.buttons & 3);
  function arcXY(e, type) {
    if (!runner) return;
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const src = e.touches && e.touches.length ? e.touches[0] : e;
    const x = (src.clientX - r.left) * (canvas.width / r.width);
    const y = (src.clientY - r.top) * (canvas.height / r.height);
    runner.pointer(x, y, type, heldOf(e));
  }

  const onCanvasDown = (e) => { canvas.focus({ preventScroll: true }); arcXY(e, 'down'); };
  const onCanvasMove = (e) => arcXY(e, 'move');
  // A drag that leaves the canvas keeps moving while a button is down.
  const onWindowMove = (e) => { if (e.buttons && e.target !== canvas) arcXY(e, 'move'); };
  const onCanvasTouch = (e) => { e.preventDefault(); arcXY(e, e.type === 'touchstart' ? 'down' : 'move'); };
  // 'up' is delivered for games that track a drag. It goes on the window so a
  // release outside the canvas still ends the drag; games that only care about
  // 'down' and 'move' ignore it. Lifting one of two fingers is a move, not an up.
  const onUp = (e) => {
    if (!runner) return;
    if (e.touches && e.touches.length) arcXY(e, 'move');
    else runner.pointer(0, 0, 'up', heldOf(e));
  };
  // The right button is a game control on the canvas, not a menu.
  const onMenu = (e) => e.preventDefault();

  canvas.addEventListener('mousedown', onCanvasDown);
  canvas.addEventListener('mousemove', onCanvasMove);
  canvas.addEventListener('contextmenu', onMenu);
  canvas.addEventListener('touchstart', onCanvasTouch, { passive: false });
  canvas.addEventListener('touchmove', onCanvasTouch, { passive: false });
  canvas.addEventListener('touchend', onUp);
  canvas.addEventListener('touchcancel', onUp);
  window.addEventListener('mousemove', onWindowMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('echoos:game-restart', () => { if (current && alive) startGame(current); });

  // Paint a single line of status straight onto the canvas — used while a game's
  // module is in flight, so the stage never shows the previous game's last frame.
  function canvasNotice(msg) {
    const c = canvas.getContext('2d');
    c.fillStyle = readProp('--bg', '#e8e4ef');
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
    const mode = modeOf(game);
    const scoreId = scoreIdOf(game, mode);
    const hi = hiscores()[scoreId] || 0;
    setScore(0, hi);
    // An already-fetched module resolves on a microtask, so only announce the
    // wait if there actually is one — otherwise every restart would flash.
    let waiting = true;
    setTimeout(() => { if (waiting && token === startToken) canvasNotice('loading…'); }, 120);
    window.EchoGames.start(canvas, game.id, buildTheme(), (s, over, h) => {
      setScore(s, h);
    }, game.data, { mode: mode && mode.id, scoreId }).then((r) => {
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

  // The mode tabs reuse the OS tab button. Picking one restarts the game in
  // that mode and hands focus back to the canvas, so space and the arrows go
  // to the game rather than re-pressing the tab.
  function renderModes(game) {
    modesEl.innerHTML = '';
    modesEl.hidden = !game.modes;
    if (!game.modes) return;
    const active = modeOf(game);
    for (const m of game.modes) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'os-tab-btn';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(m === active));
      b.textContent = m.label;
      b.addEventListener('click', () => {
        if (m === modeOf(game)) return;
        setMode(game, m.id);
        beep(700, 0.04);
        startGame(game);
        canvas.focus({ preventScroll: true });
      });
      modesEl.appendChild(b);
    }
  }

  function startGame(game) {
    current = game;
    writeRoute('arcade', game.id);
    grid.hidden = true;
    footnote.hidden = true;
    stage.hidden = false;
    nameEl.textContent = game.name;
    const view = viewOf(game);
    renderModes(game);
    hintEl.textContent = view.hint || '';
    padEl.innerHTML = '';
    if (view.pad) {
      const frag = document.createDocumentFragment();
      for (const { key, label, hold } of view.pad) {
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
    stage.scrollTop = 0;
    renderExhibit(view);
    sizeCanvas(view.size || DEFAULT_SIZE);
    fitCanvas();
    startRunner(game);
  }

  function back() {
    startToken++;
    if (runner) runner.stop();
    runner = null;
    current = null;
    writeRoute('arcade', null);
    stage.hidden = true;
    footnote.hidden = false;
    grid.hidden = false;
    // Refresh hi score display on all cards after a game session.
    const hi = hiscores();
    for (const b of grid.querySelectorAll('.os-arcade-card')) {
      setHi(b.querySelector('.os-arcade-card-hi'), bestOf(games.find((g) => g.id === b.dataset.game), hi));
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
  document.addEventListener('echoos:open-game', onStart); // deep link (Patch 81)

  // Return teardown function
  return () => {
    back();
    fitObserver.disconnect();
    alive = false;
    if (runner) runner.stop();
    unsubTheme();
    document.removeEventListener('echoos:start-game', onStart);
    document.removeEventListener('echoos:open-game', onStart);
    canvas.removeEventListener('mousedown', onCanvasDown);
    canvas.removeEventListener('mousemove', onCanvasMove);
    canvas.removeEventListener('contextmenu', onMenu);
    canvas.removeEventListener('touchstart', onCanvasTouch);
    canvas.removeEventListener('touchmove', onCanvasTouch);
    canvas.removeEventListener('touchend', onUp);
    canvas.removeEventListener('touchcancel', onUp);
    window.removeEventListener('mousemove', onWindowMove);
    window.removeEventListener('mouseup', onUp);
  };
}

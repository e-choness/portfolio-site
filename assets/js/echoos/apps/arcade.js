// apps/arcade.js — game grid + canvas runner + HUD + touch pad (§6.7).
// Drives the verbatim-ported games.js; the theme object is built from the
// live computed custom properties every time a game starts.
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

const GLYPHS = {
  tetris:   '▦',
  snake:    '◈',
  missile:  '↯',
  pond:     '◉',
  breakout: '◼',
  invaders: '▲',
};

export function renderArcade(bodyEl, { toast }) {
  const games = (window.EchoGames && window.EchoGames.list) || [];
  let current = null;
  let runner = null;
  let alive = true;

  bodyEl.innerHTML = `
    <div class="os-arcade">
      <div class="os-arcade-grid"></div>
      <div class="os-arcade-footnote">Every sprite, sound and explosion is generated in JavaScript — no image or audio files. High scores persist in your browser.</div>
      <div class="os-arcade-stage" hidden>
        <div class="os-arcade-hud">
          <button type="button" class="os-arcade-back">‹ games</button>
          <span class="os-arcade-name"></span>
          <span class="os-arcade-score">SCORE 0 · HI 0</span>
          <span class="os-arcade-spacer"></span>
          <button type="button" class="os-arcade-restart">restart</button>
        </div>
        <div class="os-arcade-canvas-wrap"><canvas class="os-arcade-canvas" tabindex="0"></canvas></div>
        <p class="os-arcade-hint"></p>
        <div class="os-arcade-pad"></div>
      </div>
    </div>`;

  const grid = bodyEl.querySelector('.os-arcade-grid');
  const stage = bodyEl.querySelector('.os-arcade-stage');
  const canvas = bodyEl.querySelector('.os-arcade-canvas');
  const nameEl = bodyEl.querySelector('.os-arcade-name');
  const scoreEl = bodyEl.querySelector('.os-arcade-score');
  const hintEl = bodyEl.querySelector('.os-arcade-hint');
  const padEl = bodyEl.querySelector('.os-arcade-pad');

  // --- grid ----------------------------------------------------------------
  const hiscores = () => (window.EchoGames ? window.EchoGames.highscores() : {});
  for (const game of games) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'os-arcade-card';
    b.dataset.game = game.id;
    b.innerHTML = `<span class="os-arcade-card-glyph"></span><strong class="os-arcade-card-name"></strong><span class="os-arcade-card-tag"></span><span class="os-arcade-card-hi"></span>`;
    b.querySelector('.os-arcade-card-glyph').textContent = GLYPHS[game.id] || '▪';
    b.querySelector('.os-arcade-card-name').textContent = game.name;
    b.querySelector('.os-arcade-card-tag').textContent = game.tag;
    b.querySelector('.os-arcade-card-hi').textContent = `★ ${hiscores()[game.id] || 0}`;
    b.addEventListener('click', () => startGame(game));
    grid.appendChild(b);
  }

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

  canvas.addEventListener('mousedown', onCanvasDown);
  canvas.addEventListener('mousemove', onCanvasMove);
  canvas.addEventListener('touchstart', onCanvasTouch, { passive: false });
  canvas.addEventListener('touchmove', onCanvasTouch, { passive: false });

  function startRunner(game) {
    if (runner) runner.stop();
    runner = window.EchoGames.start(canvas, game.id, buildTheme(), (s, over, h) => {
      scoreEl.textContent = `SCORE ${s} · HI ${h}`;
    });
    const hi = hiscores()[game.id] || 0;
    scoreEl.textContent = `SCORE 0 · HI ${hi}`;
  }

  function startGame(game) {
    current = game;
    grid.hidden = true;
    stage.hidden = false;
    nameEl.textContent = game.name;
    hintEl.textContent = game.hint || '';
    padEl.innerHTML = '';
    if (game.pad) {
      const frag = document.createDocumentFragment();
      for (const { k, l } of game.pad) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'os-pad-btn';
        b.textContent = l;
        b.style.touchAction = 'none';
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (runner) runner.key(k);
        });
        frag.appendChild(b);
      }
      padEl.appendChild(frag);
    }
    startRunner(game);
  }

  function back() {
    if (runner) runner.stop();
    runner = null;
    current = null;
    stage.hidden = true;
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
  };
}

// games/bubbleup.js — Bubble UP!
// Factory: takes the runner env, returns { key?, pointer?, tick }.
// A port of the Unity game, rule for rule, in the original's world units: a
// Main Bubble of radius 46 holding a 55-cell hex grid of 5.5-unit bubbles.
// Bubbles fall in from twelve lanes; rotate the Main Bubble so they land on
// their own colour. Only a bubble that lands straddling the rim pops anything:
// it takes its whole same-colour group with it. One that lands on the rim with
// nothing to match is a game over after 0.6 s of coyote time. Pop the centre
// bubble for a combo; clear everything for Multibubble; shrink the cluster into
// the Mania ring for Bubble Mania. Levels come from bubbles popped, and each
// one offers a powerup. The four colours are the game's own, softened.
import { R, clear } from './common.js';

const TAU = Math.PI * 2;
const PALETTE = ['#f2a541', '#d06ba6', '#7cc46a', '#5dbfc6'];   // orange, pink, green, cyan
const WHITE = 4, BLACK = 5, NONE = -1;
const FILL = [...PALETTE, '#fbfaf7', '#1d1a22'];
const COS30 = Math.cos(Math.PI / 6);

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export default function bubbleup(env) {
  const { ctx, W, H, T, beep, addScore, gameOver, isOver } = env;
  const S = H / 160;                              // px per unit: the original camera shows ±80
  const MB = 46, BR = 5.5, CELL = 11, IN = MB - BR, OUT = MB + BR, TOUCH = CELL * 1.1;
  const SPAWN_R = 250, LANES = Math.floor(360 / (2 * Math.asin(BR / MB) * 180 / Math.PI + 15));
  const WARN = .5, POP_DELAY = .2, COYOTE = .1 + .6, JOIN = .1, SNAP_FIRST = .3, SNAP_LATER = 1, SLIDE = .2;
  const CHAIN_T = .5, SHAKE_T = .3, POP_T = .333;
  const ACCEL = 650, CAP0 = 100, CAP1 = 150;      // °/s² and °/s
  const POINTS = 50, SNAP_BONUS = 10, WB_POINTS = { [WHITE]: 1500, [BLACK]: 3000 };
  const LONG = [0, 0, 0, 0, 0, 0, 0, 500, 1000, 1500, 2000, 2500, 3000];
  const longBonus = (n) => (n >= 13 ? 5000 : LONG[n] || 0);
  const COMBO_N = 5, COMBO_R0 = 8.2, COMBO_R1 = 22.05, MANIA_R = 9.8, MANIA_STOP = 18;
  const FRENZY_N = 20, FRENZY_RATE = 1.5, MULTI_T = 60, MULTI_RESTACK = 10, WB_EVERY = 5;
  const LEVELS = [50, 125, 250, 400, 600];
  const levelAt = (l) => (l <= LEVELS.length ? LEVELS[l - 1] : 600 + 200 * (l - LEVELS.length));
  const damp = (d) => (d < 112.8 ? 25 : d < 134.9 ? 25 * (134.9 - d) / 22.1 : 0);
  const font = (px, w = '') => `${w}${px}px "IBM Plex Mono",monospace`;

  const POWERS = [
    { id: 'bomb', w: .211, name: 'Bomb', desc: ['a bubble that pops', 'its six neighbours'] },
    { id: 'multi', w: .1848, name: 'Multiplier', desc: ['a ×2 bubble that', 'doubles its chain'] },
    { id: 'paint', w: .1848, name: 'Paint', desc: ['a bubble that recolours', 'its neighbours'] },
    { id: 'frenzy', w: .1848, name: 'Bubble Frenzy', desc: ['twenty rainbow', 'bubbles, fast'] },
    { id: 'shield', w: .1848, name: 'Shield', desc: ['survive one', 'game over'] },
  ];

  // --- the grid ------------------------------------------------------------------
  // Pointy-top rows; a cell exists if a bubble in it sits wholly inside the
  // Main Bubble. Cell 0 is the centre. "Inward" neighbours are the ones within
  // ±60.5° of the way to the centre: a bubble with none of them occupied falls.
  const cells = [];
  for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) {
    const x = i * CELL + (j & 1 ? CELL / 2 : 0), y = j * CELL * Math.sqrt(3) / 2, d = Math.hypot(x, y);
    if (d + BR < MB) cells.push({ x, y, d });
  }
  cells.sort((a, b) => a.d - b.d);
  cells.forEach((c, i) => { c.i = i; c.nb = []; c.inward = []; c.ring = -1; });
  for (const a of cells) for (const b of cells) {
    if (a === b || Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - CELL) > CELL * .01) continue;
    a.nb.push(b.i);
    if (a.d > 0 && ((b.x - a.x) * -a.x + (b.y - a.y) * -a.y) / (CELL * a.d) > Math.cos(60.5 * Math.PI / 180)) a.inward.push(b.i);
  }
  cells[0].ring = 0;
  for (let q = [0]; q.length;) { const c = cells[q.shift()]; for (const n of c.nb) if (cells[n].ring < 0) { cells[n].ring = c.ring + 1; q.push(n); } }
  const board = new Array(cells.length).fill(null);

  // --- state -----------------------------------------------------------------------
  let bubbles = [], nextId = 1, angle = 0, omega = 0, vl = 0, vr = 0, gt = 0, grav = 100;
  let score = 0, popped = 0, level = 1, startPick = false, startingPopped = false, popsFresh = false;
  let nCombos = 0, comboBonus = 0, comboLeft = 0, comboR = COMBO_R0;
  let lastLane = Math.floor(R() * LANES), wave = [], queued = [], encounters = [], nextEnc = 50000, encN = 0, wbT = 0;
  const chance = { bomb: 0, multi: 0, paint: 0 }, cpts = [5, 5, 5, 5];
  let mania = null, frenzy = null, multi = null, stacks = 0, shield = 0;
  let phase = 'play', cards = [], sel = 1, dying = 0;
  let cam = { x: 0, y: 0, zoom: 1 }, shakes = [], flash = null, clearFx = null;
  let floats = [], parts = [], notes = [], banner = null, clock = 0;
  const RIM_N = 48, rim = new Float32Array(RIM_N), rimV = new Float32Array(RIM_N);
  const keys = {};
  let touchSide = 0;

  const make = (c, kind, o) => ({ id: nextId++, c, kind, st: 'snap', x: 0, y: 0, vx: 0, vy: 0, lx: 0, ly: 0, cell: null, t: 0, trail: [], ...o });
  const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const toLocal = (x, y) => rot(x, y, -angle);
  const pos = (b) => (b.st === 'warn' || b.st === 'fall' || b.st === 'blast' ? [b.x, b.y] : rot(b.lx, b.ly, angle));
  const solid = (b) => b.st === 'snap' || b.st === 'slide' || b.st === 'pop';
  const invincible = () => !!mania || !!multi || shield > 0;
  const say = (text, t = 1.6) => { banner = { text, t, t0: t }; };
  const play = (fs, gap = .09) => { fs.forEach((f, i) => notes.push({ at: clock + i * gap, f })); };

  // Nineteen random bubbles: the centre and the first two rings.
  for (const c of cells) if (c.ring <= 2) {
    const b = make(Math.floor(R() * 4), 'color', { lx: c.x, ly: c.y, cell: c.i, starting: true });
    board[c.i] = b; bubbles.push(b);
  }

  // --- groups ------------------------------------------------------------------------
  // The same-colour group a snapped bubble belongs to, through the grid.
  function flood(start, set = new Set()) {
    if (start.c === NONE) return set.add(start);
    const q = [start]; set.add(start);
    while (q.length) {
      const b = q.pop();
      for (const n of cells[b.cell].nb) {
        const o = board[n];
        if (o && o.st === 'snap' && o.c === start.c && !set.has(o)) { set.add(o); q.push(o); }
      }
    }
    return set;
  }
  // What an incoming bubble at the rim would pop: the groups of every
  // same-coloured bubble it touches, plus what any bomb among them adds.
  function popGroup(b) {
    const [lx, ly] = toLocal(b.x, b.y), set = new Set(), bombs = [];
    for (const o of bubbles) {
      if (o.st !== 'snap' || Math.hypot(o.lx - lx, o.ly - ly) > TOUCH) continue;
      if (b.c !== NONE && o.c === b.c) flood(o, set);
      else if (b.kind === 'bomb' && o.c < WHITE && o.c !== NONE) set.add(o);
    }
    for (const o of set) if (o.kind === 'bomb') bombs.push(o);
    while (bombs.length) {
      const o = bombs.pop();
      for (const n of cells[o.cell].nb) {
        const x = board[n];
        if (x && x.st === 'snap' && x.c < WHITE && !set.has(x)) { set.add(x); if (x.kind === 'bomb') bombs.push(x); }
      }
    }
    return [...set];
  }

  // --- popping -------------------------------------------------------------------------
  // The chain pops outward from where it started, over half a second; each
  // bubble shakes, then bursts. Score is counted at once, combo first, so the
  // centre bubble's chain always gets the multiplier it earned.
  function popChain(list, [ox, oy], incoming, quiet) {
    const all = [...list];
    if (incoming) {
      const [lx, ly] = toLocal(incoming.x, incoming.y);
      Object.assign(incoming, { st: 'pop', lx, ly, cell: null });
      all.unshift(incoming);
    }
    all.sort((a, b) => Math.hypot(a.lx - ox, a.ly - oy) - Math.hypot(b.lx - ox, b.ly - oy));
    all.forEach((b, i) => { b.st = 'pop'; b.t = -CHAIN_T * i / all.length; b.pi = i; });
    popsFresh = true;
    if (quiet) return;
    const centre = board[0] && all.includes(board[0]);
    if (centre && !frenzy) combo();
    if (frenzy) frenzy.dir *= -1;
    if (all.some((b) => b.starting)) startingPopped = true;
    const m = centre && nCombos ? comboBonus : 1, mm = 1 + all.filter((b) => b.kind === 'multi').length;
    let pts = longBonus(all.length);
    for (const b of all) pts += Math.max(1, Math.floor((WB_POINTS[b.c] || POINTS) * m * mm));
    for (const b of all) if (b.c >= 0 && b.c < 4) cpts[b.c] = Math.min(10, cpts[b.c] + 1);
    score += pts; addScore(pts); popped += all.length;
    const [wx, wy] = rot(ox, oy, angle);
    floats.push({ x: wx, y: wy, text: `+${pts}`, t: 0, big: true });
    if (all.length >= 7) say(`chain of ${all.length}  +${longBonus(all.length)}`, 1.2);
    if (all.length > 3) shakes.push({ t: -.5, dur: 1, amp: Math.min(3, 3 * (all.length - 3) / 7) });
    pluck(Math.atan2(wy, wx), 6 + all.length);
  }
  const popSelf = (b) => popChain([], toLocal(b.x, b.y), b, true);

  function combo() {
    nCombos++; comboBonus += 1 + stacks; comboLeft = COMBO_N;
    say(`combo ×${comboBonus}`, 1.2);
    play([784, 988, 1175], .06);
  }
  function endCombo() { nCombos = 0; comboBonus = 0; comboLeft = 0; }

  // --- snapping --------------------------------------------------------------------------
  function chooseCell(b) {
    const [lx, ly] = toLocal(b.x, b.y);
    const free = cells.filter((c) => !board[c.i]);
    if (!free.length) return -1;
    const dist = (c) => Math.hypot(c.x - lx, c.y - ly);
    const near = free.filter((c) => dist(c) <= 2 * BR);
    if (!near.length) return free.reduce((a, c) => (dist(c) < dist(a) ? c : a)).i;
    if (near.some((c) => c.i === 0)) return 0;
    const same = (c) => c.nb.filter((n) => board[n] && board[n].st === 'snap' && board[n].c === b.c && b.c !== NONE).length;
    near.sort((a, c) => same(c) - same(a) || dist(a) - dist(c));
    return near[0].i;
  }
  function settle(b, i) {
    if (i < 0) return;
    const [lx, ly] = toLocal(b.x, b.y);
    Object.assign(b, { st: 'slide', cell: i, fx: lx, fy: ly, lx, ly, t: 0 });
    board[i] = b;
  }
  function onSnap(b) {
    b.st = 'snap'; b.lx = cells[b.cell].x; b.ly = cells[b.cell].y; b.bump = .18;
    beep(520 + cells[b.cell].ring * 40, .02);
    if (b.kind === 'rainbow' && b.c === NONE) b.c = Math.floor(R() * 4);
    if (b.spawned && !b.snappedOnce) {
      b.snappedOnce = true;
      const g = flood(b), n = g.size - 1;
      if (n > 0) {
        let v = SNAP_BONUS * n;
        if (nCombos && !frenzy && board[0] && g.has(board[0])) v *= 5;
        v *= 1 + [...g].filter((o) => o.kind === 'multi').length;
        score += v; addScore(v);
        floats.push({ x: pos(b)[0], y: pos(b)[1] - 8, text: `+${v}`, t: 0 });
      }
      if (nCombos && !b.fragile && --comboLeft <= 0) endCombo();
    }
    b.fragile = false;
    if (b.kind === 'paint') b.paintT = .2;
    if (b.kind === 'rainbow' && b.cell === 0) popChain([b], [0, 0], null);
  }

  // --- spawning ----------------------------------------------------------------------------
  const laneBusy = (i) => bubbles.some((b) => b.lane === i && (b.st === 'warn' || (b.st === 'fall' && !b.collided)));
  function pickLane() {
    for (const o of [-2, -1, 1, 2].sort(() => R() - .5)) {
      const l = (lastLane + o + LANES) % LANES;
      if (!laneBusy(l)) return (lastLane = l);
    }
    return -1;
  }
  function pickColor() {
    let x = R() * cpts.reduce((a, b) => a + b, 0);
    for (let i = 0; i < 4; i++) if ((x -= cpts[i]) < 0) return i;
    return 3;
  }
  function rollSpecial() {
    for (const k of ['bomb', 'multi', 'paint']) if (R() < chance[k]) return k;
    return 'color';
  }
  function spawn(lane, o = {}) {
    const a = -Math.PI / 2 + lane * TAU / LANES;
    const kind = o.kind || (queued.length ? queued.shift() : rollSpecial());
    let c = o.c !== undefined ? o.c : kind === 'rainbow' ? NONE : pickColor();
    const ctr = board[0] && board[0].c >= 0 && board[0].c < WHITE ? board[0].c : NONE;
    if (kind === 'paint' && ctr !== NONE) c = ctr;
    // Combo rescue: with two bubbles left in a combo, help it along.
    if (kind === 'color' && o.c === undefined && nCombos && comboLeft <= 2 && ctr !== NONE && R() < .4) c = ctr;
    if (c >= 0 && c < 4) cpts[c] = Math.max(1, cpts[c] - 1);
    const b = make(c, kind, {
      st: 'warn', x: Math.cos(a) * SPAWN_R, y: Math.sin(a) * SPAWN_R, lane, a,
      warnT: frenzy ? WARN / 4 : WARN, spawned: true, fragile: !!o.fragile, mania: !!o.mania, frenzy: !!o.frenzy,
    });
    bubbles.push(b);
    return b;
  }

  function spawner(dt) {
    if (mania) {
      if (!mania.done && (mania.t -= dt) <= 0) {
        const l = pickLane();
        if (l >= 0) { spawn(l, { kind: 'color', mania: true }); mania.t = 1; if (mania.start + ++mania.n >= MANIA_STOP) mania.done = true; }
      }
      if (mania.done && !bubbles.some((b) => b.mania && (b.st === 'warn' || (b.st === 'fall' && !b.collided))) && (mania.end += dt) > 1) endMania();
    } else if (frenzy) {
      if (frenzy.n < FRENZY_N && (frenzy.t -= dt) <= 0) {
        frenzy.ptr = (frenzy.ptr + frenzy.dir + LANES) % LANES;
        const opts = [-1, 0, 1].map((k) => (frenzy.ptr + k + LANES) % LANES).filter((l) => !laneBusy(l));
        if (opts.length) { spawn(opts[Math.floor(R() * opts.length)], { kind: 'rainbow', frenzy: true }); frenzy.n++; frenzy.t = 1 / FRENZY_RATE; }
      }
      if (frenzy.n >= FRENZY_N && !bubbles.some((b) => b.frenzy && (b.st === 'warn' || (b.st === 'fall' && !b.collided))) && (frenzy.end += dt) > 1) { frenzy = null; wave = []; }
    } else if (gt > 1 && !wave.some((b) => b.st === 'warn' || (b.st === 'fall' && !b.collided))) {
      // The next bubble waits for the last one to land. In Multibubble a wave
      // is one real bubble and up to four fragile copies of its colour.
      const n = multi ? Math.min(1 + stacks, 5) : 1, lanes = [];
      for (let k = 0; k < n; k++) { const l = pickLane(); if (l < 0) break; lanes.push(l); }
      if (lanes.length) {
        const first = encounters.length ? spawn(lanes[0], { kind: 'color', c: encounters.shift() }) : spawn(lanes[0]);
        const c = first.c >= 0 && first.c < WHITE ? first.c : pickColor();
        wave = [first, ...lanes.slice(1).map((l) => spawn(l, { kind: 'color', c, fragile: true }))];
      }
    }
    // While a white or black bubble sits in the board, a rescue bubble comes
    // every five seconds: a rainbow if any white is there, else maybe a white.
    const wb = board.filter((b) => b && b.st === 'snap' && b.c >= WHITE);
    if (wb.length && (wbT += dt) >= WB_EVERY) {
      wbT = 0;
      const l = pickLane();
      if (l >= 0) {
        if (wb.some((b) => b.c === WHITE)) spawn(l, { kind: 'rainbow' });
        else spawn(l, { kind: 'color', c: R() < 1 / 5 ? WHITE : pickColor() });
      }
    } else if (!wb.length) wbT = 0;
  }

  // --- events ------------------------------------------------------------------------------
  function startFrenzy() {
    frenzy = { n: 0, t: 0, end: 0, dir: R() < .5 ? -1 : 1, ptr: lastLane };
    endCombo();
    say('bubble frenzy!', 1.8);
    play([523, 659, 784, 1047], .07);
  }
  function startMania() {
    const start = board.filter(Boolean).length;
    mania = { start, n: 0, t: .4, end: 0, done: start >= MANIA_STOP };
    for (const b of bubbles) if ((b.st === 'warn' || (b.st === 'fall' && !b.collided)) && b.kind === 'color' && b.c < WHITE) popSelf(b);
    say('bubble mania!', 1.8);
    play([659, 784, 988, 1319], .07);
  }
  function endMania() { mania = null; wave = []; }
  function startMulti() {
    if (multi) {
      if (gt - multi.last < MULTI_RESTACK) return;
      stacks = Math.min(4, stacks + 1); multi.left = MULTI_T; multi.last = gt;
    } else {
      multi = { left: MULTI_T, last: gt }; stacks = 1;
    }
    frenzy = null; wave = [];
    for (const b of bubbles) if ((b.st === 'warn' || b.st === 'fall') && b.kind === 'color' && b.c < WHITE) popSelf(b);
    flash = { t: 0 };
    say(`multibubble ×${stacks + 1}`, 2);
    play([523, 784, 1047, 1568], .08);
  }
  function endMulti() { multi = null; stacks = 0; wave = []; }

  function openPick() {
    const pool = POWERS.slice();
    cards = [];
    while (cards.length < 3 && pool.length) {
      let x = R() * pool.reduce((a, p) => a + p.w, 0), i = 0;
      while ((x -= pool[i].w) > 0 && i < pool.length - 1) i++;
      cards.push(pool.splice(i, 1)[0]);
    }
    sel = 1; phase = 'pick';
    play([523, 659, 784], .07);
  }
  function choose(i) {
    const p = cards[i];
    if (!p) return;
    if (p.id === 'frenzy') startFrenzy();
    else if (p.id === 'shield') shield = 1;
    else { queued.push(p.id); chance[p.id] = .05; }
    phase = 'play';
    beep(880, .05);
  }

  // A bubble on the rim with nothing to pop: coyote time, then game over.
  function coyote(b) {
    if (b.fragile || b.kind === 'rainbow' || b.kind === 'bomb') return popSelf(b);
    b.coyT = COYOTE;
    beep(196, .1);
  }
  function fail(b) {
    if (!invincible()) return die();
    // Invincibility pops the culprit and sends a wave out over the rim.
    popSelf(b);
    clearFx = { t: 0 };
    for (const o of bubbles) {
      if (o.st !== 'fall' || o.joined || o.c >= WHITE) continue;
      if (Math.hypot(o.x, o.y) + BR >= MB) popSelf(o);
    }
    if (mania) endMania(); else if (multi) endMulti(); else shield = 0;
    say('saved!', 1.2);
    play([988, 784, 988], .06);
  }
  function die() {
    dying = 1e-6;
    for (const b of bubbles) {
      const [x, y] = pos(b), d = Math.hypot(x, y) || 1, sp = 140 + R() * 120;
      Object.assign(b, { st: 'blast', x, y, vx: x / d * sp + (R() - .5) * 60, vy: y / d * sp + (R() - .5) * 60 });
    }
    board.fill(null);
    pluck(0, 30); pluck(Math.PI, 30);
  }

  // --- physics -----------------------------------------------------------------------------
  // Loose bubbles are pulled to the centre and slowed by the damping field;
  // snapped ones ride the rotating grid and act as walls.
  function collide(b, ox, oy, o) {
    const dx = b.x - ox, dy = b.y - oy, d2 = dx * dx + dy * dy, D = 2 * BR;
    if (d2 >= D * D) return;
    const d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d;
    b.x = ox + nx * D; b.y = oy + ny * D;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) { b.vx -= 1.2 * vn * nx; b.vy -= 1.2 * vn * ny; }
    if (!b.touch) b.touch = o;
  }
  function physics(dt) {
    const loose = bubbles.filter((b) => b.st === 'fall');
    const accel = (keys.ArrowDown || touchSide === 2 || (keys.ArrowLeft && keys.ArrowRight)) && !mania;
    let vmax = 0;
    for (const b of loose) { b.touch = null; b.accel = accel && !b.collided; vmax = Math.max(vmax, Math.hypot(b.vx, b.vy)); }
    const n = Math.min(30, Math.max(1, Math.ceil((vmax * dt + Math.abs(omega) * MB * dt) / 1.5)));
    const h = dt / n, G = 9.81 * grav;
    for (let s = 0; s < n; s++) {
      angle += omega * h;
      const walls = bubbles.filter(solid).map((o) => [o, ...pos(o)]);
      for (const b of loose) {
        const d = Math.hypot(b.x, b.y) || 1e-6, ix = -b.x / d, iy = -b.y / d;
        if (b.gx !== undefined && b.gx * ix + b.gy * iy < COS30) { b.vx = 0; b.vy = 0; }
        b.gx = ix; b.gy = iy;
        b.vx += ix * G * h; b.vy += iy * G * h;
        if (!b.accel) { const k = 1 / (1 + damp(d) * h); b.vx *= k; b.vy *= k; }
        b.x += b.vx * h; b.y += b.vy * h;
        for (const [o, ox, oy] of walls) collide(b, ox, oy, o);
      }
      for (let i = 0; i < loose.length; i++) for (let j = i + 1; j < loose.length; j++) {
        const a = loose[i], b = loose[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d >= 2 * BR || d === 0) continue;
        const k = (2 * BR - d) / 2 / d;
        a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k;
        a.touch = a.touch || b; b.touch = b.touch || a;
      }
    }
  }

  function looseLogic(b, dt) {
    const d = Math.hypot(b.x, b.y);
    if (b.touch && !b.collided) {
      b.collided = true;
      if (b.kind === 'rainbow' && b.c === NONE) b.c = b.touch.c !== NONE ? b.touch.c : Math.floor(R() * 4);
    }
    if (!board[0] && d < BR) {               // an empty centre takes a bubble at once
      settle(b, 0);
      return;
    }
    if (b.joined) {
      const inward = -(b.vx * b.x + b.vy * b.y) / (d || 1);
      if (Math.abs(inward) < 8 && (b.snapT -= dt) <= 0) settle(b, chooseCell(b));
      return;
    }
    if (!b.collided) return;
    const touching = !!b.touch;
    if (b.joinT > 0) {
      if ((b.joinT -= dt) <= 0 && d < IN) { b.joined = true; b.snapT = SNAP_FIRST; }
      return;
    }
    if (b.coyT > 0) {
      if (touching && popGroup(b).length) return edgePop(b);
      if (touching && d < IN) { b.coyT = 0; b.joinT = JOIN; return; }
      if ((b.coyT -= dt) <= 0) {
        if (touching && d >= IN && d <= OUT) fail(b);
        else b.coyT = 0;
      }
      return;
    }
    if (b.popT > 0) {
      if ((b.popT -= dt) <= 0) popGroup(b).length ? edgePop(b) : coyote(b);
      return;
    }
    if (!touching) return;
    if (d < IN) b.joinT = JOIN;
    else if (d <= OUT) popGroup(b).length ? (b.popT = POP_DELAY) : coyote(b);
  }
  function edgePop(b) {
    const g = popGroup(b);
    popChain(g, toLocal(b.x, b.y), b);
  }

  // A snapped bubble with nothing beneath it, toward the centre, drops back in.
  function support() {
    if (board[0] && board[0].st === 'pop') return;
    for (let i = 1; i < cells.length; i++) {
      const b = board[i];
      if (!b || b.st !== 'snap' || cells[i].inward.some((j) => board[j])) continue;
      board[i] = null;
      const [x, y] = pos(b);
      Object.assign(b, { st: 'fall', x, y, vx: 0, vy: 0, cell: null, joined: true, collided: true, snapT: SNAP_LATER, gx: undefined });
    }
  }

  // While a combo runs, a centre chain that reaches past the Combo Ring pops by
  // itself, and takes the centre with it: another combo.
  function comboAuto() {
    if (!nCombos || frenzy || !board[0] || board[0].st !== 'snap' || board[0].c === NONE) return;
    const chain = [...flood(board[0])];
    const out = chain.filter((o) => cells[o.cell].d > COMBO_R1);
    if (!out.length) return;
    const far = out.reduce((a, o) => (cells[o.cell].d > cells[a.cell].d ? o : a));
    popChain(chain, [far.lx, far.ly], null);
  }

  // An empty centre pulls a same-colour chain one cell inward: the first-ring
  // bubble with the biggest group moves in, and its chain follows it outward.
  // (The original's pathfinder for this mixes up its search loop.)
  function refillCentre() {
    if (board[0] || bubbles.some((b) => b.st === 'fall' && b.joined)) return;
    const first = cells[0].nb.map((n) => board[n]).filter((b) => b && b.st === 'snap' && b.c !== NONE);
    if (!first.length) return;
    const start = first.reduce((a, b) => (flood(b).size > flood(a).size ? b : a));
    const path = [start];
    for (let cur = start; ;) {
      const ring = cells[cur.cell].ring + 1;
      const next = cells[cur.cell].nb.map((n) => board[n])
        .find((o) => o && o.st === 'snap' && o.c === start.c && cells[o.cell].ring === ring);
      if (!next) break;
      path.push(next); cur = next;
    }
    let to = 0;
    for (const b of path) {
      const from = b.cell;
      board[from] = null;
      Object.assign(b, { st: 'slide', cell: to, fx: b.lx, fy: b.ly, t: 0 });
      board[to] = b;
      to = from;
    }
  }

  // Every bubble left sits inside the Mania ring (the centre and its six).
  function maniaReady() {
    if (mania || (frenzy && frenzy.n < FRENZY_N) || !startingPopped) return false;
    const held = board.filter(Boolean);
    if (!held.length || held.some((b) => b.st !== 'snap' || cells[b.cell].d > MANIA_R + BR)) return false;
    return !bubbles.some((b) => b.st === 'fall' && b.joined);
  }

  function pluck(a, f) {
    const i0 = Math.round(((a % TAU) + TAU) % TAU / TAU * RIM_N);
    for (let k = -3; k <= 3; k++) rimV[(i0 + k + RIM_N) % RIM_N] += f * (1 - Math.abs(k) / 4);
  }

  // --- update ------------------------------------------------------------------------------
  function update(rdt) {
    clock += rdt;
    while (notes.length && clock >= notes[0].at) beep(notes.shift().f, .07);
    if (phase === 'pick') return;
    const dt = rdt * (dying ? .5 : 1);
    gt += dt;
    grav = 100 + 5 * Math.floor(gt / 30);

    // Each direction speeds up at 650°/s² to a cap that grows with the speed
    // of the bubbles, and spins down the same way. Holding both cancels out.
    const cap = CAP0 + (CAP1 - CAP0) * Math.min(1, (grav - 100) / 50);
    const L = keys.ArrowLeft || touchSide === -1, Rt = keys.ArrowRight || touchSide === 1;
    vl = L ? Math.min(cap, vl + ACCEL * dt) : Math.max(0, vl - ACCEL * dt);
    vr = Rt ? Math.min(cap, vr + ACCEL * dt) : Math.max(0, vr - ACCEL * dt);
    omega = dying ? 0 : (vr - vl) * Math.PI / 180;

    if (dying) {
      for (const b of bubbles) { b.x += b.vx * dt; b.y += b.vy * dt; }
      if ((dying += rdt) > 1.1 && !isOver()) gameOver();
    } else {
      if (!startPick && gt > 3) { startPick = true; openPick(); return; }
      spawner(dt);
      for (const b of bubbles) if (b.st === 'warn' && (b.warnT -= dt) <= 0) b.st = 'fall';
      physics(dt);
      for (const b of bubbles) if (b.st === 'fall') looseLogic(b, dt);
      for (const b of bubbles) {
        if (b.st === 'slide') {
          const k = Math.min(1, (b.t += dt) / SLIDE), e = 1 - (1 - k) ** 3, c = cells[b.cell];
          b.lx = b.fx + (c.x - b.fx) * e; b.ly = b.fy + (c.y - b.fy) * e;
          if (k >= 1) onSnap(b);
        } else if (b.st === 'pop') {
          const was = b.t;
          b.t += dt;
          if (was < SHAKE_T && b.t >= SHAKE_T) burst(b);
          if (b.t >= SHAKE_T + POP_T) { if (b.cell !== null && board[b.cell] === b) board[b.cell] = null; b.st = 'gone'; }
        } else if (b.st === 'snap' && b.paintT > 0 && (b.paintT -= dt) <= 0) {
          for (const n of cells[b.cell].nb) {
            const o = board[n];
            if (o && o.st === 'snap' && o.c >= 0 && o.c < WHITE && o.c !== b.c) { o.c = b.c; o.flash = .35; }
          }
          b.kind = 'color';
          beep(740, .05);
        }
        if (b.flash > 0) b.flash -= dt;
        if (b.bump > 0) b.bump = Math.max(0, b.bump - dt);
        if (b.st === 'fall' && Math.hypot(b.x, b.y) > SPAWN_R + 60) b.st = 'gone';
      }
      bubbles = bubbles.filter((b) => b.st !== 'gone');
      support();

      const popping = bubbles.some((b) => b.st === 'pop');
      if (!popping) {
        refillCentre();
        comboAuto();
        if (popsFresh && !bubbles.some((b) => b.st === 'pop')) {
          popsFresh = false;
          if (!board.some(Boolean) && !bubbles.some((b) => b.st === 'fall' && b.joined)) startMulti();
        }
        if (maniaReady()) startMania();
        if (score >= nextEnc) { encounters.push(encN++ % 2 ? BLACK : WHITE); nextEnc += 50000; }
        if (popped >= levelAt(level) && phase === 'play') { level++; say(`level ${level}`, 1.4); openPick(); }
      }
      if (multi && (multi.left -= dt) <= 0) endMulti();
    }

    comboR += ((nCombos ? COMBO_R1 : COMBO_R0) - comboR) * Math.min(1, dt * 6);

    // Soft rim: radial springs at 7 Hz, coupled to their neighbours.
    const k = (TAU * 7) ** 2;
    for (let i = 0; i < RIM_N; i++) {
      const lap = rim[(i + 1) % RIM_N] + rim[(i - 1 + RIM_N) % RIM_N] - 2 * rim[i];
      rimV[i] += (-k * rim[i] - 9 * rimV[i] + 600 * lap) * rdt;
    }
    for (let i = 0; i < RIM_N; i++) rim[i] = Math.max(-6, Math.min(6, rim[i] + rimV[i] * rdt));

    // Camera: Frenzy zooms in, coyote time leans toward the culprit, the
    // Multibubble flash pulls in close.
    const culprit = bubbles.find((b) => b.coyT > 0);
    let tz = frenzy ? 1.2 : 1, tx = 0, ty = 0;
    if (culprit) { tz = 1.1; tx = culprit.x / 2; ty = culprit.y / 2; }
    if (flash && flash.t < 1) tz = 1.3;
    const ck = Math.min(1, rdt * 5);
    cam.zoom += (tz - cam.zoom) * ck; cam.x += (tx - cam.x) * ck; cam.y += (ty - cam.y) * ck;
    for (const s of shakes) s.t += rdt;
    shakes = shakes.filter((s) => s.t < s.dur);
    if (flash && (flash.t += rdt) > 1.6) flash = null;
    if (clearFx && (clearFx.t += rdt) > 1) clearFx = null;
    for (const f of floats) f.t += rdt;
    floats = floats.filter((f) => f.t < 1);
    for (const p of parts) { p.t += rdt; p.x += p.vx * rdt; p.y += p.vy * rdt; p.vx *= .92; p.vy *= .92; }
    parts = parts.filter((p) => p.t < .5);
    if (banner && (banner.t -= rdt) <= 0) banner = null;
    for (const b of bubbles) {
      if (b.st === 'fall' && !b.collided) { b.trail.unshift([b.x, b.y]); b.trail.length = Math.min(b.trail.length, 5); }
      else b.trail.length = 0;
    }
  }

  function burst(b) {
    const [x, y] = pos(b), col = b.c === NONE ? T.muted : FILL[b.c];
    for (let i = 0; i < 7; i++) {
      const a = R() * TAU, sp = 30 + R() * 40;
      parts.push({ x: x + Math.cos(a) * BR, y: y + Math.sin(a) * BR, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, c: col, s: .6 + R() * .8 });
    }
    beep(560 + Math.min(b.pi || 0, 14) * 45, .03);
  }

  // --- drawing -----------------------------------------------------------------------------
  // Where a bubble in a lane will land, given the grid as it is right now.
  function landing(b) {
    const dx = Math.cos(b.a), dy = Math.sin(b.a);
    let best = 0;
    for (const o of bubbles) {
      if (!solid(o)) continue;
      const [ox, oy] = pos(o), along = ox * dx + oy * dy, px = ox - dx * along, py = oy - dy * along, perp2 = px * px + py * py;
      if (perp2 < 4 * BR * BR) best = Math.max(best, along + Math.sqrt(4 * BR * BR - perp2));
    }
    const lx = dx * best, ly = dy * best;
    let danger = false;
    if (best >= IN && !b.fragile && b.kind !== 'bomb' && b.kind !== 'rainbow') {
      danger = !bubbles.some((o) => o.st === 'snap' && o.c === b.c && Math.hypot(pos(o)[0] - lx, pos(o)[1] - ly) < TOUCH);
    }
    return { x: lx, y: ly, danger };
  }

  function drawBubble(x, y, b, s = 1, a = 1) {
    const rr = BR * s * .96, c = b.c;
    ctx.globalAlpha = a * (b.fragile ? .6 : 1);
    ctx.fillStyle = c === NONE ? T.surface : FILL[c];
    ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
    if (b.kind === 'rainbow') {
      const spin = clock * 3;
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = PALETTE[i]; ctx.lineWidth = c === NONE ? rr * .9 : .8;
        ctx.beginPath(); ctx.arc(x, y, c === NONE ? rr * .55 : rr - .4, spin + i * TAU / 4, spin + (i + 1) * TAU / 4); ctx.stroke();
      }
    }
    ctx.lineWidth = .45;
    ctx.strokeStyle = c === WHITE ? '#2a2630' : 'rgba(0,0,0,.2)';
    ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.stroke();
    ctx.fillStyle = c === BLACK ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(x - rr * .35, y - rr * .42, rr * .32, rr * .18, -.6, 0, TAU); ctx.fill();
    if (b.kind === 'bomb') {
      ctx.fillStyle = '#1d1a22';
      ctx.beginPath(); ctx.arc(x, y + rr * .08, rr * .42, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#1d1a22'; ctx.lineWidth = .6;
      ctx.beginPath(); ctx.moveTo(x + rr * .2, y - rr * .25); ctx.lineTo(x + rr * .45, y - rr * .55); ctx.stroke();
      ctx.fillStyle = '#fbfaf7'; ctx.fillRect(x + rr * .42, y - rr * .66, .8, .8);
    } else if (b.kind === 'multi') {
      ctx.fillStyle = '#1d1a22'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = font(rr * .95, '700 '); ctx.fillText('×2', x, y + .3);
      ctx.textBaseline = 'alphabetic';
    } else if (b.kind === 'paint') {
      ctx.fillStyle = '#fbfaf7';
      ctx.beginPath(); ctx.arc(x, y + rr * .15, rr * .3, 0, Math.PI); ctx.lineTo(x, y - rr * .45); ctx.closePath(); ctx.fill();
    }
    if (b.flash > 0) {
      ctx.globalAlpha = b.flash / .35; ctx.strokeStyle = '#fbfaf7'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, rr + 1, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function hexPath(x, y, s) {
    ctx.moveTo(x, y - s);
    for (let k = 1; k < 6; k++) ctx.lineTo(x + Math.sin(k * Math.PI / 3) * s, y - Math.cos(k * Math.PI / 3) * s);
    ctx.closePath();
  }

  function draw() {
    clear(ctx, W, H, T);
    const Z = S * cam.zoom;
    let shx = 0, shy = 0;
    const amp = shakes.reduce((a, s) => a + (s.t > 0 ? s.amp * (1 - s.t / s.dur) : 0), frenzy ? 1 : 0)
      + (bubbles.some((b) => b.coyT > 0) ? .8 : 0);
    if (amp) { shx = (R() - .5) * 2 * amp * Z * .5; shy = (R() - .5) * 2 * amp * Z * .5; }
    ctx.setTransform(Z, 0, 0, Z, W / 2 - cam.x * Z + shx, H / 2 - cam.y * Z + shy);
    const px = 1 / Z;

    // The Main Bubble: a soft rim round a faint field.
    const rimPath = () => {
      ctx.beginPath();
      for (let i = 0; i <= RIM_N; i++) {
        const a = i / RIM_N * TAU, rr = MB + rim[i % RIM_N] * .5;
        i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
    };
    rimPath(); ctx.fillStyle = T.accentSoft; ctx.fill();

    // Hex cells, tinted where a warned bubble will land, and the Multibubble flash.
    const ghosts = bubbles.filter((b) => b.st === 'warn' || (b.st === 'fall' && !b.collided && b.lane !== undefined)).map((b) => ({ b, ...landing(b) }));
    ctx.save(); ctx.rotate(angle);
    for (const c of cells) {
      ctx.beginPath(); hexPath(c.x, c.y, CELL / Math.sqrt(3) - .4);
      for (const g of ghosts) {
        const [gx, gy] = toLocal(g.x, g.y), d = Math.hypot(c.x - gx, c.y - gy) / (2 * BR);
        if (d < 1 && g.b.c !== NONE) { const s = d * d * d * (d * (d * 6 - 15) + 10); ctx.fillStyle = rgba(FILL[g.b.c], .35 * (1 - s)); ctx.fill(); }
      }
      if (flash) {
        const k = (flash.t - c.ring * .1) / .8;
        if (k > 0 && k < 1) { ctx.fillStyle = rgba('#ffffff', .8 * (k < .77 ? k / .77 : (1 - k) / .23)); ctx.fill(); }
      }
      ctx.strokeStyle = T.line; ctx.lineWidth = px; ctx.stroke();
    }
    ctx.restore();

    // Combo ring with a notch per bubble left, and the Mania ring, both in the
    // centre bubble's colour.
    const cc = board[0] && board[0].c !== NONE ? FILL[board[0].c] : T.muted;
    ctx.strokeStyle = cc; ctx.lineWidth = 1.5 * px;
    ctx.globalAlpha = nCombos ? .9 : .35;
    ctx.beginPath(); ctx.arc(0, 0, comboR, 0, TAU); ctx.stroke();
    if (nCombos) {
      ctx.globalAlpha = .12; ctx.fillStyle = cc;
      ctx.beginPath(); ctx.arc(0, 0, COMBO_R0 + (COMBO_R1 - COMBO_R0) * comboLeft / COMBO_N, 0, TAU); ctx.fill();
      ctx.globalAlpha = .35;
      for (let i = 1; i < COMBO_N; i++) { ctx.beginPath(); ctx.arc(0, 0, COMBO_R0 + (COMBO_R1 - COMBO_R0) * i / COMBO_N, 0, TAU); ctx.stroke(); }
    }
    ctx.globalAlpha = mania ? .9 : .3; ctx.setLineDash([2, 2]); ctx.lineWidth = (mania ? 2 : 1) * px;
    ctx.beginPath(); ctx.arc(0, 0, MANIA_R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Warning beams and landing ghosts.
    for (const g of ghosts) {
      const b = g.b, col = b.c === NONE ? T.muted : FILL[b.c];
      if (b.st === 'warn') {
        ctx.strokeStyle = rgba(b.c === NONE ? '#888888' : FILL[b.c], .35); ctx.lineWidth = 2.2 * px;
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(g.x, g.y); ctx.stroke();
      }
      ctx.globalAlpha = .4; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(g.x, g.y, BR * .685, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      if (g.danger && Math.floor(clock * 6) % 2) {
        ctx.fillStyle = T.ink; ctx.textAlign = 'center'; ctx.font = font(8, '700 ');
        ctx.fillText('!', g.x, g.y + 3);
      }
    }

    // Bubbles: ghost trails behind fast ones, a shake and a burst for pops.
    for (const b of bubbles) {
      const [x, y] = pos(b);
      for (let i = 1; i < b.trail.length; i++) drawBubble(b.trail[i][0], b.trail[i][1], b, 1 - i * .1, .25 - i * .04);
      if (b.st === 'pop') {
        if (b.t < SHAKE_T) {
          const j = b.t > 0 ? .7 : 0;
          drawBubble(x + (R() - .5) * j, y + (R() - .5) * j, b);
        } else {
          const k = (b.t - SHAKE_T) / POP_T;
          ctx.globalAlpha = 1 - k; ctx.strokeStyle = b.c === NONE ? T.muted : FILL[b.c]; ctx.lineWidth = 1.2 * (1 - k);
          ctx.beginPath(); ctx.arc(x, y, BR * (1 + .5 * k), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
        }
        continue;
      }
      drawBubble(x, y, b, 1 + (b.bump || 0) * .6);
      if (b.coyT > 0 && Math.floor(clock * 8) % 2) {
        ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5 * px;
        ctx.beginPath(); ctx.arc(x, y, BR + 2, 0, TAU); ctx.stroke();
        ctx.fillStyle = T.ink; ctx.textAlign = 'center'; ctx.font = font(9, '700 ');
        ctx.fillText('!', x, y - BR - 3);
      }
    }

    // Chain lines: a hub on each bubble and a link between same-colour neighbours.
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (const c of cells) {
      const b = board[c.i];
      if (!b || b.st !== 'snap' || b.c === NONE) continue;
      const [x, y] = pos(b);
      let linked = false;
      for (const n of c.nb) {
        const o = board[n];
        if (!o || o.st !== 'snap' || o.c !== b.c) continue;
        linked = true;
        if (n < c.i) continue;
        const [ox, oy] = pos(o);
        ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ox, oy); ctx.stroke();
      }
      if (linked) { ctx.beginPath(); ctx.arc(x, y, .9, 0, TAU); ctx.fill(); }
    }

    // The rim on top, glowing while anything makes the Main Bubble invincible.
    if (invincible()) {
      ctx.globalAlpha = .25 + .15 * Math.sin(clock * 5);
      rimPath(); ctx.strokeStyle = T.accent; ctx.lineWidth = 5; ctx.stroke(); ctx.globalAlpha = 1;
    }
    rimPath(); ctx.strokeStyle = T.ink; ctx.lineWidth = 1.6 * px; ctx.stroke();
    if (clearFx) {
      ctx.globalAlpha = 1 - clearFx.t; ctx.strokeStyle = T.accent; ctx.lineWidth = 3 * px;
      ctx.beginPath(); ctx.arc(0, 0, MB + clearFx.t * 140, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    }
    for (const p of parts) {
      ctx.globalAlpha = 1 - p.t / .5; ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // --- screen space ---
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const scr = (x, y) => [W / 2 + (x - cam.x) * Z, H / 2 + (y - cam.y) * Z];
    // Incoming bubbles off screen glow at the edge they will come from.
    for (const b of bubbles) {
      if (!(b.st === 'warn' || (b.st === 'fall' && !b.collided)) || b.c === NONE && b.kind !== 'rainbow') continue;
      const [sx, sy] = scr(b.x, b.y);
      if (sx > 0 && sx < W && sy > 0 && sy < H) continue;
      const dx = sx - W / 2, dy = sy - H / 2, k = Math.min(Math.abs((W / 2) / (dx || 1e-6)), Math.abs((H / 2) / (dy || 1e-6)));
      const ex = W / 2 + dx * k, ey = H / 2 + dy * k, col = b.c === NONE ? '#999999' : FILL[b.c];
      const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 46);
      g.addColorStop(0, rgba(col, .55)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.fillRect(ex - 46, ey - 46, 92, 92);
    }
    ctx.textAlign = 'center';
    for (const f of floats) {
      const [x, y] = scr(f.x, f.y);
      ctx.globalAlpha = 1 - f.t; ctx.fillStyle = f.big ? T.ink : T.muted;
      ctx.font = font(f.big ? 13 : 10, f.big ? '700 ' : '');
      ctx.fillText(f.text, x, y - f.t * 24);
    }
    ctx.globalAlpha = 1;
    hud();
    if (phase === 'pick') drawPick();
  }

  function hud() {
    ctx.textAlign = 'left'; ctx.font = font(11); ctx.fillStyle = T.muted;
    ctx.fillText(`level ${level}`, 12, 20);
    const lo = level > 1 ? levelAt(level - 1) : 0, need = levelAt(level) - lo;
    ctx.fillStyle = T.line; ctx.fillRect(12, 26, 90, 4);
    ctx.fillStyle = T.accent; ctx.fillRect(12, 26, 90 * Math.min(1, (popped - lo) / need), 4);
    let y = 48;
    if (nCombos) {
      ctx.fillStyle = T.ink; ctx.font = font(12, '700 '); ctx.fillText(`combo ×${comboBonus}`, 12, y);
      for (let i = 0; i < COMBO_N; i++) {
        ctx.fillStyle = i < comboLeft ? T.accent : T.line;
        ctx.beginPath(); ctx.arc(16 + i * 11, y + 10, 3.5, 0, TAU); ctx.fill();
      }
      y += 30;
    }
    ctx.textAlign = 'right'; ctx.font = font(11); y = 20;
    const line = (t, c = T.muted) => { ctx.fillStyle = c; ctx.fillText(t, W - 12, y); y += 16; };
    if (multi) line(`multibubble ×${stacks + 1}  ${Math.floor(multi.left / 60)}:${String(Math.floor(multi.left % 60)).padStart(2, '0')}`, T.accent);
    if (mania) line(`bubble mania ${Math.min(MANIA_STOP, mania.start + mania.n)}/${MANIA_STOP}`, T.accent);
    if (frenzy) line(`frenzy ${frenzy.n}/${FRENZY_N}`, T.accent);
    if (shield) line('◈ shield', T.ink);
    if (queued.length) line(`next: ${queued[0] === 'multi' ? '×2' : queued[0]}`);
    if (gt < 6 && phase === 'play') {
      ctx.textAlign = 'center'; ctx.fillStyle = T.muted;
      ctx.fillText('match colours at the rim · ← → rotate · ↓ hurry', W / 2, H - 14);
    }
    if (banner) {
      ctx.globalAlpha = Math.min(1, banner.t / .3, (banner.t0 - banner.t) / .12 + .2);
      ctx.textAlign = 'center'; ctx.font = font(20, '700 ');
      ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = T.bg;
      ctx.strokeText(banner.text.toUpperCase(), W / 2, 60);
      ctx.fillStyle = T.ink; ctx.fillText(banner.text.toUpperCase(), W / 2, 60);
      ctx.globalAlpha = 1;
    }
  }

  const CW = 150, CH = 104, GAP = 14;
  const cardX = (i) => W / 2 - (3 * CW + 2 * GAP) / 2 + i * (CW + GAP);
  const CY = H / 2 - CH / 2 + 10;
  function drawPick() {
    ctx.fillStyle = T.overlay; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.fillStyle = T.ink; ctx.font = font(15, '700 ');
    ctx.fillText(level === 1 ? 'BUBBLE UP! — PICK A POWERUP' : `LEVEL ${level} — PICK A POWERUP`, W / 2, CY - 22);
    cards.forEach((p, i) => {
      const x = cardX(i);
      ctx.fillStyle = T.surface; ctx.fillRect(x, CY, CW, CH);
      ctx.strokeStyle = i === sel ? T.accent : T.line; ctx.lineWidth = i === sel ? 2 : 1;
      ctx.strokeRect(x + .5, CY + .5, CW - 1, CH - 1);
      ctx.fillStyle = i === sel ? T.accent : T.ink; ctx.font = font(13, '700 ');
      ctx.fillText(p.name, x + CW / 2, CY + 34);
      ctx.fillStyle = T.muted; ctx.font = font(10);
      p.desc.forEach((t, k) => ctx.fillText(t, x + CW / 2, CY + 58 + k * 14));
      ctx.fillText(String(i + 1), x + CW / 2, CY + CH - 8);
    });
    ctx.fillStyle = T.muted; ctx.font = font(11);
    ctx.fillText('← → choose · space to take · or click', W / 2, CY + CH + 24);
  }

  return {
    key(k, down) {
      if (phase === 'pick' && down && !keys[k]) {
        if (k === 'ArrowLeft') sel = (sel + 2) % 3;
        else if (k === 'ArrowRight') sel = (sel + 1) % 3;
        else if (k === ' ' || k === 'Enter' || k === 'ArrowUp') choose(sel);
        else if (k >= '1' && k <= '3') choose(+k - 1);
      }
      keys[k] = down;
    },
    // Touch or click: hold the left third to turn left, the right third to turn
    // right, the middle to hurry the bubbles in.
    pointer(x, y, type) {
      if (phase === 'pick') {
        if (type === 'down') for (let i = 0; i < 3; i++) if (x >= cardX(i) && x <= cardX(i) + CW && y >= CY && y <= CY + CH) choose(i);
        return;
      }
      if (type === 'down') touchSide = x < W / 3 ? -1 : x > W * 2 / 3 ? 1 : 2;
      else if (type === 'up') touchSide = 0;
    },
    tick(dt) { update(dt); draw(); },
  };
}

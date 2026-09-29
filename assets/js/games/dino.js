// games/dino.js — Dino Run.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
// Chrome's offline T-Rex game, rule for rule. The numbers are Chromium's
// offline.js constants, counted in 60 fps frames: speed 6 → 13, gravity .6, the
// obstacle gap formula, pterodactyls from speed 8.5, a chime every 100 and
// night every 700. Sprites are bitmaps in this file, painted in the theme's
// colours: the rex in ink, obstacles in accent, the world in muted.
import { R, clear } from './common.js';

const P = 2;                                    // one bitmap pixel = 2 canvas px

const REX_TOP = [
  '...........########.',
  '..........##.#######',
  '..........##########',
  '..........##########',
  '..........##########',
  '..........#####.....',
  '..........########..',
  '#........#####......',
  '#.......#######.....',
  '##.....#########....',
  '###..#############..',
  '###############..#..',
  '.#############......',
  '..###########.......',
  '...#########........',
  '....#######.........',
];
const REX_LEGS = {
  stand: ['.....###.##.........', '.....##...#.........', '.....#....#.........', '.....##...##........'],
  runA:  ['.....###.##.........', '......##..#.........', '..........#.........', '..........##........'],
  runB:  ['.....###.##.........', '.....##...##........', '.....#..............', '.....##.............'],
};
const DUCK_TOP = [
  '#...................########',
  '##......#############.######',
  '###..#######################',
  '.###########################',
  '..##########################',
  '...######################...',
  '....################........',
  '.....###########..##........',
  '......########..............',
];
const DUCK_LEGS = {
  a: ['......###..##...............', '......##....#...............', '......#.....##..............'],
  b: ['......###..##...............', '.......##..#................', '...........##...............'],
};
const CACTUS_S = [
  '...##...',
  '..####..',
  '..####..',
  '..####.#',
  '#.####.#',
  '#.####.#',
  '#.####.#',
  '#.######',
  '#.#####.',
  '#.####..',
  '######..',
  '.#####..',
  '..####..',
  '..####..',
  '..####..',
  '..####..',
  '..####..',
];
const CACTUS_L = [
  '.....##.....',
  '....####....',
  '....####....',
  '....####....',
  '....####..#.',
  '.#..####.###',
  '###.####.###',
  '###.####.###',
  '###.####.###',
  '###.####.###',
  '###.####.###',
  '###.########',
  '###.#######.',
  '########....',
  '.#######....',
  '....####....',
  '....####....',
  '....####....',
  '....####....',
  '....####....',
  '....####....',
  '....####....',
  '....####....',
  '....####....',
  '....####....',
];
const PTERO_BODY = [
  '.#################.....',
  '#####################..',
  '......################.',
  '........##########.....',
];
const PTERO_UP = [
  '.......#...............',
  '.......##..............',
  '.......###.............',
  '....#..####............',
  '...##..#####...........',
  '..###..######..........',
  ...PTERO_BODY,
  '.......................',
  '.......................',
  '.......................',
  '.......................',
  '.......................',
  '.......................',
];
const PTERO_DOWN = [
  '.......................',
  '.......................',
  '.......................',
  '....#..................',
  '...##..................',
  '..###..................',
  ...PTERO_BODY,
  '........######.........',
  '........#####..........',
  '........####...........',
  '........###............',
  '........##.............',
  '........#..............',
];
const CLOUD = [
  '.........######........',
  '.......##......##......',
  '.....##..........#.....',
  '..###.............###..',
  '.#...................#.',
  '#.....................#',
  '#######################',
];

// A bitmap becomes a list of horizontal runs [x, y, w], in bitmap pixels.
function sprite(rows) {
  const r = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      if (row[x] !== '#') { x++; continue; }
      const s = x;
      while (row[x] === '#') x++;
      r.push([s, y, x - s]);
    }
  });
  return { r, w: rows[0].length * P, h: rows.length * P };
}
const withEye = (rows, eye) => rows.map((row, y) => eye[y] ? row.slice(0, 12) + eye[y] + row.slice(12 + eye[y].length) : row);

const REX = {
  stand: sprite([...REX_TOP, ...REX_LEGS.stand]),
  blink: sprite([...withEye(REX_TOP, { 1: '#' }), ...REX_LEGS.stand]),
  runA: sprite([...REX_TOP, ...REX_LEGS.runA]),
  runB: sprite([...REX_TOP, ...REX_LEGS.runB]),
  dead: sprite([...withEye(REX_TOP, { 0: '.', 1: '..', 2: '..' }), ...REX_LEGS.stand]),
  duckA: sprite([...DUCK_TOP, ...DUCK_LEGS.a]),
  duckB: sprite([...DUCK_TOP, ...DUCK_LEGS.b]),
};
const PTERO = [sprite(PTERO_UP), sprite(PTERO_DOWN)];
const CLOUD_S = sprite(CLOUD);

// Colours arrive as custom-property strings; night mode fades between two of
// them, so parse #rgb, #rrggbb and rgb()/rgba(). Anything else snaps instead.
function rgb(c) {
  if (typeof c !== 'string') return null;
  c = c.trim();
  let m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.replace(/./g, (d) => d + d);
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  m = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  return m ? [+m[1], +m[2], +m[3]] : null;
}
function mix(a, b, k) {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const x = rgb(a), y = rgb(b);
  if (!x || !y) return k < .5 ? a : b;
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
}

export default function dino(env) {
  const { ctx, W, H, T, beep, addScore, gameOver, isOver } = env;
  const GROUND = H - 10;                        // where the rex's feet land
  const LINE = GROUND - 4;                      // horizon line: feet overlap it
  const REX_X = 50;
  const STAND_Y = GROUND - REX.stand.h;
  const DUCK_Y = GROUND - REX.duckA.h;

  // Chromium offline.js, per 60 fps frame.
  const SPEED0 = 6, MAX_SPEED = 13, ACCEL = .001;
  const GRAVITY = .6, JUMP_V = -10, DROP_V = -5, MIN_JUMP = 30, DROP_K = 3;
  const MAX_JUMP_Y = STAND_Y - 63;             // Chrome: y 30 with its rex standing at 93
  const CLEAR_TIME = 3, GAP_K = .6, MAX_GAP_K = 1.5, MAX_DUP = 2;
  const MILESTONE = 100, INVERT_AT = 700, NIGHT_LEN = 12, FADE = 1;

  const TYPES = [
    { id: 'small', sp: sprite(CACTUS_S), multi: 4, minGap: 120, minSpeed: 0 },
    { id: 'large', sp: sprite(CACTUS_L), multi: 7, minGap: 120, minSpeed: 0 },
    { id: 'ptero', sp: PTERO[0], multi: 99, minGap: 150, minSpeed: 8.5, ys: [GROUND - 40, GROUND - 58, GROUND - 90] },
  ];


  let started = false, crashed = false, crashT = 0;
  let y = STAND_Y, vy = 0, jumping = false, reachedMin = false, speedDrop = false;
  let duckHeld = false;
  let speed = SPEED0, runT = 0, dist = 0, score = 0, animT = 0;
  let obstacles = [], history = [], clouds = [], stars = [];
  let nightT = 0, nextInvert = INVERT_AT, blinkAt = 3;

  // The ground is one random 2400 px strip, scrolled and tiled.
  const STRIP = 2400, bumps = [], pebbles = [];
  for (let x = 40; x < STRIP - 40; x += 60 + R() * 260) bumps.push({ x: Math.round(x), w: 6 + Math.round(R() * 8) });
  for (let x = 0; x < STRIP; x += 8 + R() * 40) pebbles.push({ x: Math.round(x), y: 3 + Math.round(R() * 5), w: 1 + Math.round(R() * 2) });
  let gx = 0;

  const addCloud = (x) => clouds.push({ x, y: 18 + R() * (H * .3), gap: 100 + R() * 300 });
  addCloud(W * .8);                             // clear of the start prompt

  function startJump() {
    if (jumping || crashed) return;
    if (!started) { started = true; }
    jumping = true; reachedMin = false; speedDrop = false;
    vy = JUMP_V - speed / 10;
    beep(660, .04);
  }
  function endJump() {
    if (reachedMin && vy < DROP_V) vy = DROP_V;
  }
  function input(k, down) {
    if (isOver() || crashed) return;
    if (k === ' ' || k === 'ArrowUp') {
      if (down) startJump();                    // key repeat re-jumps, as in Chrome
      if (!down && jumping) endJump();
    } else if (k === 'ArrowDown') {
      duckHeld = down;
      if (down && jumping) speedDrop = true;
      if (!down) speedDrop = false;
    }
  }

  function spawn() {
    const pool = TYPES.filter((t) => speed >= t.minSpeed
      && !(history.length >= MAX_DUP && history.slice(-MAX_DUP).every((h) => h === t.id)));
    const t = pool[Math.floor(R() * pool.length)];
    const n = t.id === 'ptero' ? 1 : (speed > t.multi ? 1 + Math.floor(R() * 3) : 1);
    const w = t.sp.w * n;
    const minGap = Math.round(w * speed + t.minGap * GAP_K);
    const gap = minGap + R() * (minGap * MAX_GAP_K - minGap);
    obstacles.push({
      t, n, w, gap, x: W, frame: 0,
      y: t.ys ? t.ys[Math.floor(R() * t.ys.length)] : GROUND - t.sp.h,
      drift: t.id === 'ptero' ? (R() < .5 ? -.8 : .8) : 0,
    });
    history.push(t.id);
    if (history.length > MAX_DUP) history.shift();
  }

  // Pixel-true collision: bounding boxes first, then the runs themselves,
  // shaved by a pixel so a graze isn't a death.
  function hits(a, ax, ay, o) {
    if (ax + a.w <= o.x || ax >= o.x + o.w || ay + a.h <= o.y || ay >= o.y + o.t.sp.h) return false;
    const b = o.t.id === 'ptero' ? PTERO[o.frame] : o.t.sp;
    for (let i = 0; i < o.n; i++) {
      const bx = o.x + i * b.w;
      for (const [x1, y1, w1] of a.r) {
        const l1 = ax + x1 * P + 1, r1 = ax + (x1 + w1) * P - 1, t1 = ay + y1 * P, d1 = t1 + P;
        for (const [x2, y2, w2] of b.r) {
          const l2 = bx + x2 * P, t2 = o.y + y2 * P;
          if (l1 < l2 + w2 * P && r1 > l2 && t1 < t2 + P && d1 > t2) return true;
        }
      }
    }
    return false;
  }

  function rexSprite() {
    if (crashed) return REX.dead;
    if (!started) return animT % blinkAt > blinkAt - .15 ? REX.blink : REX.stand;
    const alt = Math.floor(runT * 12) % 2;      // 12 fps leg cycle, as Chrome
    if (duckHeld && !jumping) return alt ? REX.duckB : REX.duckA;
    if (jumping) return REX.stand;
    return alt ? REX.runB : REX.runA;
  }

  function update(dt) {
    const f = dt * 60;
    animT += dt;
    if (crashed) {
      crashT += dt;
      // A beat to see what hit you before the runner's GAME OVER takes keys.
      if (crashT > .4 && !isOver()) gameOver();
      return;
    }
    if (!started) return;
    runT += dt;

    if (jumping) {
      y += vy * (speedDrop ? DROP_K : 1) * f;
      vy += GRAVITY * f;
      if (y < GROUND - REX.stand.h - MIN_JUMP || speedDrop) reachedMin = true;
      if (y < MAX_JUMP_Y || speedDrop) endJump();
      if (y >= STAND_Y) { y = STAND_Y; vy = 0; jumping = false; speedDrop = false; }
    }

    const step = speed * f;
    dist += step;
    gx = (gx + step) % STRIP;
    speed = Math.min(MAX_SPEED, speed + ACCEL * f);

    const s = Math.floor(dist * .025);
    if (s > score) {
      addScore(s - score);
      if (Math.floor(s / MILESTONE) > Math.floor(score / MILESTONE)) { beep(880, .05); setTimeout(() => beep(1180, .06), 90); }
      if (s >= nextInvert) { nightT = NIGHT_LEN; nextInvert += INVERT_AT; if (!stars.length) makeStars(); }
      score = s;
    }
    nightT = Math.max(0, nightT - dt);

    for (const c of clouds) c.x -= step * .2;
    clouds = clouds.filter((c) => c.x > -CLOUD_S.w);
    const lastC = clouds[clouds.length - 1];
    if (clouds.length < 6 && (!lastC || W - lastC.x > lastC.gap)) addCloud(W);
    for (const st of stars) { st.x -= step * .03; if (st.x < -4) st.x += W + 8; }

    for (const o of obstacles) {
      o.x -= (speed + o.drift) * f;
      if (o.t.id === 'ptero') o.frame = Math.floor(animT * 6) % 2;
    }
    obstacles = obstacles.filter((o) => o.x + o.w > 0);
    if (runT > CLEAR_TIME) {
      const last = obstacles[obstacles.length - 1];
      if (!last || last.x + last.w + last.gap < W) spawn();
    }

    const sp = rexSprite();
    const ry = duckHeld && !jumping ? DUCK_Y : y;
    if (obstacles.some((o) => hits(sp, REX_X, ry, o))) {
      crashed = true; crashT = 0; beep(120, .2);
    }
  }

  function makeStars() {
    stars = [0, 1].map(() => ({ x: R() * W, y: 10 + R() * H * .4 }));
  }

  function paint(sp, x, yy, color) {
    ctx.fillStyle = color;
    x = Math.round(x); yy = Math.round(yy);
    for (const [rx, ry, rw] of sp.r) ctx.fillRect(x + rx * P, yy + ry * P, rw * P, P);
  }

  function draw() {
    // Night is a fade of bg ↔ ink, a second either side of the dark stretch.
    const k = nightT <= 0 ? 0 : Math.min(1, (NIGHT_LEN - nightT) / FADE, nightT / FADE);
    const bg = mix(T.bg, T.ink, k), ink = mix(T.ink, T.bg, k);
    clear(ctx, W, H, { bg });

    if (k > 0) {
      ctx.globalAlpha = k;
      ctx.fillStyle = ink;
      for (const st of stars) ctx.fillRect(Math.round(st.x), Math.round(st.y), 2, 2);
      const mx = W - 120, my = 34;
      ctx.beginPath(); ctx.arc(mx, my, 11, 0, 7); ctx.fill();
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(mx + 6, my - 3, 10, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = .4;
    for (const c of clouds) paint(CLOUD_S, c.x, c.y, T.muted);
    ctx.globalAlpha = 1;

    // Horizon: a line with the odd bump, and pebbles scattered beneath it.
    ctx.fillStyle = T.muted;
    ctx.fillRect(0, LINE, W, 1);
    for (const off of [0, STRIP]) {
      for (const b of bumps) {
        const x = Math.round(b.x + off - gx);
        if (x > W || x + b.w < 0) continue;
        ctx.fillStyle = bg; ctx.fillRect(x + 1, LINE, b.w - 2, 1);
        ctx.fillStyle = T.muted;
        ctx.fillRect(x, LINE - 1, 2, 1); ctx.fillRect(x + b.w - 2, LINE - 1, 2, 1);
        ctx.fillRect(x + 2, LINE - 2, b.w - 4, 1);
      }
      for (const p of pebbles) {
        const x = Math.round(p.x + off - gx);
        if (x > W || x < -4) continue;
        ctx.fillRect(x, LINE + p.y, p.w, 1);
      }
    }

    for (const o of obstacles) {
      const sp = o.t.id === 'ptero' ? PTERO[o.frame] : o.t.sp;
      for (let i = 0; i < o.n; i++) paint(sp, o.x + i * sp.w, o.y, T.accent);
    }

    const ducking = duckHeld && jumping === false && !crashed && started;
    paint(rexSprite(), REX_X, ducking ? DUCK_Y : y, ink);

    if (!started) {
      ctx.textAlign = 'center';
      ctx.font = '12px "IBM Plex Mono",monospace';
      ctx.fillStyle = T.muted;
      ctx.fillText('space / tap to start', W / 2, H / 2 - 10);
    }
  }

  return {
    key: input,
    pointer(x, yy, type) {
      if (type === 'down') input(' ', true);
      else if (type === 'up') input(' ', false);
    },
    tick(dt) { update(dt); draw(); },
  };
}

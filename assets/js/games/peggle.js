// games/peggle.js — Peggle.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
// PopCap's 2007 rules: ten balls to clear twenty-five orange pegs from a field
// of blue ones. A peg the ball touches lights up and is removed once the ball
// leaves the board. Orange pegs hit raise the multiplier ×2 ×3 ×5 ×10, one blue
// peg turns purple each turn for 500, the two green pegs give Bjorn's Super
// Guide, and the bucket sliding along the bottom catches a free ball. The last
// orange brings Extreme Fever: five scoring buckets and Ode to Joy. Pegs are
// told apart by fill and mark, not hue, so every theme reads the same.
import { R, clear } from './common.js';

const TAU = Math.PI * 2;
const SCALE = [0, 2, 4, 5, 7, 9, 11];             // each peg in a shot rings a note higher
// Ode to Joy, [Hz, beats]: E E F G | G F E D | C C D E | E. D D
const ODE = [[330, 1], [330, 1], [349, 1], [392, 1], [392, 1], [349, 1], [330, 1], [294, 1],
  [262, 1], [262, 1], [294, 1], [330, 1], [330, 1.5], [294, .5], [294, 2]];

export default function peggle(env) {
  const { ctx, W, H, T, beep, addScore, gameOver, isOver } = env;
  const L = 40, RT = W - 40;                      // side walls; the gutters hold the meters
  const CX = W / 2, CY = 240;
  const GUN = { x: CX, y: 24 }, MUZZLE = 24, MAX_AIM = 1.45;
  const BR = 5, PR = 7, KR = 5;                   // ball, peg, half a brick's thickness
  const GRAV = 400, V0 = 410, E = .76, WALL_E = .9;
  const BALLS = 10, ORANGE = 25, GREEN = 2, GUIDE_SHOTS = 3;
  const VALUE = { blue: 10, orange: 100, purple: 500, green: 10 };
  const FREE_AT = [25000, 75000, 125000];         // one, two, three free balls from a single shot
  const BALL_BONUS = 10000;                       // each ball left when the level is won
  const FEVER = [10000, 50000, 100000, 50000, 10000];
  const BUCKET_W = 64, BUCKET_Y = H - 12, BUCKET_V = 110;
  const FEVER_TOP = H - 30, SLOT = (RT - L) / FEVER.length;
  const MARKS = [[10, 2], [15, 3], [19, 5], [22, 10]];
  const mult = (n) => MARKS.reduce((m, [at, x]) => (n >= at ? x : m), 1);
  const font = (px, w = '') => `${w}${px}px "IBM Plex Mono",monospace`;

  // --- layouts -----------------------------------------------------------------
  // Each returns slots: { x, y } for a round peg, { ax, ay, bx, by } for a brick.
  const peg = (x, y) => ({ x, y });
  function ring(cx, cy, r, a0, a1, n, closed) {
    const s = [];
    for (let i = 0; i < n; i++) {
      const a = a0 + (a1 - a0) * i / (closed ? n : n - 1);
      s.push(peg(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
    return s;
  }
  function arch(cx, cy, r, a0, a1, n) {           // n bricks along an arc, a hair apart
    const s = [], step = (a1 - a0) / n, gap = (KR + 1.5) / r;
    for (let i = 0; i < n; i++) {
      const u = a0 + i * step + gap, v = a0 + (i + 1) * step - gap;
      s.push({ ax: cx + Math.cos(u) * r, ay: cy + Math.sin(u) * r, bx: cx + Math.cos(v) * r, by: cy + Math.sin(v) * r });
    }
    return s;
  }
  function row(y, x0, dx) {
    const s = [];
    for (let x = x0; x < RT - 20; x += dx) s.push(peg(x, y));
    return s;
  }
  const LAYOUTS = [
    () => [0, 1, 2, 3, 4, 5, 6].flatMap((r) => row(110 + r * 38, L + 32 + (r % 2) * 23, 46)),
    () => [
      ...ring(CX, CY, 48, 0, TAU, 8, true), ...ring(CX, CY, 94, 0, TAU, 16, true), ...arch(CX, CY, 140, 0, TAU, 20),
      ...[[96, 120], [W - 96, 120], [96, 360], [W - 96, 360]].flatMap(([x, y]) => ring(x, y, 28, 0, TAU, 7, true)),
    ],
    () => [0, 1, 2, 3, 4, 5].flatMap((r) => row(0, L + 30, 36).map((p) => peg(p.x, 112 + r * 44 + 14 * Math.sin(p.x / 46 + r * 1.3)))),
    () => {
      const s = [];
      for (const off of [0, Math.PI]) {
        for (let th = 1.2, r; (r = 14 + 10 * th) < 150; th += 28 / r) s.push(peg(CX + Math.cos(th + off) * r, CY + Math.sin(th + off) * r));
      }
      return [...s, ...arch(CX, CY, 205, Math.PI - .55, Math.PI + .55, 5), ...arch(CX, CY, 205, -.55, .55, 5)];
    },
    () => [
      ...row(110, L + 40, 64),
      ...[150, 300, 450].flatMap((x) => [...arch(x, 210, 62, Math.PI, TAU, 7), ...ring(x, 210, 30, Math.PI + .3, TAU - .3, 4)]),
      ...row(300, L + 34, 44), ...row(345, L + 56, 44),
    ],
  ];

  // --- state -------------------------------------------------------------------
  let level = 0, pegs = [], balls = BALLS, orangeTotal = 0, orangeHit = 0, fever = false, guide = 0;
  let phase = 'aim', aim = 0, ball = null, shots = 0;
  let shotPts = 0, shotLit = [], freeGiven = 0, flyT = 0, stuckT = 0, clearT = 0, wonT = 0, bonusLeft = 0;
  let bucketX = CX, bucketDir = 1, clock = 0, slow = 1;
  let floats = [], pops = [], notes = [], banner = null;
  const keys = {};
  let pressed = false;

  function build() {
    const kept = [];
    for (const s of LAYOUTS[(level - 1) % LAYOUTS.length]()) {
      const brick = s.ax !== undefined;
      const x = brick ? (s.ax + s.bx) / 2 : s.x, y = brick ? (s.ay + s.by) / 2 : s.y;
      if (x < L + 14 || x > RT - 14 || y < 80 || y > H - 50) continue;
      if (!brick && kept.some((k) => !k.brick && Math.hypot(k.x - x, k.y - y) < PR * 2 + 4)) continue;
      kept.push({ ...s, x, y, brick, type: 'blue', lit: false, gone: false, purple: false });
    }
    const order = kept.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    order.forEach((idx, i) => { if (i < ORANGE) kept[idx].type = 'orange'; else if (i < ORANGE + GREEN) kept[idx].type = 'green'; });
    pegs = kept;
    orangeTotal = Math.min(ORANGE, kept.length);
  }

  function nextLevel() {
    level++;
    build();
    balls = BALLS; orangeHit = 0; fever = false; guide = 0;
    say(`level ${level}`, 1.2);
    newTurn();
  }

  // The purple peg moves to a fresh blue one every turn.
  function newTurn() {
    for (const p of pegs) p.purple = false;
    const blues = pegs.filter((p) => !p.gone && p.type === 'blue');
    if (blues.length) blues[Math.floor(R() * blues.length)].purple = true;
    phase = 'aim';
  }

  function say(text, t = 1.4) { banner = { text, t, t0: t }; }
  function ode() {
    let at = clock + .3;
    notes = ODE.map(([f, b]) => { const n = { at, f: f * 2, d: b * .2 }; at += b * .24; return n; });
  }

  // --- physics -------------------------------------------------------------------
  function launch() {
    const dx = Math.sin(aim), dy = Math.cos(aim);
    return { x: GUN.x + dx * MUZZLE, y: GUN.y + dy * MUZZLE, vx: dx * V0, vy: dy * V0 };
  }
  // Push the ball out of a circle of radius rr round (cx, cy) and reflect it.
  function bounceOff(b, cx, cy, rr, e) {
    const dx = b.x - cx, dy = b.y - cy, d2 = dx * dx + dy * dy;
    if (d2 >= rr * rr || d2 === 0) return false;
    const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
    b.x = cx + nx * rr; b.y = cy + ny * rr;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; }
    return true;
  }
  // A brick is a capsule: bounce off the nearest point of its centre line.
  function contact(b, p) {
    if (Math.abs(b.x - p.x) > 36 || Math.abs(b.y - p.y) > 36) return false;
    if (!p.brick) return bounceOff(b, p.x, p.y, BR + PR, E);
    const ex = p.bx - p.ax, ey = p.by - p.ay;
    const t = Math.max(0, Math.min(1, ((b.x - p.ax) * ex + (b.y - p.ay) * ey) / (ex * ex + ey * ey)));
    return bounceOff(b, p.ax + ex * t, p.ay + ey * t, BR + KR, E);
  }
  function step(b, h, onHit) {
    b.vy += GRAV * h; b.x += b.vx * h; b.y += b.vy * h;
    if (b.x < L + BR) { b.x = L + BR; b.vx = Math.abs(b.vx) * WALL_E; }
    if (b.x > RT - BR) { b.x = RT - BR; b.vx = -Math.abs(b.vx) * WALL_E; }
    if (b.y < BR) { b.y = BR; b.vy = Math.abs(b.vy) * WALL_E; }
    let hit = false;
    for (const p of pegs) if (!p.gone && contact(b, p)) { hit = true; if (onHit) onHit(p); }
    return hit;
  }

  // The aiming guide runs the same physics on a ghost ball: up to the first peg
  // normally, through several bounces while Super Guide lasts.
  function guidePath() {
    const long = guide > 0, b = launch(), pts = [], h = 1 / 240, maxT = long ? 2.4 : 1.5;
    for (let t = 0, i = 0; t < maxT && b.y < H; t += h, i++) {
      const hit = step(b, h, null);
      if (i % 6 === 0) pts.push([b.x, b.y]);
      if (hit && !long) break;
    }
    return pts;
  }

  // --- turn ------------------------------------------------------------------
  function fire() {
    if (phase !== 'aim' || isOver() || !balls) return;
    ball = launch();
    balls--; if (guide > 0) guide--;
    phase = 'fly'; shots++;
    shotPts = 0; shotLit = []; freeGiven = 0; flyT = 0; stuckT = 0;
    beep(220, .05);
  }

  function light(p) {
    if (p.lit) return;
    p.lit = true;
    shotLit.push(p);
    const before = mult(orangeHit);
    if (p.type === 'orange') orangeHit++;
    const m = mult(orangeHit);
    const v = (p.purple ? VALUE.purple : VALUE[p.type]) * m;
    shotPts += v; addScore(v);
    floats.push({ x: p.x, y: p.y - 10, text: String(v), t: 0 });
    const i = Math.min(shotLit.length - 1, 20);
    beep(392 * 2 ** ((12 * Math.floor(i / 7) + SCALE[i % 7]) / 12), .06);
    if (m > before) say(`×${m}`);
    if (p.type === 'green') { guide += GUIDE_SHOTS; say('super guide'); }
    while (freeGiven < FREE_AT.length && shotPts >= FREE_AT[freeGiven]) { freeGiven++; balls++; say('free ball'); }
    if (p.type === 'orange' && !fever && orangeHit >= orangeTotal) { fever = true; say('extreme fever', 2.4); ode(); }
  }

  function pop(p) {
    p.gone = true;
    pops.push({ p, t: 0 });
  }

  function fly(dt) {
    flyT += dt;
    const sp = Math.hypot(ball.vx, ball.vy);
    const n = Math.min(40, Math.max(1, Math.ceil(sp * dt / 2))), h = dt / n;
    for (let i = 0; i < n; i++) {
      step(ball, h, light);
      if (fever) {
        for (let k = 1; k < FEVER.length; k++) bounceOff(ball, L + k * SLOT, Math.max(FEVER_TOP, Math.min(H, ball.y)), BR + 2, E);
        if (ball.y > H - 12) return land(Math.max(0, Math.min(FEVER.length - 1, Math.floor((ball.x - L) / SLOT))));
      } else {
        for (const ox of [-BUCKET_W / 2, BUCKET_W / 2]) bounceOff(ball, bucketX + ox, BUCKET_Y, BR + 3, E);
        if (ball.y > BUCKET_Y + 2 && Math.abs(ball.x - bucketX) < BUCKET_W / 2 - 2) return land('free');
      }
      if (ball.y > H + BR * 2) return land(null);
    }
    // A ball wedged among lit pegs: clear the ones it is resting on, as Peggle
    // does, and give it a nudge if the shot has run on far too long.
    stuckT = sp < 35 ? stuckT + dt : Math.max(0, stuckT - dt * 2);
    if (stuckT > 1.2 || flyT > 20) {
      for (const p of shotLit) if (!p.gone && (flyT > 20 || Math.hypot(p.x - ball.x, p.y - ball.y) < 34)) pop(p);
      if (flyT > 20) { flyT = 12; ball.vx += (R() - .5) * 80; }
      stuckT = 0;
    }
  }

  function land(what) {
    if (what === 'free') { balls++; say('free ball'); beep(988, .08); }
    else if (typeof what === 'number') {
      addScore(FEVER[what]);
      floats.push({ x: L + (what + .5) * SLOT, y: FEVER_TOP - 8, text: `+${FEVER[what]}`, t: 0 });
      beep(1046, .12);
    }
    ball = null; phase = 'clear'; clearT = 0;
  }

  // Lit pegs go one after another once the ball is gone.
  function clearing(dt) {
    clearT += dt;
    if (clearT < .045) return;
    clearT = 0;
    const p = shotLit.find((q) => !q.gone);
    if (p) { pop(p); beep(1320, .015); return; }
    if (fever) { phase = 'won'; wonT = 0; bonusLeft = balls; say('level clear', 3); return; }
    if (!balls) { phase = 'over'; gameOver(); return; }
    newTurn();
  }

  // Every ball left is fired off for a bonus, then the next board.
  function winning(dt) {
    wonT += dt;
    if (bonusLeft > 0 && wonT > .5) {
      wonT = .25; bonusLeft--; balls--;
      addScore(BALL_BONUS);
      floats.push({ x: 20, y: H - 40, text: `+${BALL_BONUS}`, t: 0 });
      beep(784, .06);
    } else if (!bonusLeft && wonT > 2.2) nextLevel();
  }

  function update(dt) {
    clock += dt;
    while (notes.length && clock >= notes[0].at) { const n = notes.shift(); beep(n.f, n.d); }
    if (keys.ArrowLeft) aim -= 1.1 * dt;
    if (keys.ArrowRight) aim += 1.1 * dt;
    aim = Math.max(-MAX_AIM, Math.min(MAX_AIM, aim));

    // Slow motion as the ball closes on the very last orange peg.
    slow = 1;
    if (phase === 'fly' && !fever && orangeTotal - orangeHit === 1) {
      const last = pegs.find((p) => p.type === 'orange' && !p.lit);
      if (last && Math.hypot(last.x - ball.x, last.y - ball.y) < 70) slow = .35;
    }
    const d = dt * slow;

    if (!fever) {
      bucketX += bucketDir * BUCKET_V * d;
      const lo = L + BUCKET_W / 2 + 4, hi = RT - BUCKET_W / 2 - 4;
      if (bucketX < lo || bucketX > hi) { bucketX = Math.max(lo, Math.min(hi, bucketX)); bucketDir *= -1; }
    }
    if (phase === 'fly') fly(d);
    else if (phase === 'clear') clearing(dt);
    else if (phase === 'won') winning(dt);

    for (const f of floats) f.t += dt;
    floats = floats.filter((f) => f.t < 1);
    for (const p of pops) p.t += dt;
    pops = pops.filter((p) => p.t < .3);
    if (banner && (banner.t -= dt) <= 0) banner = null;
  }

  // --- drawing -----------------------------------------------------------------
  // One shape, two kinds: a disc for a peg, a round-capped stroke for a brick.
  function shape(p, grow, color) {
    if (!p.brick) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(.5, PR + grow), 0, TAU); ctx.fill();
      return;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, 2 * (KR + grow));
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.ax, p.ay); ctx.lineTo(p.bx, p.by); ctx.stroke();
  }
  function halo(p, color) {
    ctx.globalAlpha = .28; shape(p, 4, color); ctx.globalAlpha = 1;
  }
  function dot(p, color, r) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
  }
  // blue: a muted ring, solid once lit · orange: accent · purple: ink with an
  // accent core · green: an ink ring with a plus
  function drawPeg(p) {
    const kind = p.purple ? 'purple' : p.type;
    if (kind === 'blue') {
      if (p.lit) { halo(p, T.muted); shape(p, 0, T.muted); } else { shape(p, 0, T.muted); shape(p, -1.6, T.bg); }
    } else if (kind === 'orange') {
      if (p.lit) halo(p, T.accent);
      shape(p, 0, T.accent);
      if (p.lit) dot(p, T.surface, 2);
    } else if (kind === 'purple') {
      if (p.lit) halo(p, T.ink);
      shape(p, 0, T.ink);
      dot(p, p.lit ? T.surface : T.accent, 2.2);
    } else {
      if (p.lit) halo(p, T.ink);
      shape(p, 0, T.ink); shape(p, -1.6, p.lit ? T.surface : T.bg);
      ctx.fillStyle = T.ink;
      ctx.fillRect(p.x - 3, p.y - .75, 6, 1.5); ctx.fillRect(p.x - .75, p.y - 3, 1.5, 6);
    }
  }

  function drawBottom() {
    if (fever) {
      ctx.textAlign = 'center'; ctx.font = font(11, '700 ');
      FEVER.forEach((v, k) => {
        ctx.globalAlpha = v === 100000 ? .45 : v === 50000 ? .25 : .12;
        ctx.fillStyle = T.accent; ctx.fillRect(L + k * SLOT, FEVER_TOP, SLOT, H - FEVER_TOP);
        ctx.globalAlpha = 1;
        ctx.fillStyle = T.ink; ctx.fillText(`${v / 1000}k`, L + (k + .5) * SLOT, H - 9);
      });
      ctx.fillStyle = T.ink;
      for (let k = 1; k < FEVER.length; k++) ctx.fillRect(L + k * SLOT - 1.5, FEVER_TOP, 3, H - FEVER_TOP);
      return;
    }
    const w = BUCKET_W / 2;
    ctx.beginPath();
    ctx.moveTo(bucketX - w, BUCKET_Y); ctx.lineTo(bucketX - w + 6, H + 2);
    ctx.lineTo(bucketX + w - 6, H + 2); ctx.lineTo(bucketX + w, BUCKET_Y);
    ctx.fillStyle = T.accentSoft; ctx.fill();
    ctx.strokeStyle = T.ink; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
  }

  function drawLauncher() {
    const dx = Math.sin(aim), dy = Math.cos(aim);
    ctx.strokeStyle = T.ink; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(GUN.x, GUN.y); ctx.lineTo(GUN.x + dx * (MUZZLE - 4), GUN.y + dy * (MUZZLE - 4)); ctx.stroke();
    ctx.fillStyle = T.surface; ctx.strokeStyle = T.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(GUN.x, GUN.y, 12, 0, TAU); ctx.fill(); ctx.stroke();
    if (phase === 'aim' && balls) dot({ x: GUN.x + dx * MUZZLE, y: GUN.y + dy * MUZZLE }, T.ink, BR);
  }

  // Left gutter: the balls left. Right gutter: the fever meter, one notch per
  // orange peg, with the multiplier steps marked.
  function drawGutters() {
    const top = 56, bot = H - 24;
    ctx.strokeStyle = T.line; ctx.lineWidth = 1;
    ctx.strokeRect(10.5, top + .5, 19, bot - top);
    const fit = Math.floor((bot - top - 4) / 13);
    for (let i = 0; i < Math.min(balls, fit); i++) dot({ x: 20, y: bot - 8 - i * 13 }, T.ink, BR);
    ctx.textAlign = 'center'; ctx.fillStyle = T.ink; ctx.font = font(12, '700 ');
    ctx.fillText(String(balls), 20, top - 10);

    const mx = W - 32, seg = (bot - top) / ORANGE;
    ctx.strokeRect(mx + .5, top + .5, 10, bot - top);
    ctx.fillStyle = T.accent;
    for (let i = 0; i < orangeHit; i++) ctx.fillRect(mx + 2, bot - (i + 1) * seg + 1, 7, seg - 2);
    ctx.font = font(9); ctx.textAlign = 'left';
    for (const [at, m] of MARKS) {
      const y = bot - at * seg;
      ctx.fillStyle = T.ink; ctx.fillRect(mx - 2, y, 15, 1);
      ctx.fillStyle = orangeHit >= at ? T.accent : T.muted;
      ctx.fillText(`×${m}`, mx + 14, y + 3);
    }
    ctx.textAlign = 'center'; ctx.fillStyle = T.accent; ctx.font = font(12, '700 ');
    ctx.fillText(`×${mult(orangeHit)}`, mx + 5, top - 10);
  }

  function draw() {
    clear(ctx, W, H, T);
    ctx.fillStyle = T.line;
    ctx.fillRect(L - 1, 0, 1, H); ctx.fillRect(RT, 0, 1, H);

    drawBottom();
    for (const p of pegs) if (!p.gone) drawPeg(p);
    for (const { p, t } of pops) {
      ctx.globalAlpha = 1 - t / .3;
      if (p.brick) shape(p, t * 20, T.line);
      else { ctx.strokeStyle = p.type === 'orange' ? T.accent : T.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, PR + t * 30, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    const last = slow < 1 && pegs.find((p) => p.type === 'orange' && !p.lit);
    if (last) {
      ctx.strokeStyle = T.accent; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(last.x, last.y, 16 + Math.sin(clock * 12) * 2, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }

    if (phase === 'aim' && balls && !isOver()) {
      ctx.fillStyle = guide > 0 ? T.accent : T.muted;
      for (const [x, y] of guidePath()) { ctx.beginPath(); ctx.arc(x, y, 1.5, 0, TAU); ctx.fill(); }
    }
    drawLauncher();
    if (ball) dot(ball, T.ink, BR);

    ctx.textAlign = 'center'; ctx.font = font(10);
    for (const f of floats) {
      ctx.globalAlpha = 1 - f.t; ctx.fillStyle = T.ink;
      ctx.fillText(f.text, f.x, f.y - f.t * 20);
    }
    ctx.globalAlpha = 1;

    drawGutters();
    ctx.font = font(11); ctx.fillStyle = T.muted;
    ctx.textAlign = 'left'; ctx.fillText(`level ${level}`, L + 8, 16);
    ctx.textAlign = 'right'; ctx.fillText(`${orangeTotal - orangeHit} orange left`, RT - 8, 16);
    if (guide > 0) { ctx.fillStyle = T.accent; ctx.fillText(`super guide ×${guide}`, RT - 8, 30); }

    if (banner) {
      ctx.globalAlpha = Math.min(1, banner.t / .3, (banner.t0 - banner.t) / .15 + .2);
      ctx.textAlign = 'center'; ctx.font = font(24, '700 ');
      ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = T.bg;
      ctx.strokeText(banner.text.toUpperCase(), CX, H / 2 - 30);
      ctx.fillStyle = T.ink; ctx.fillText(banner.text.toUpperCase(), CX, H / 2 - 30);
      ctx.globalAlpha = 1;
    }
    if (!shots && level === 1 && phase === 'aim') {
      ctx.textAlign = 'center'; ctx.font = font(12); ctx.fillStyle = T.muted;
      ctx.fillText('aim · click or space to fire', CX, H - 34);
    }
  }

  function aimAt(x, y) {
    if (phase === 'aim') aim = Math.max(-MAX_AIM, Math.min(MAX_AIM, Math.atan2(x - GUN.x, Math.max(1, y - GUN.y))));
  }

  nextLevel();

  return {
    key(k, down) {
      if (k === ' ' && down && !keys[' ']) fire();
      keys[k] = down;
    },
    // Hover or drag to aim; release fires, so a touch can aim before it shoots.
    pointer(x, y, type) {
      if (type === 'down') { pressed = true; aimAt(x, y); }
      else if (type === 'move') aimAt(x, y);
      else if (type === 'up') { if (pressed) fire(); pressed = false; }
    },
    tick(dt) { update(dt); draw(); },
  };
}

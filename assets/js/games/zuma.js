// games/zuma.js — Zuma.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
// PopCap's 2003 rules, after Mitchell's Puzz Loop: a chain of balls rolls along
// a spiral toward the hole, pushed from the back. The frog in the middle fires
// balls into it; three or more of a colour touching vanish. A gap whose two
// ends match pulls the front of the chain back to close it, and if that closing
// makes another match it is a combo. Shots that match one after another build a
// chain bonus. Once the Zuma bar fills no more balls come: clear the rest to win
// the level. Balls are told apart by fill and mark, not hue, so every theme
// reads the same.
import { R, clear } from './common.js';

const TAU = Math.PI * 2;
const SCALE = [0, 2, 4, 5, 7, 9, 11];

export default function zuma(env) {
  const { ctx, W, H, T, beep, addScore, gameOver, isOver } = env;
  const CX = W / 2, CY = H / 2;
  const BR = 9, D = BR * 2;                       // ball radius, spacing along the track
  const FROG = 22, SHOT_V = 720, COOLDOWN = .16, GROW = .14;
  const PULL = 900, PULL_MAX = 420;               // a matching gap closes: accel, top speed (px/s)
  const INTRO_V = 280, RUSH_V = 520;              // rolling in, and pouring into the hole
  const font = (px, w = '') => `${w}${px}px "IBM Plex Mono",monospace`;

  // --- tracks ----------------------------------------------------------------
  // Spirals winding in to the hole round the frog: an ellipse, a squircle, and
  // an ellipse with a five-petal ripple. p is the superellipse exponent.
  const TRACKS = [
    { p: 2, a0: Math.PI, dir: 1, turns: 1.7, inner: .36, wave: 0 },
    { p: 4, a0: 0, dir: -1, turns: 1.6, inner: .38, wave: 0 },
    { p: 2, a0: -Math.PI / 2, dir: 1, turns: 1.75, inner: .37, wave: .07 },
  ];
  let X = [], Y = [], LEN = 0;
  function buildTrack(tr) {
    const k = 1 / (1 + tr.wave), rx = (W / 2 - 16) * k, ry = (H / 2 - 16) * k, e = 2 / tr.p, raw = [];
    for (let i = 0, N = 4000; i <= N; i++) {
      const u = i / N, th = tr.a0 + tr.dir * u * tr.turns * TAU;
      const f = (1 - u * (1 - tr.inner)) * (1 + tr.wave * Math.sin(5 * th));
      const c = Math.cos(th), s = Math.sin(th);
      raw.push([CX + rx * f * Math.sign(c) * Math.abs(c) ** e, CY + ry * f * Math.sign(s) * Math.abs(s) ** e]);
    }
    // Resample to one point per pixel of arc length, so s indexes straight in.
    X = [raw[0][0]]; Y = [raw[0][1]];
    let px = raw[0][0], py = raw[0][1], want = 1;
    for (let i = 1; i < raw.length; i++) {
      const [bx, by] = raw[i];
      let d = Math.hypot(bx - px, by - py);
      while (d >= want) {
        const t = want / d;
        px += (bx - px) * t; py += (by - py) * t;
        X.push(px); Y.push(py);
        d -= want; want = 1;
      }
      want -= d; px = bx; py = by;
    }
    LEN = X.length - 1;
  }
  function posAt(s) {
    s = Math.max(0, Math.min(LEN - 1e-6, s));
    const i = Math.floor(s), t = s - i;
    return [X[i] + (X[i + 1] - X[i]) * t, Y[i] + (Y[i + 1] - Y[i]) * t];
  }
  function dirAt(s) {
    const i = Math.max(1, Math.min(LEN - 1, Math.round(s)));
    const dx = X[i + 1] - X[i - 1], dy = Y[i + 1] - Y[i - 1], d = Math.hypot(dx, dy) || 1;
    return [dx / d, dy / d];
  }

  // --- state -----------------------------------------------------------------
  // chain runs tail → head: chain[0] is the newest ball, the last is nearest the hole.
  let level = 0, kinds = 4, total = 0, spawned = 0, speed = 0, zumaSaid = false;
  let phase = 'intro', chain = [], shots = [], cool = 0, wonT = 0, maxFrac = 0;
  let aim = -Math.PI / 2, cur = 0, next = 0, streak = 0, fired = 0, clock = 0, warnT = 0;
  let floats = [], pops = [], banner = null;
  const keys = {};
  let pressed = false;

  const need = (a, b) => D * (a.g + b.g) / 2;
  const touching = (i) => chain[i + 1].s - chain[i].s <= need(chain[i], chain[i + 1]) + .5;
  const ball = (c, s) => ({ c, s, g: 1, back: 0, combo: 0, fx: 0, fy: 0 });

  function nextLevel() {
    level++;
    buildTrack(TRACKS[(level - 1) % TRACKS.length]);
    kinds = level >= 3 ? 5 : 4;
    total = Math.min(150, 60 + 15 * (level - 1));
    speed = Math.min(80, 22 + 4 * level);
    spawned = 0; zumaSaid = false; chain = []; shots = []; maxFrac = 0;
    phase = 'intro';
    cur = Math.floor(R() * kinds); next = Math.floor(R() * kinds);
    say(`level ${level}`, 1.4);
  }

  function say(text, t = 1.4) { banner = { text, t, t0: t }; }

  // New balls repeat the one behind them often enough to make runs, but never
  // arrive as three of a kind.
  function spawnColour() {
    const a = chain[0], b = chain[1];
    if (a && R() < .5 && !(b && b.c === a.c)) return a.c;
    let c;
    do c = Math.floor(R() * kinds); while (a && c === a.c && b && b.c === a.c);
    return c;
  }
  function spawn() {
    if (phase === 'lost') return;
    while (spawned < total && (!chain.length || chain[0].s >= 0)) {
      chain.unshift(ball(spawnColour(), chain.length ? chain[0].s - D : 0));
      spawned++;
    }
    if (spawned >= total && !zumaSaid) { zumaSaid = true; say('zuma!', 1.8); beep(880, .12); }
  }

  // The frog only offers colours still on the board.
  function pick() {
    const live = [...new Set(chain.map((b) => b.c))];
    return live.length ? live[Math.floor(R() * live.length)] : Math.floor(R() * kinds);
  }
  function refreshAmmo() {
    if (!chain.length) return;
    const live = new Set(chain.map((b) => b.c));
    if (!live.has(cur)) cur = pick();
    if (!live.has(next)) next = pick();
  }

  // --- matching --------------------------------------------------------------
  // The run of touching same-colour balls through b; three or more go, and the
  // gap they leave pulls closed if its two ends match, one combo deeper.
  function check(b, combo, fromShot) {
    const i = chain.indexOf(b);
    if (i < 0) return 0;
    let lo = i, hi = i;
    while (lo > 0 && chain[lo - 1].c === b.c && touching(lo - 1)) lo--;
    while (hi < chain.length - 1 && chain[hi + 1].c === b.c && touching(hi)) hi++;
    const n = hi - lo + 1;
    if (n < 3) return 0;
    const gone = chain.splice(lo, n);
    let mx = 0, my = 0;
    for (const g of gone) { const [x, y] = posAt(g.s); mx += x; my += y; pops.push({ x, y, c: g.c, t: 0 }); }
    let pts = n * 10 * (combo + 1);
    if (fromShot) {
      streak++;
      if (streak >= 3) { pts += streak * 10; say(`chain ×${streak}`, 1); }
    }
    if (combo > 0) say(`combo ×${combo + 1}`, 1.1);
    addScore(pts);
    floats.push({ x: mx / n, y: my / n - 12, text: `+${pts}`, t: 0 });
    beep(392 * 2 ** (SCALE[Math.min(combo, 6)] / 12 + Math.floor(combo / 7)), .09);
    if (lo > 0 && lo < chain.length && chain[lo - 1].c === chain[lo].c) chain[lo].combo = combo + 1;
    return n;
  }

  // --- the chain -------------------------------------------------------------
  function roll(dt) {
    const n = chain.length;
    if (!n) return;
    const was = [];
    for (let i = 0; i < n - 1; i++) was.push(touching(i));

    // Each segment moves as one: the tail one is pushed forward, one ahead of a
    // matching gap rolls back, any other waits.
    const head = chain[n - 1].s / LEN;
    const v = phase === 'lost' ? RUSH_V
      : phase === 'intro' ? INTRO_V
        : speed * (1 - .55 * Math.max(0, Math.min(1, (head - .6) / .3)));
    let d = 0;
    for (let i = 0; i < n; i++) {
      const b = chain[i];
      if (i === 0) d = v * dt;
      else if (!was[i - 1]) {
        if (phase === 'lost') d = v * dt;
        else {
          const a = chain[i - 1];
          if (a.c === b.c && a.g === 1 && b.g === 1) b.back = Math.max(-PULL_MAX, b.back - PULL * dt);
          else { b.back = 0; b.combo = 0; }
          d = b.back * dt;
        }
      }
      b.s += d;
    }

    // Nothing overlaps: a ball pushes the ones ahead of it. A segment that rolls
    // back into the one behind it joins it there, and the join is checked.
    const merged = [];
    for (let i = 0; i < n - 1; i++) {
      const a = chain[i], b = chain[i + 1], nd = need(a, b);
      if (b.s < a.s + nd) {
        if (!was[i]) { merged.push({ a, b, combo: b.combo }); b.back = 0; b.combo = 0; }
        b.s = a.s + nd;
      }
    }
    if (phase === 'lost') return;
    for (const m of merged) {
      if (m.a.c !== m.b.c) continue;
      if (check(m.b, m.combo, false)) beep(660, .05);
      else if (m.combo) beep(330, .04);
    }
  }

  // A shot ball slots in beside the one it hit, on whichever side it struck,
  // and grows into place, shoving the balls ahead of it along.
  function insert(sh, j) {
    const b = chain[j], [bx, by] = posAt(b.s), [tx, ty] = dirAt(b.s);
    const ahead = (sh.x - bx) * tx + (sh.y - by) * ty > 0;
    const nb = ball(sh.c, b.s + (ahead ? D / 2 : -D / 2));
    nb.g = 0; nb.fx = sh.x; nb.fy = sh.y;
    chain.splice(ahead ? j + 1 : j, 0, nb);
    beep(520, .03);
  }

  function hitIndex(x, y) {
    for (let j = 0; j < chain.length; j++) {
      const b = chain[j];
      if (b.s < 0) continue;
      const [bx, by] = posAt(b.s);
      if ((bx - x) ** 2 + (by - y) ** 2 < (D - 1) ** 2) return j;
    }
    return -1;
  }

  function fly(dt) {
    shots = shots.filter((sh) => {
      const n = Math.ceil(SHOT_V * dt / (BR * .8));
      for (let k = 0; k < n; k++) {
        sh.x += sh.vx * dt / n; sh.y += sh.vy * dt / n;
        const j = hitIndex(sh.x, sh.y);
        if (j >= 0) { insert(sh, j); return false; }
      }
      if (sh.x < -BR || sh.x > W + BR || sh.y < -BR || sh.y > H + BR) { streak = 0; return false; }
      return true;
    });
  }

  function fire() {
    if (isOver() || phase === 'lost' || phase === 'won' || cool > 0) return;
    const dx = Math.cos(aim), dy = Math.sin(aim);
    shots.push({ x: CX + dx * FROG, y: CY + dy * FROG, vx: dx * SHOT_V, vy: dy * SHOT_V, c: cur });
    cur = next; next = pick();
    cool = COOLDOWN; fired++;
    beep(300, .04);
  }
  function swap() {
    if (phase === 'lost') return;
    [cur, next] = [next, cur];
    beep(600, .03);
  }

  // --- update ----------------------------------------------------------------
  function update(dt) {
    clock += dt;
    cool = Math.max(0, cool - dt);
    if (keys.ArrowLeft) aim -= 3 * dt;
    if (keys.ArrowRight) aim += 3 * dt;

    if (phase !== 'won') {
      spawn();
      roll(dt);
      // Collect first: a check splices the chain.
      const landed = chain.filter((b) => b.g < 1 && (b.g = Math.min(1, b.g + dt / GROW)) === 1);
      if (phase !== 'lost') for (const b of landed) if (!check(b, 0, true)) streak = 0;
      fly(dt);
      refreshAmmo();
    }

    const n = chain.length, head = n ? chain[n - 1].s / LEN : 0;
    if (phase === 'intro' && (head > .3 || spawned >= total)) phase = 'play';
    if (phase === 'play') {
      maxFrac = Math.max(maxFrac, head);
      if (head > .82 && (warnT -= dt) <= 0) { warnT = .7 - (head - .82) * 2; beep(140, .05); }
      if (n && chain[n - 1].s >= LEN) { phase = 'lost'; shots = []; say('the hole', 1.6); }
      else if (!n && spawned >= total && !shots.length) {
        const bonus = Math.round((1 - maxFrac) * 100) * 50;
        if (bonus > 0) { addScore(bonus); floats.push({ x: CX, y: CY - 60, text: `+${bonus} clear`, t: 0 }); }
        phase = 'won'; wonT = 0; say('level clear', 2.4); beep(1046, .15);
      }
    } else if (phase === 'lost') {
      // The chain pours into the hole, one gulp a ball, and then it is over.
      while (chain.length && chain[chain.length - 1].s >= LEN) { chain.pop(); beep(110 + chain.length % 7 * 12, .02); }
      if (!chain.length && !isOver()) gameOver();
    } else if (phase === 'won' && (wonT += dt) > 2.4) nextLevel();

    for (const f of floats) f.t += dt;
    floats = floats.filter((f) => f.t < 1);
    for (const p of pops) p.t += dt;
    pops = pops.filter((p) => p.t < .3);
    if (banner && (banner.t -= dt) <= 0) banner = null;
  }

  // --- drawing ---------------------------------------------------------------
  // Five kinds, each a fill and a mark: accent with a dot, ink with a bar, a
  // hollow ink ring with a dot, muted with a cross, an accent ring with a bar.
  // The bar and cross turn as the ball rolls.
  function drawBall(x, y, c, rot, r = BR) {
    const disc = (col, rr = r) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); };
    const ring = (col) => { ctx.strokeStyle = col; ctx.lineWidth = r * .28; ctx.beginPath(); ctx.arc(x, y, r - r * .14, 0, TAU); ctx.stroke(); };
    const bar = (col, a) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = col; ctx.fillRect(-r * .55, -r * .13, r * 1.1, r * .26);
      ctx.restore();
    };
    if (c === 0) { disc(T.accent); disc(T.surface, r * .3); }
    else if (c === 1) { disc(T.ink); bar(T.surface, rot); }
    else if (c === 2) { disc(T.surface); ring(T.ink); disc(T.ink, r * .3); }
    else if (c === 3) { disc(T.muted); bar(T.surface, rot); bar(T.surface, rot + Math.PI / 2); }
    else { disc(T.bg); disc(T.accentSoft); ring(T.accent); bar(T.accent, rot); }
  }

  function trackPath(from, to) {
    ctx.beginPath(); ctx.moveTo(X[from], Y[from]);
    for (let i = from + 4; i < to; i += 4) ctx.lineTo(X[i], Y[i]);
    ctx.lineTo(X[to], Y[to]);
  }
  function drawTrack() {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    trackPath(0, LEN); ctx.strokeStyle = T.line; ctx.lineWidth = D + 8; ctx.stroke();
    trackPath(0, LEN); ctx.strokeStyle = T.bg; ctx.lineWidth = D + 5; ctx.stroke();
    trackPath(0, LEN); ctx.strokeStyle = T.accentSoft; ctx.stroke();
    // The last stretch before the hole is marked out.
    const from = Math.floor(LEN * .82);
    ctx.setLineDash([2, 6]);
    trackPath(from, LEN); ctx.strokeStyle = T.accent; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.setLineDash([]);
    const n = chain.length, danger = n ? Math.max(0, (chain[n - 1].s / LEN - .7) / .3) : 0;
    const [hx, hy] = [X[LEN], Y[LEN]], pulse = danger * (1 + Math.sin(clock * 10)) * 2;
    ctx.fillStyle = T.ink; ctx.beginPath(); ctx.arc(hx, hy, BR + 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = T.accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hx, hy, BR + 7 + pulse, 0, TAU); ctx.stroke();
  }

  // The dotted line from the frog stops at the first ball it would meet.
  function drawAim() {
    const dx = Math.cos(aim), dy = Math.sin(aim);
    ctx.fillStyle = T.muted;
    for (let t = FROG + 14; t < 700; t += 9) {
      const x = CX + dx * t, y = CY + dy * t;
      if (x < 0 || x > W || y < 0 || y > H || hitIndex(x, y) >= 0) break;
      ctx.beginPath(); ctx.arc(x, y, 1.3, 0, TAU); ctx.fill();
    }
  }

  function drawFrog() {
    const dx = Math.cos(aim), dy = Math.sin(aim);
    ctx.fillStyle = T.surface; ctx.strokeStyle = T.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(CX, CY, FROG, 0, TAU); ctx.fill(); ctx.stroke();
    // eyes either side of the mouth
    for (const side of [-1, 1]) {
      const a = aim + side * .95, ex = CX + Math.cos(a) * (FROG - 3), ey = CY + Math.sin(a) * (FROG - 3);
      ctx.fillStyle = T.surface; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = T.ink; ctx.beginPath(); ctx.arc(ex + dx * 1.5, ey + dy * 1.5, 2, 0, TAU); ctx.fill();
    }
    const recoil = cool / COOLDOWN * 5;
    drawBall(CX + dx * (FROG - 8 - recoil), CY + dy * (FROG - 8 - recoil), cur, aim);
    drawBall(CX - dx * 9, CY - dy * 9, next, aim, 5);
  }

  function draw() {
    clear(ctx, W, H, T);
    drawTrack();
    for (const b of chain) {
      if (b.s < 0) continue;
      let [x, y] = posAt(b.s);
      if (b.g < 1) { const e = b.g * b.g * (3 - 2 * b.g); x = b.fx + (x - b.fx) * e; y = b.fy + (y - b.fy) * e; }
      drawBall(x, y, b.c, b.s / BR, BR * Math.min(1, .4 + b.s / D * .6));
    }
    for (const p of pops) {
      ctx.globalAlpha = 1 - p.t / .3;
      ctx.strokeStyle = p.c === 0 || p.c === 4 ? T.accent : T.muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, BR + p.t * 40, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const sh of shots) drawBall(sh.x, sh.y, sh.c, 0);
    if (phase !== 'lost' && !isOver()) drawAim();
    drawFrog();

    ctx.textAlign = 'center'; ctx.font = font(11, '700 ');
    for (const f of floats) {
      ctx.globalAlpha = 1 - f.t; ctx.fillStyle = T.ink;
      ctx.fillText(f.text, f.x, f.y - f.t * 20);
    }
    ctx.globalAlpha = 1;

    // HUD: level and the Zuma bar top left, the chain bonus top right.
    ctx.textAlign = 'left'; ctx.font = font(11); ctx.fillStyle = T.muted;
    ctx.fillText(`level ${level}`, 12, 18);
    ctx.fillStyle = T.line; ctx.fillRect(12, 24, 90, 4);
    ctx.fillStyle = T.accent; ctx.fillRect(12, 24, 90 * spawned / total, 4);
    ctx.fillStyle = spawned >= total ? T.accent : T.muted; ctx.font = font(9, '700 ');
    ctx.fillText('ZUMA', 106, 29);
    if (streak >= 2) {
      ctx.textAlign = 'right'; ctx.font = font(11, '700 '); ctx.fillStyle = T.accent;
      ctx.fillText(`chain ×${streak}`, W - 12, 18);
    }

    if (banner) {
      ctx.globalAlpha = Math.min(1, banner.t / .3, (banner.t0 - banner.t) / .15 + .2);
      ctx.textAlign = 'center'; ctx.font = font(22, '700 ');
      ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = T.bg;
      ctx.strokeText(banner.text.toUpperCase(), CX, CY - 46);
      ctx.fillStyle = T.ink; ctx.fillText(banner.text.toUpperCase(), CX, CY - 46);
      ctx.globalAlpha = 1;
    }
    if (!fired && level === 1) {
      ctx.textAlign = 'center'; ctx.font = font(11); ctx.fillStyle = T.muted;
      ctx.fillText('click to fire · click the frog to swap', CX, CY + FROG + 20);
    }
  }

  function aimAt(x, y) {
    if (Math.hypot(x - CX, y - CY) > 4) aim = Math.atan2(y - CY, x - CX);
  }

  nextLevel();

  return {
    key(k, down) {
      if (down && !keys[k]) {
        if (k === ' ') fire();
        else if (k === 'ArrowDown' || k === 'ArrowUp') swap();
      }
      keys[k] = down;
    },
    // Hover or drag to aim, release to fire; a press on the frog swaps balls.
    pointer(x, y, type) {
      if (type === 'down') {
        if (Math.hypot(x - CX, y - CY) < FROG + 4) { swap(); pressed = false; return; }
        pressed = true; aimAt(x, y);
      } else if (type === 'move') aimAt(x, y);
      else if (type === 'up') { if (pressed) fire(); pressed = false; }
    },
    tick(dt) { update(dt); draw(); },
  };
}

// games/tetris/cubetris.js — Blockfall's Cubetris mode.
// After Cubetris (cubetris.netlify.app). Pieces fall onto a 3×3 core in the
// middle of a 25×25 field. A piece that joins the core's mass spins the whole
// mass a quarter turn (clockwise if it landed right of centre, anti-clockwise
// if left), and whatever the spin leaves loose is pulled back to the mass as a
// rigid island. Five in a row, across or down, clears. Space is a magnet slam:
// the piece shoots toward the core along whichever axis lands it closer.
// Painted like classic Blockfall: settled blocks in ink, the live piece in accent.
import { R, clear } from '../common.js';

const N = 25, CORE = 3, CORE0 = (N - CORE) >> 1, MID = N / 2, RUN = 5;
const EMPTY = 0, BLOCK = 1, CORE_CELL = 2;
const SHAPES = [
  [[0, 0], [0, 1], [0, 2], [0, 3]],             // I
  [[0, 0], [0, 1], [1, 0], [1, 1]],             // O
  [[0, 0], [0, 1], [0, 2], [1, 1]],             // T
  [[0, 1], [0, 2], [1, 0], [1, 1]],             // S
  [[0, 0], [0, 1], [1, 1], [1, 2]],             // Z
  [[0, 0], [1, 0], [1, 1], [1, 2]],             // J
  [[0, 2], [1, 0], [1, 1], [1, 2]],             // L
];
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const KICKS = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0], [0, 2], [0, -2], [2, 0], [-2, 0]];
const SPIN_T = .26, PULL_T = .22, LOCK_T = .5;

export default function cubetris(env) {
  const { ctx, W, H, T, beep, addScore, gameOver, isOver } = env;
  const C = Math.floor((H - 24) / N), SIZE = N * C;
  const BX = Math.max(8, Math.floor((W - SIZE) / 2) - 60), BY = Math.floor((H - SIZE) / 2);
  const PX = BX + SIZE + 18;                    // side panel
  const inB = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
  const key = (r, c) => r * N + c;

  let grid = Array.from({ length: N }, () => Array(N).fill(EMPTY));
  for (let r = CORE0; r < CORE0 + CORE; r++) for (let c = CORE0; c < CORE0 + CORE; c++) grid[r][c] = CORE_CELL;

  const randShape = () => SHAPES[Math.floor(R() * SHAPES.length)];
  let piece = null, next = randShape();
  let lines = 0, level = 1, fall = .6, t = 0, lockT = 0;
  let anim = null;                              // a spin or a pull in progress
  let sparks = [];

  // --- the mass -------------------------------------------------------------
  // Every cell joined to the core, orthogonally, through occupied cells.
  function connected() {
    const seen = new Set(), queue = [];
    for (let r = CORE0; r < CORE0 + CORE; r++) for (let c = CORE0; c < CORE0 + CORE; c++) { seen.add(key(r, c)); queue.push([r, c]); }
    while (queue.length) {
      const [r, c] = queue.shift();
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (inB(nr, nc) && grid[nr][nc] && !seen.has(key(nr, nc))) { seen.add(key(nr, nc)); queue.push([nr, nc]); }
      }
    }
    return seen;
  }

  // A quarter turn of the mass about the field's centre; loose cells stay put.
  function spun(dir) {
    const mass = connected(), out = Array.from({ length: N }, () => Array(N).fill(EMPTY)), loose = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (!grid[r][c]) continue;
      if (!mass.has(key(r, c))) { loose.push([r, c, grid[r][c]]); continue; }
      const dr = r + .5 - MID, dc = c + .5 - MID;
      const nr = Math.round(dir > 0 ? MID + dc - .5 : MID - dc - .5);
      const nc = Math.round(dir > 0 ? MID - dr - .5 : MID + dr - .5);
      if (inB(nr, nc)) out[nr][nc] = grid[r][c];
    }
    for (const [r, c, v] of loose) if (!out[r][c]) out[r][c] = v;
    return out;
  }

  // Pull each loose island, shape intact, toward the centre one step at a time
  // until it touches the mass or can't move closer. Returns the moves made.
  function pull() {
    const moves = [], placed = new Set();
    for (let guard = 0; guard < 40; guard++) {
      const mass = connected();
      let seed = null;
      for (let r = 0; r < N && !seed; r++) for (let c = 0; c < N; c++) {
        if (grid[r][c] === BLOCK && !mass.has(key(r, c)) && !placed.has(key(r, c))) { seed = [r, c]; break; }
      }
      if (!seed) break;
      const island = [seed], seen = new Set([key(...seed)]);
      for (let i = 0; i < island.length; i++) {
        for (const [dr, dc] of DIRS) {
          const nr = island[i][0] + dr, nc = island[i][1] + dc;
          if (inB(nr, nc) && grid[nr][nc] === BLOCK && !mass.has(key(nr, nc)) && !seen.has(key(nr, nc))) { seen.add(key(nr, nc)); island.push([nr, nc]); }
        }
      }
      for (const [r, c] of island) grid[r][c] = EMPTY;
      let pos = island.map(([r, c]) => [r, c]);
      for (let steps = 0; steps < N * 2; steps++) {
        const cr = pos.reduce((s, p) => s + p[0], 0) / pos.length, cc = pos.reduce((s, p) => s + p[1], 0) / pos.length;
        const ddr = MID - .5 - cr, ddc = MID - .5 - cc;
        const tries = [];
        if (Math.abs(ddr) >= Math.abs(ddc)) { if (ddr) tries.push([Math.sign(ddr), 0]); if (ddc) tries.push([0, Math.sign(ddc)]); }
        else { if (ddc) tries.push([0, Math.sign(ddc)]); if (ddr) tries.push([Math.sign(ddr), 0]); }
        const step = tries.map(([mr, mc]) => pos.map(([r, c]) => [r + mr, c + mc]))
          .find((np) => np.every(([r, c]) => inB(r, c) && !grid[r][c]));
        if (!step) break;
        pos = step;
        const m = connected();
        if (pos.some(([r, c]) => DIRS.some(([dr, dc]) => m.has(key(r + dr, c + dc))))) break;
      }
      pos.forEach(([r, c], i) => {
        grid[r][c] = BLOCK; placed.add(key(r, c));
        if (r !== island[i][0] || c !== island[i][1]) moves.push({ sr: island[i][0], sc: island[i][1], tr: r, tc: c });
      });
    }
    return moves;
  }

  // Runs of five or more non-core blocks, across and down. Returns cells cleared.
  function clearRuns() {
    const hit = new Set();
    for (let a = 0; a < N; a++) {
      for (const across of [true, false]) {
        let run = 0;
        for (let b = 0; b <= N; b++) {
          const v = b < N ? (across ? grid[a][b] : grid[b][a]) : EMPTY;
          if (v === BLOCK) { run++; continue; }
          if (run >= RUN) for (let k = b - run; k < b; k++) hit.add(across ? key(a, k) : key(k, a));
          run = 0;
        }
      }
    }
    if (!hit.size) return 0;
    for (const k of hit) {
      const r = Math.floor(k / N), c = k % N;
      grid[r][c] = EMPTY;
      burst(r, c, 5);
    }
    const n = Math.floor(hit.size / RUN);
    lines += n;
    addScore(n * 200 * level);
    level = Math.floor(lines / 5) + 1;
    fall = Math.max(.1, .6 - (level - 1) * .045);
    beep(660 + Math.min(n, 4) * 80, .08);
    return hit.size;
  }

  // --- the piece ------------------------------------------------------------
  const fits = (cells) => cells.every(([r, c]) => inB(r, c) && !grid[r][c]);
  const shift = (cells, dr, dc) => cells.map(([r, c]) => [r + dr, c + dc]);

  function spawn() {
    const cells = next.map(([r, c]) => [r, c + (N >> 1) - 1]);
    next = randShape();
    piece = fits(cells) ? cells : null;
    lockT = 0; t = 0;
    if (!piece) gameOver();
  }

  function rotatePiece() {
    const cr = piece.reduce((s, p) => s + p[0], 0) / piece.length, cc = piece.reduce((s, p) => s + p[1], 0) / piece.length;
    const turned = piece.map(([r, c]) => [Math.round(cr + (c - cc)), Math.round(cc - (r - cr))]);
    for (const [kr, kc] of KICKS) {
      const k = shift(turned, kr, kc);
      if (fits(k)) { piece = k; beep(520, .03); return; }
    }
  }

  // Slide toward the centre on each axis that points at it; keep whichever
  // landing ends nearer. This is also the ghost.
  function slamTarget(cells) {
    const centre = (p) => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
    const dist = (p) => { const [r, c] = centre(p); return Math.abs(r - (MID - .5)) + Math.abs(c - (MID - .5)); };
    const [cr, cc] = centre(cells);
    const axes = [];
    if (MID - .5 - cr) axes.push([Math.sign(MID - .5 - cr), 0]);
    if (MID - .5 - cc) axes.push([0, Math.sign(MID - .5 - cc)]);
    if (!axes.length) axes.push([1, 0]);
    let best = cells, bestD = dist(cells);
    for (const [mr, mc] of axes) {
      let pos = cells;
      for (;;) { const np = shift(pos, mr, mc); if (!fits(np)) break; pos = np; }
      const d = dist(pos);
      if (d < bestD) { best = pos; bestD = d; }
    }
    return best;
  }

  function slam() {
    const to = slamTarget(piece);
    const moved = piece.reduce((s, [r, c], i) => s + Math.abs(r - to[i][0]) + Math.abs(c - to[i][1]), 0);
    addScore(Math.floor(moved / piece.length) * 2);
    piece = to;
    lock();
  }

  function lock() {
    const cells = piece;
    piece = null;
    for (const [r, c] of cells) grid[r][c] = BLOCK;
    beep(300, .04);
    while (clearRuns()) pull();
    const mass = connected();
    if (cells.some(([r, c]) => mass.has(key(r, c)))) {
      // The piece joined the mass: spin it, toward the side the piece landed on.
      const dir = cells.reduce((s, p) => s + p[1], 0) / cells.length < MID ? -1 : 1;
      const blob = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c] && mass.has(key(r, c))) blob.push({ r, c, v: grid[r][c] });
      anim = { kind: 'spin', t: 0, dur: SPIN_T, dir, blob, after: spun(dir) };
      beep(dir > 0 ? 392 : 330, .1);
    } else {
      startPull();
    }
  }

  function startPull() {
    const moves = pull();
    if (moves.length) anim = { kind: 'pull', t: 0, dur: PULL_T, moves };
    else settle();
  }

  function settle() {
    anim = null;
    let cascades = 0;
    while (cascades < 10 && clearRuns()) { pull(); cascades++; }
    if (cascades) addScore(cascades * 150);
    spawn();
  }

  function advance(dt) {
    anim.t += dt;
    if (anim.t < anim.dur) return;
    if (anim.kind === 'spin') { grid = anim.after; startPull(); }
    else { for (const m of anim.moves) burst(m.tr, m.tc, 2); settle(); }
  }

  spawn();

  // --- drawing --------------------------------------------------------------
  function burst(r, c, n) {
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, s = 30 + R() * 70;
      sparks.push({ x: BX + (c + .5) * C, y: BY + (r + .5) * C, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, decay: 1.5 + R() * 1.5 });
    }
  }
  function block(x, y, color, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, C - 2, C - 2);
    ctx.globalAlpha = 1;
  }
  function coreCell(x, y) {
    ctx.fillStyle = T.soft;
    ctx.fillRect(x + 1, y + 1, C - 2, C - 2);
    ctx.strokeStyle = T.accent;
    ctx.globalAlpha = .45;
    ctx.strokeRect(x + 1.5, y + 1.5, C - 3, C - 3);
    ctx.globalAlpha = 1;
    ctx.fillStyle = T.muted;
    ctx.fillRect(x + C / 2 - 2, y + C / 2 - .5, 4, 1);
    ctx.fillRect(x + C / 2 - .5, y + C / 2 - 2, 1, 4);
  }
  const cell = (r, c, v) => (v === CORE_CELL ? coreCell(BX + c * C, BY + r * C) : block(BX + c * C, BY + r * C, T.ink));

  function draw() {
    clear(ctx, W, H, T);
    ctx.fillStyle = T.soft;
    ctx.fillRect(BX, BY, SIZE, 2 * C);                    // spawn rows
    ctx.strokeStyle = T.line;
    ctx.strokeRect(BX - .5, BY - .5, SIZE + 1, SIZE + 1);
    ctx.fillStyle = T.line;                               // a dot at each crossing
    for (let r = 1; r < N; r++) for (let c = 1; c < N; c++) ctx.fillRect(BX + c * C - .5, BY + r * C - .5, 1, 1);

    if (anim && anim.kind === 'spin') {
      const k = Math.min(1, anim.t / anim.dur);
      const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const inBlob = new Set(anim.blob.map((b) => key(b.r, b.c)));
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c] && !inBlob.has(key(r, c))) cell(r, c, grid[r][c]);
      const cx = BX + MID * C, cy = BY + MID * C;
      ctx.save();
      ctx.beginPath(); ctx.rect(BX, BY, SIZE, SIZE); ctx.clip();
      ctx.translate(cx, cy); ctx.rotate(e * anim.dir * Math.PI / 2);
      for (const b of anim.blob) {
        const x = (b.c - MID) * C, y = (b.r - MID) * C;
        if (b.v === CORE_CELL) coreCell(x, y); else block(x, y, T.ink);
      }
      ctx.restore();
    } else if (anim && anim.kind === 'pull') {
      const k = Math.min(1, anim.t / anim.dur), e = 1 - Math.pow(1 - k, 3);
      const moving = new Set(anim.moves.map((m) => key(m.tr, m.tc)));
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c] && !moving.has(key(r, c))) cell(r, c, grid[r][c]);
      for (const m of anim.moves) block(BX + (m.sc + (m.tc - m.sc) * e) * C, BY + (m.sr + (m.tr - m.sr) * e) * C, T.ink);
    } else {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c]) cell(r, c, grid[r][c]);
    }

    if (piece && !anim && !isOver()) {
      for (const [r, c] of slamTarget(piece)) block(BX + c * C, BY + r * C, T.accent, .2);
      for (const [r, c] of piece) block(BX + c * C, BY + r * C, T.accent);
    }

    ctx.fillStyle = T.accent;
    for (const s of sparks) {
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.beginPath(); ctx.arc(s.x, s.y, 2.5 * s.life, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = T.muted; ctx.font = '11px "IBM Plex Mono",monospace'; ctx.textAlign = 'left';
    ctx.fillText('NEXT', PX, BY + 14);
    next.forEach(([r, c]) => { ctx.fillStyle = T.accent; ctx.fillRect(PX + c * 12, BY + 24 + r * 12, 10, 10); });
    ctx.fillStyle = T.muted;
    ctx.fillText('LINES ' + lines, PX, BY + 76);
    ctx.fillText('LEVEL ' + level, PX, BY + 94);
  }

  return {
    key(k, down) {
      if (!down || isOver() || anim || !piece) return;
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        const np = shift(piece, 0, k === 'ArrowLeft' ? -1 : 1);
        if (fits(np)) { piece = np; beep(880, .02); }
      } else if (k === 'ArrowDown') {
        const np = shift(piece, 1, 0);
        if (fits(np)) { piece = np; addScore(1); }
      } else if (k === 'ArrowUp') rotatePiece();
      else if (k === ' ') slam();
    },
    tick(dt) {
      if (!isOver()) {
        if (anim) advance(dt);
        else if (piece) {
          t += dt;
          while (piece && t >= fall) {
            t -= fall;
            const np = shift(piece, 1, 0);
            if (fits(np)) { piece = np; lockT = 0; }
            else if ((lockT += fall) >= LOCK_T) lock();
          }
        }
      }
      for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 120 * dt; s.life -= s.decay * dt; }
      sparks = sparks.filter((s) => s.life > 0);
      draw();
    },
  };
}

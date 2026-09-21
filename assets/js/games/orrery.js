// games/orrery.js — Solar System, an orrery you can fly into.
//
// Two levels of detail, because they have very different budgets:
//   map   — everything at once, so bodies are flat vector discs (a few dozen
//           canvas ops a frame, whatever is on screen)
//   zoom  — one body, so it gets a real per-pixel sphere: normals, a terminator
//           and a procedural equirectangular texture, all generated in JS
//
// The sphere's expensive part (normal, latitude, base longitude, lambert term
// per pixel) is invariant under spin, so it is computed once when a body is
// selected. A frame then costs two array reads and one write per pixel, with
// the colour already resolved in a 16-albedo x 64-shade lookup table.
//
// Every figure — the physical ones from the NASA planetary fact sheet and the
// compressed screen ones — lives in _data/solar.yml and arrives here as
// env.data, fetched from /assets/data/solar.json alongside this module.
import { R } from './common.js';

// ── scale ─────────────────────────────────────────────────────────────────
// True ratios are unusable on a 620px canvas: Neptune orbits 30x further out
// than Earth and the Sun is 109 Earths wide, so a true-scale Earth would be a
// fifth of a pixel. Orbit radii and disc sizes are hand-tuned in solar.yml;
// orbital periods are compressed as period^0.45 below, which keeps Mercury
// visibly quick and Pluto visibly slow without making Pluto take half an hour.
const YEAR = 13;                        // seconds of screen time per Earth year
const SQUASH = 0.40;                    // orbit ellipse minor/major — a tilted plane

// ── colour ────────────────────────────────────────────────────────────────
const LE = (() => { const b = new ArrayBuffer(4); new Uint32Array(b)[0] = 1; return new Uint8Array(b)[0] === 1; })();
const pack = LE
  ? (r, g, b) => (255 << 24 | b << 16 | g << 8 | r) >>> 0
  : (r, g, b) => (r << 24 | g << 16 | b << 8 | 255) >>> 0;

function rgbOf(c, fb) {
  if (typeof c === 'string') {
    let h = c.trim();
    if (h[0] === '#') {
      h = h.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      const n = parseInt(h.slice(0, 6), 16);
      if (h.length >= 6 && !isNaN(n)) return [n >> 16 & 255, n >> 8 & 255, n & 255];
    }
    const m = /rgba?\(([^)]+)\)/i.exec(h);
    if (m) { const p = m[1].split(',').map(parseFloat); if (p.length >= 3) return [p[0] | 0, p[1] | 0, p[2] | 0]; }
  }
  return fb;
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a === undefined ? 1 : a})`;

// ── procedural textures ───────────────────────────────────────────────────
// 256 x 128 maps of an albedo index 0..15. Longitude wraps; v is sin(latitude),
// NOT latitude. That matters twice over: it has to match how the sphere samples
// it (sampling a latitude-linear map by the normal's y drags the poles down over
// the mid-latitudes and puts ice caps on the temperate zones), and it makes the
// sphere's per-pixel lookup a plain lerp instead of an asin.
const TW = 256, TH = 128;

// atan2 restricted to the upper half plane (nz is never negative), to ~5e-4 rad
// — twenty times finer than one texel. A libm atan2 per pixel was most of the
// cost of selecting a body.
function atanUp(y, x) {
  const ax = x < 0 ? -x : x;
  const wide = ax > y;
  const a = wide ? y / (ax + 1e-9) : ax / (y + 1e-9);
  const s = a * a;
  let r = ((-0.0464964749 * s + 0.15931422) * s - 0.327622764) * s * a + a;
  if (!wide) r = 1.5707963267948966 - r;
  return x < 0 ? Math.PI - r : r;
}

// A small fixed random table, not a hash per sample. Generating one body's
// texture takes a few hundred thousand lookups and the imul/shift chain of a
// proper hash dominated the cost — this turns each one into an array read, and
// keeps every body looking the same on every visit.
const RND = new Float32Array(8192);
{
  let s = 0x2f6e2b1;
  for (let i = 0; i < RND.length; i++) {
    s = (Math.imul(s ^ s >>> 15, 0x45d9f3b) + 0x9e3779b9) | 0;
    RND[i] = ((s >>> 8) & 0xffff) / 0xffff;
  }
}
const hash = (x, y, s) => RND[(x * 1619 + y * 31337 + s * 6971) & 8191];
// value noise on a cylinder: fu must be an integer so longitude tiles
function vnoise(u, v, fu, fv, s) {
  const x = u * fu, y = v * fv;
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const tx = x - x0, ty = y - y0;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const xa = (x0 % fu + fu) % fu, xb = (xa + 1) % fu;
  const ya = y0 < 0 ? 0 : y0 > fv ? fv : y0, yb = ya + 1 > fv ? fv : ya + 1;
  const a = hash(xa, ya, s), b = hash(xb, ya, s), c = hash(xa, yb, s), d = hash(xb, yb, s);
  const t = a + (b - a) * sx;
  return t + (c + (d - c) * sx - t) * sy;
}
function fbm(u, v, fu, fv, s, oct) {
  let amp = 0.5, sum = 0, norm = 0;
  for (let o = 0; o < oct; o++) {
    sum += amp * vnoise(u, v, fu << o, Math.max(2, fv << o), s + o * 31);
    norm += amp; amp *= 0.5;
  }
  return sum / norm;
}

function makeTexture(body) {
  const tex = new Uint8Array(TW * TH);
  const kind = body.tex || 'rock';
  const seed = body.id.charCodeAt(0) * 37 + body.id.length * 11;
  for (let y = 0; y < TH; y++) {
    const v = y / TH, lat = v * 2 - 1;             // sin(latitude), −1 .. 1
    const clat = Math.sqrt(Math.max(0, 1 - lat * lat));
    for (let x = 0; x < TW; x++) {
      const u = x / TW;
      let a;
      if (kind === 'bands') {
        // latitude bands with the turbulence stretched around the equator
        const wob = fbm(u, v, 3, 6, seed, 2) - 0.5;
        const b = Math.sin(lat * 15 + wob * 3.4) * 0.5 + 0.5;
        a = 0.28 + b * 0.62 + (fbm(u, v, 8, 3, seed + 5, 2) - 0.5) * 0.18;
        a *= 0.72 + 0.28 * clat;                    // poles a touch darker
      } else if (kind === 'earth') {
        const n = fbm(u, v, 4, 3, seed, 3);
        const ice = Math.abs(lat) > 0.87 ? 1 : 0;   // |latitude| > 60°
        a = ice ? 0.96 : n > 0.57 ? 0.6 + (n - 0.57) * 2.4 : 0.06 + n * 0.3;   // ~70% ocean
      } else if (kind === 'cloud') {
        a = 0.55 + (fbm(u, v, 3, 5, seed, 3) - 0.5) * 0.9;
        a = 0.52 + a * 0.46;
      } else if (kind === 'sun') {
        a = 0.62 + (fbm(u, v, 14, 9, seed, 2) - 0.5) * 0.8;
      } else if (kind === 'comet') {
        a = 0.2 + fbm(u, v, 7, 5, seed, 3) * 0.55;
      } else {                                      // rock / cratered
        const n = fbm(u, v, 5, 4, seed, 3);
        a = 0.2 + n * 0.75;
      }
      tex[y * TW + x] = Math.max(0, Math.min(15, a * 15 + 0.5)) | 0;
    }
  }
  // craters: a bright rim and a dark floor, squeezed in longitude near the poles
  if (kind === 'cratered' || kind === 'rock' || kind === 'comet') {
    const n = kind === 'cratered' ? 46 : kind === 'comet' ? 30 : 22;
    for (let i = 0; i < n; i++) {
      const cy = 8 + R() * (TH - 16), cx = R() * TW;
      const rad = 3 + R() * (kind === 'rock' ? 9 : 13);
      const sq = 1 / Math.max(0.25, Math.cos((cy / TH - 0.5) * Math.PI));
      for (let y = Math.max(0, cy - rad | 0); y < Math.min(TH, cy + rad + 1); y++)
        for (let d = -rad * sq; d <= rad * sq; d++) {
          const x = (cx + d | 0) % TW, xi = x < 0 ? x + TW : x;
          const dx = d / sq, dy = y - cy, r2 = Math.sqrt(dx * dx + dy * dy) / rad;
          if (r2 > 1) continue;
          const o = y * TW + xi;
          tex[o] = Math.max(0, Math.min(15, tex[o] + (r2 > 0.78 ? 3 : -4))) | 0;
        }
    }
  }
  // Jupiter's storm
  if (body.spot) {
    const cx = TW * 0.62, cy = TH * 0.61, rx = 26, ry = 11;
    for (let y = cy - ry | 0; y <= cy + ry; y++)
      for (let x = cx - rx | 0; x <= cx + rx; x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry, d = dx * dx + dy * dy;
        if (d > 1) continue;
        const o = y * TW + (x % TW);
        tex[o] = Math.max(0, Math.min(15, tex[o] - 7 + d * 4)) | 0;
      }
  }
  return tex;
}

export default function orrery(env) {
  const { ctx, W, H, T, beep, addScore, data } = env;
  // Every figure — physical and screen — lives in _data/solar.yml and arrives
  // here as /assets/data/solar.json. See that file for what each field means.
  const BODIES = data.bodies, COMETS = data.comets;
  const ALL = BODIES.concat(COMETS);
  const CX = W / 2, CY = H * 0.52;              // map centre
  const ZX = 170, ZY = 200;                     // zoomed body centre
  const PX = 344;                               // info panel left edge
  const BG = rgbOf(T.bg, [241, 238, 232]);
  const MONO = '"IBM Plex Mono",monospace';

  let time = 0, paused = false;
  let hover = null, sel = null, zoom = 0, zoomTo = 0;
  let spin = 0, spinVel = 0, drag = false, dragX = 0;
  let found = {}, foundN = 0;
  let noteLines = [];

  // ── sphere: geometry is rebuilt per body, texture and palette are cached ──
  let tile = null, tctx = null, img = null, buf = null;
  let gIdx = null, gU = null, gV = null, gSh = null, gN = 0, gD = 0, gBody = null;
  const texCache = {};
  let lut = new Uint32Array(16 * 64);

  // The night side has to be derived per albedo, not from one colour: fading the
  // whole sphere towards the page makes a dark ocean brighter in shadow than in
  // daylight. A star gets limb darkening instead of a terminator.
  function buildPalette(body) {
    for (let c = 0; c < 16; c++) {
      const base = mix(body.tint, body.tint2, c / 15);
      const night = body.glow
        ? mix(base, body.tint, 0.55)
        : mix([base[0] * 0.20, base[1] * 0.20, base[2] * 0.22], BG, 0.10);
      for (let s = 0; s < 64; s++) {
        const k = s / 63;
        const col = mix(night, base, k * k * (3 - 2 * k));
        lut[c << 6 | s] = pack(col[0], col[1], col[2]);
      }
    }
  }

  // Everything here is invariant under spin, which is the whole trick: the
  // per-frame loop only shifts the longitude index and looks the colour up.
  // One tile, sized for the largest body, reused by every other. Reallocating
  // ~500 KB of typed arrays and a canvas on each selection cost more than all
  // the trigonometry put together.
  const MAXD = 2 * ALL.reduce((m, b) => Math.max(m, b.zr), 0);

  function buildSphere(body) {
    const r = body.zr, D = 2 * r;
    gD = D;
    if (!tile) {
      tile = document.createElement('canvas');
      tile.width = tile.height = MAXD;
      tctx = tile.getContext('2d');
      img = tctx.createImageData(MAXD, MAXD);
      buf = new Uint32Array(img.data.buffer);
      const cap = MAXD * MAXD;
      gIdx = new Int32Array(cap); gU = new Uint8Array(cap);
      gV = new Uint8Array(cap); gSh = new Uint8Array(cap);
    } else {
      buf.fill(0);
    }
    const t = body.tilt * Math.PI / 180, ct = Math.cos(t), st = Math.sin(t);
    // Light from the left and a little in front — far enough off-axis to put a
    // real terminator on the disc rather than lighting it flat from the camera.
    const lx = -0.66, ly = -0.34, lz = 0.67;
    let n = 0;
    for (let y = 0; y < D; y++) {
      const ny = (y - r + 0.5) / r;
      for (let x = 0; x < D; x++) {
        const nx = (x - r + 0.5) / r;
        let lim = 1;
        if (body.comet) {                      // a lumpy rock, not a sphere
          const a = Math.atan2(ny, nx);
          lim = 1 - 0.16 * Math.abs(Math.sin(a * 2 + 1.1)) - 0.10 * Math.sin(a * 3 + 0.4);
          lim *= lim;
        }
        const d2 = nx * nx + ny * ny;
        if (d2 > lim) continue;
        const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, d2)));
        // undo the axial tilt to get body-frame coordinates
        const bx = nx * ct + ny * st, by = -nx * st + ny * ct;
        const sh = 0.12 + 0.88 * Math.max(0, nx * lx + ny * ly + nz * lz);
        gIdx[n] = y * MAXD + x;
        // v is sin(latitude) in the texture too, so this is the whole mapping
        gV[n] = Math.min(TH - 1, (by * 0.5 + 0.5) * TH) | 0;
        gU[n] = (atanUp(nz, bx) / (Math.PI * 2) * TW + TW) & 255;
        gSh[n] = Math.min(63, sh * 63) | 0;
        n++;
      }
    }
    gN = n;
    gBody = body;
    if (!texCache[body.id]) texCache[body.id] = makeTexture(body);
    buildPalette(body);
  }

  function paintSphere() {
    const tex = texCache[gBody.id];
    const s = (spin / (Math.PI * 2) * TW | 0) & 255;
    for (let i = 0; i < gN; i++) buf[gIdx[i]] = lut[tex[gV[i] << 8 | (gU[i] + s & 255)] << 6 | gSh[i]];
    tctx.putImageData(img, 0, 0);
  }

  // ── orbital state ─────────────────────────────────────────────────────────
  // period^0.45 keeps the inner planets quick and the outer ones slow without
  // making Neptune take half an hour to get anywhere.
  for (const b of ALL) {
    b.rate = b.period ? (Math.PI * 2) / (YEAR * Math.pow(b.period / 365.2, 0.45)) : 0;
    b.ang = R() * Math.PI * 2;
    b.sx = CX; b.sy = CY;
    // Speed only — the DIRECTION comes from the axial tilt, which is already how
    // retrograde rotation is expressed: an obliquity past 90° is a pole pointing
    // the other way. Venus is 177°, Uranus 98°, Pluto 123°. Taking the sign of
    // `rot` as well applied that flip twice and cancelled it out.
    b.spinRate = b.rot ? Math.max(0.12, 1.6 / Math.pow(Math.abs(b.rot) / 24, 0.5)) : 0.3;
    // ...and because a tilt past 90° mirrors the longitude mapping, a drag has to
    // be mirrored with it to keep following the pointer.
    b.flip = Math.cos((b.tilt || 0) * Math.PI / 180) < 0 ? -1 : 1;
  }

  function place(b) {
    if (!b.period) { b.sx = CX; b.sy = CY; return; }
    if (b.comet) {
      // ellipse with the Sun at a focus, so it whips through perihelion
      const p = b.a * (1 - b.ecc * b.ecc), rr = p / (1 + b.ecc * Math.cos(b.ang));
      const o = b.arg * Math.PI / 180, co = Math.cos(o), so = Math.sin(o);
      const x = rr * Math.cos(b.ang), y = rr * Math.sin(b.ang);
      b.sx = CX + (x * co - y * so);
      b.sy = CY + (x * so + y * co) * SQUASH;
      b.r = rr;
    } else {
      const e = b.ecc || 0, rr = b.orbit * (1 - e * e) / (1 + e * Math.cos(b.ang));
      b.sx = CX + rr * Math.cos(b.ang);
      b.sy = CY + rr * Math.sin(b.ang) * SQUASH;
      b.r = rr;
    }
  }
  for (const b of ALL) place(b);

  // trace each comet's path with place() itself, so the drawn orbit and the
  // nucleus can never disagree
  for (const c of COMETS) {
    const keep = c.ang, p = [];
    for (let i = 0; i <= 96; i++) { c.ang = i / 96 * Math.PI * 2; place(c); p.push(c.sx, c.sy); }
    c.ang = keep; place(c);
    c.path = p;
  }

  // asteroid belt — positions once, rotated as a whole
  const belt = [];
  for (let i = 0; i < 110; i++) belt.push({ a: R() * Math.PI * 2, r: 114 + R() * 22, s: R() < 0.3 ? 2 : 1 });

  // starfield, baked once
  const stars = document.createElement('canvas');
  stars.width = W; stars.height = H;
  {
    const s = stars.getContext('2d');
    for (let i = 0; i < 150; i++) {
      const x = R() * W, y = R() * H, a = 0.12 + R() * 0.5;
      s.fillStyle = css(rgbOf(T.muted, [111, 106, 120]), a);
      s.fillRect(x | 0, y | 0, R() < 0.12 ? 2 : 1, 1);
    }
  }

  function wrapNote(text, max) {
    ctx.font = `10px ${MONO}`;
    const words = text.split(' '), out = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > max && line) { out.push(line); line = w; } else line = t;
    }
    if (line) out.push(line);
    return out.slice(0, 5);
  }

  function select(b) {
    sel = b; zoomTo = 1; spin = 0; spinVel = 0;
    buildSphere(b);
    noteLines = wrapNote(b.note, W - PX - 18);
    if (!found[b.id]) { found[b.id] = 1; foundN++; addScore(25); }
    beep(560, 0.05);
  }
  function back() {
    if (!sel) return;
    zoomTo = 0; drag = false; beep(300, 0.05);
  }

  // ── drawing ───────────────────────────────────────────────────────────────
  function bodyColour(b, lit) {
    return css(lit ? mix(b.tint, b.tint2, 0.62) : mix(b.tint, BG, 0.55));
  }

  function drawMap(alpha, scale) {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (scale !== 1 && sel) {
      ctx.translate(sel.sx, sel.sy); ctx.scale(scale, scale); ctx.translate(-sel.sx, -sel.sy);
    }

    // orbits. Comet paths are traced from the same maths that places the comet,
    // sampled once at startup — a transformed ellipse would have to compose
    // rotate-then-squash in exactly the right order to stay under the nucleus.
    ctx.lineWidth = 1;
    for (const b of ALL) {
      if (!b.period) continue;
      ctx.strokeStyle = b === hover || b === sel ? T.accent : T.line;
      ctx.beginPath();
      if (b.comet) {
        const p = b.path;
        ctx.moveTo(p[0], p[1]);
        for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
        ctx.closePath();
      } else {
        const e = b.ecc || 0;
        ctx.ellipse(CX - b.orbit * e, CY, b.orbit, b.orbit * Math.sqrt(1 - e * e) * SQUASH, 0, 0, 7);
      }
      ctx.stroke();
    }

    // asteroid belt
    ctx.fillStyle = T.line;
    const ba = time * 0.06;
    for (const a of belt) {
      const x = CX + Math.cos(a.a + ba) * a.r, y = CY + Math.sin(a.a + ba) * a.r * SQUASH;
      ctx.fillRect(x | 0, y | 0, a.s, a.s);
    }

    // the Sun
    const sun = BODIES[0];
    // the corona has to stop short of Mercury's orbit or it washes it out
    const grd = ctx.createRadialGradient(CX, CY, sun.size * 0.6, CX, CY, sun.size * 2.4);
    grd.addColorStop(0, css(sun.tint2, 0.42));
    grd.addColorStop(1, css(sun.tint2, 0));
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(CX, CY, sun.size * 2.4, 0, 7); ctx.fill();
    ctx.fillStyle = css(sun.tint2);
    ctx.beginPath(); ctx.arc(CX, CY, sun.size, 0, 7); ctx.fill();
    if (hover === sun || sel === sun) {
      ctx.strokeStyle = T.accent; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(CX, CY, sun.size + 6, 0, 7); ctx.stroke();
    }

    // comet tails, then bodies
    for (const c of COMETS) {
      const dx = c.sx - CX, dy = c.sy - CY, d = Math.hypot(dx, dy) || 1;
      const len = Math.max(10, 3400 / Math.max(28, c.r));
      const ux = dx / d, uy = dy / d;
      ctx.fillStyle = T.soft;
      ctx.beginPath();
      ctx.moveTo(c.sx - uy * 3, c.sy + ux * 3);
      ctx.lineTo(c.sx + ux * len, c.sy + uy * len);
      ctx.lineTo(c.sx + uy * 3, c.sy - ux * 3);
      ctx.closePath(); ctx.fill();
    }

    ctx.font = `10px ${MONO}`;
    ctx.textAlign = 'center';
    for (const b of ALL) {
      if (!b.period) continue;
      const r = b.size;
      ctx.fillStyle = bodyColour(b, true);
      ctx.beginPath(); ctx.arc(b.sx, b.sy, r, 0, 7); ctx.fill();
      // only a ring you could actually pick out at this size — Jupiter's and
      // Neptune's are real but far too faint to draw as a 14px ellipse
      if (b.rings && b.rings.some((x) => x[2] >= 0.3)) {
        ctx.strokeStyle = bodyColour(b, true); ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(b.sx, b.sy, r * 2.1, r * 0.7, -0.35, 0, 7);
        ctx.stroke();
      }
      if (b === hover || b === sel) {
        ctx.strokeStyle = T.accent; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(b.sx, b.sy, r + 5, 0, 7); ctx.stroke();
      }
      if (!b.comet || b === hover) {
        ctx.fillStyle = b === hover ? T.accent : T.muted;
        ctx.fillText(b.name, Math.max(22, Math.min(W - 22, b.sx)), b.sy + r + 11);
      }
    }
    ctx.restore();
  }

  // One stroked ellipse per band, with the band's radial thickness as the line
  // width. band[2] is its opacity — Jupiter's ring is real but almost invisible,
  // and drawing it at full strength turns Jupiter into Saturn.
  function ringPath(cx, cy, r, band, tilt, half, col, a) {
    const mid = (band[0] + band[1]) / 2;
    ctx.strokeStyle = css(col, a * band[2]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * mid, r * mid * 0.34, tilt, half ? 0 : Math.PI, half ? Math.PI : Math.PI * 2);
    ctx.lineWidth = Math.max(1, r * (band[1] - band[0]));
    ctx.stroke();
  }

  function drawMoons(b, cx, cy, k, behind) {
    if (!b.moons) return;
    ctx.font = `9px ${MONO}`;
    ctx.textAlign = 'center';
    for (let i = 0; i < b.moons.length; i++) {
      const m = b.moons[i];
      // real periods compressed the same way the orbits are, so Phobos still
      // laps Deimos without doing four revolutions a second. The index keeps
      // same-length names (Ganymede, Callisto) from sharing a phase.
      const a = time * (0.6 / Math.sqrt(Math.abs(m.p))) * (m.p < 0 ? -1 : 1) + i * 1.7 + m.name.length * 0.3;
      const z = Math.cos(a);
      if ((z < 0) !== behind) continue;
      const x = cx + Math.sin(a) * m.d * k, y = cy - Math.cos(a) * m.d * k * 0.3;
      ctx.fillStyle = css(mix(m.tint, BG, 0.15));
      ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, m.r * k), 0, 7); ctx.fill();
      if (k > 0.7) {
        ctx.fillStyle = T.muted;
        ctx.fillText(m.name, x, y + m.r * k + 10);
      }
    }
  }

  function drawZoom(alpha, k, cx, cy) {
    const b = sel, r = b.zr * k;
    ctx.save();
    ctx.globalAlpha = alpha;

    if (b.id === 'sun' || b.comet) {                 // glow / coma
      const g = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * (b.comet ? 2.6 : 1.9));
      g.addColorStop(0, css(b.tint2, b.comet ? 0.26 : 0.42));
      g.addColorStop(1, css(b.tint2, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r * (b.comet ? 2.6 : 1.9), 0, 7); ctx.fill();
    }

    const tilt = -b.tilt * Math.PI / 180;
    const far = mix(b.tint2, BG, 0.4), near = mix(b.tint2, BG, 0.22);
    if (b.rings) for (const bd of b.rings) ringPath(cx, cy, r, bd, tilt, false, far, 0.85);
    drawMoons(b, cx, cy, k, true);

    ctx.drawImage(tile, 0, 0, gD, gD, cx - r, cy - r, r * 2, r * 2);

    if (b.rings) for (const bd of b.rings) ringPath(cx, cy, r, bd, tilt, true, near, 0.95);
    drawMoons(b, cx, cy, k, false);

    if (b.comet) {                                    // tail, away from the Sun
      const len = Math.min(r * 2.7, PX - 24 - cx);    // never reach under the panel
      const g = ctx.createLinearGradient(cx, cy, cx + len, cy - r * 0.8);
      g.addColorStop(0, css(b.tint2, 0.32));
      g.addColorStop(1, css(b.tint2, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx + len, cy - r * 2.3);
      ctx.lineTo(cx + len, cy + r * 0.7); ctx.lineTo(cx, cy + r);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawPanel(alpha, slide) {
    const b = sel, x = PX + slide;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'left';

    ctx.fillStyle = T.accent;
    ctx.fillRect(x, 26, 2, 15);
    ctx.font = `700 15px ${MONO}`;
    ctx.fillStyle = T.ink;
    ctx.fillText(b.name.toUpperCase(), x + 9, 39);
    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = T.muted;
    ctx.fillText(b.kind, x + 9, 53);

    ctx.strokeStyle = T.line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, 62.5); ctx.lineTo(W - 12, 62.5); ctx.stroke();

    let y = 78;
    for (const [k, v] of b.facts) {
      ctx.font = `9px ${MONO}`;
      ctx.fillStyle = T.muted;
      ctx.fillText(k, x, y);
      ctx.font = `11px ${MONO}`;
      ctx.fillStyle = T.ink;
      ctx.fillText(v, x, y + 12);
      y += 27;
    }

    ctx.beginPath(); ctx.moveTo(x, y - 8.5); ctx.lineTo(W - 12, y - 8.5); ctx.stroke();
    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = T.muted;
    for (let i = 0; i < noteLines.length; i++) ctx.fillText(noteLines[i], x, y + 6 + i * 13);
    ctx.restore();
  }

  function drawHud() {
    ctx.font = `11px ${MONO}`;
    ctx.textAlign = 'left';
    if (sel && zoom > 0.6) {
      ctx.fillStyle = zoom > 0.9 ? T.ink : T.muted;
      ctx.fillText('‹ SYSTEM', 12, 22);
      ctx.strokeStyle = T.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(12, 28.5); ctx.lineTo(78, 28.5); ctx.stroke();
      ctx.fillStyle = T.muted;
      ctx.font = `9px ${MONO}`;
      ctx.fillText('drag to rotate', 12, H - 12);
    } else {
      ctx.fillStyle = T.muted;
      ctx.fillText(`${foundN}/${ALL.length} visited`, 10, 18);
      ctx.font = `9px ${MONO}`;
      ctx.fillText(paused ? 'time paused · space' : 'click a world · space pauses time', 10, H - 12);
    }
  }

  function draw() {
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(stars, 0, 0);

    const e = zoom * zoom * (3 - 2 * zoom);
    if (zoom < 0.999) drawMap(1 - e, 1 + e * 1.9);
    if (sel) {
      const k = (sel.size / sel.zr) + (1 - sel.size / sel.zr) * e;
      const cx = sel.sx + (ZX - sel.sx) * e, cy = sel.sy + (ZY - sel.sy) * e;
      if (zoom > 0.02) {
        paintSphere();
        drawZoom(Math.min(1, e * 2.2), k, cx, cy);
      }
      if (e > 0.5) drawPanel((e - 0.5) * 2, (1 - e) * 2 * (W - PX));
    }
    drawHud();
  }

  return {
    key(k, down) {
      if (!down) return;
      if (k === 'Escape' || k === 'Backspace') back();
      else if (k === ' ') { paused = !paused; beep(paused ? 320 : 480, 0.04); }
    },
    pointer(x, y, type) {
      if (type === 'down') {
        if (sel && zoom > 0.5) {
          if (x < 92 && y < 34) { back(); return; }
          if (Math.hypot(x - ZX, y - ZY) < sel.zr * 1.25) { drag = true; dragX = x; }
          return;
        }
        if (zoom > 0.02) return;
        let best = null, bd = 16;
        for (const b of ALL) {
          const d = Math.hypot(x - b.sx, y - b.sy);
          if (d < Math.max(9, b.size + 6) && d < bd) { bd = d; best = b; }
        }
        if (best) select(best);
      } else if (type === 'move') {
        if (drag) {
          // Drag right, surface right — on every body, including the three
          // whose longitude mapping is mirrored by an obliquity past 90°.
          const dx = (x - dragX) * sel.flip;
          spin += dx * 0.012;          // 1:1 with the pointer
          spinVel = dx * 0.8;          // carried on as momentum when released
          dragX = x;
          return;
        }
        if (zoom > 0.02) return;
        const was = hover;
        hover = null;
        let bd = 18;
        for (const b of ALL) {
          const d = Math.hypot(x - b.sx, y - b.sy);
          if (d < Math.max(11, b.size + 7) && d < bd) { bd = d; hover = b; }
        }
        // Generating a body's texture is the one genuinely slow step. Do it on
        // hover — same trick the arcade uses to warm a game's module — so the
        // click itself only pays for the sphere geometry.
        if (hover && hover !== was && !texCache[hover.id]) texCache[hover.id] = makeTexture(hover);
      } else if (type === 'up') {
        drag = false;
      }
    },
    tick(dt) {
      if (!paused) {
        time += dt;
        for (const b of ALL) if (b.rate) { b.ang += b.rate * dt * (b.comet ? Math.pow(b.a / Math.max(20, b.r), 2) : 1); place(b); }
      }
      zoom += Math.max(-dt * 2.2, Math.min(dt * 2.2, zoomTo - zoom));
      if (zoom < 0.005 && zoomTo === 0) { zoom = 0; if (sel) { sel = null; hover = null; } }
      if (sel) {
        if (!drag) {
          // Increasing `spin` carries the surface to the RIGHT, which is how a
          // prograde world should look from the Sun — so this sign is correct
          // and stays. It was the drag that ran backwards; see pointer().
          spin += ((paused ? 0 : sel.spinRate * 0.25) + spinVel) * dt;
          spinVel *= Math.pow(0.03, dt);
        }
        spin = (spin % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      }
      draw();
    },
  };
}

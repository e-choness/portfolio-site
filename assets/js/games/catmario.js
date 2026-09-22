// games/catmario.js — Syobon Action (しょぼんのアクション), a.k.a. Cat Mario.
// The rules are Chiku's own, translated line for line into catmario/engine.js;
// this file is everything the original's rpaint() and main loop did around
// them: input, the 30 fps clock, the per-frame bookkeeping rpaint() quietly
// owned, and a vector redraw of every sprite in the site's palette. No image
// files — each sprite is drawn once into a small offscreen canvas at the
// stage's scale and blitted from then on.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
import { createEngine } from './catmario/engine.js';

const VW = 480, VH = 420, STEP = 1 / 30;
const STAGES = [[1, 1], [1, 2], [1, 3], [1, 4], [2, 1], [2, 2], [2, 3], [2, 4], [3, 1]];
const SAVE = 'echoos-catmario-stage';

// Browser key → the key name the engine asks hit() about. Jump is UP (the
// original also took Z); SPACE was its fast-forward, which moves to Shift here
// so Space can jump like every other game in the arcade.
const KEYS = {
  arrowleft: 'LEFT', a: 'LEFT', arrowright: 'RIGHT', d: 'RIGHT', arrowdown: 'DOWN', s: 'DOWN',
  arrowup: 'UP', w: 'UP', ' ': 'UP', z: 'UP', x: 'UP', enter: 'RETURN', o: 'O', escape: 'F1', shift: 'SPACE',
};
// Sound-effect ids from the original's SE folder, as square-wave beeps.
const SFX = {
  1: [520, .05], 3: [140, .08], 4: [988, .05], 5: [300, .06], 6: [200, .04], 7: [110, .14],
  8: [660, .06], 9: [784, .14], 10: [90, .12], 11: [880, .3], 12: [196, .4], 13: [600, .08],
  14: [700, .06], 15: [1046, .08], 16: [1318, .35], 17: [1568, .45], 18: [240, .06],
};

// What the cat says — mmsgtype in the original.
const SAY = {
  1: 'Delicious!!', 2: 'Not poisonous, but…', 3: 'It stuck!!', 10: 'Should NOT have eaten that!!',
  11: "I'm a man on fire!!", 50: 'My body… it burns…', 51: 'Tamaya~!!', 52: 'Utterly doomed',
  53: 'My legs! My legs!!', 54: 'As expected of 800°C!!', 55: 'I long to be one with the lava…',
};
// What the enemies say — amsgtype. 1001–1038 are the four sets of taunts an
// enemy picks from after it kills you.
const TAUNTS = [
  ['Yahoo!!', 'Wait, did I win?', 'This is where you die!', "We'll never meet again", "I'm the strongest!!", 'Come back yesterday!!', 'A real man never retreats!!', 'Ha-haa!!'],
  ['Yahoo!!', 'Wait, did I win?', 'This is where you die!', 'Know your place…', 'Carelessness kills', 'How naive', 'Scum!!', 'So reckless…'],
  ['Yahoo!!', 'Wait, did I win?', "We'll never meet again", 'Know your place…', "I… won't lose!!", "You'll never read my moves", 'Die now, die fast, crumble to dust!!', 'Mission complete!!'],
];
const ENEMY_SAY = {
  15: 'Iron wall!! So: invincible!!', 16: 'Think you can win bare-handed?', 17: 'Parry!!', 18: 'You did this to yourself',
  20: 'Zzz', 21: 'B-bear…', 24: '?', 25: 'Should NOT have eaten that!!', 30: 'Tasty!!',
  31: 'Underestimated a block, huh?', 32: '*shing*', 50: 'Wave cannon!!', 85: 'Thought I betrayed you?', 86: 'Pole attack!!',
};
function tauntFor(n) {
  if (n > 1000 && n < 1040) { const i = (n - 1000) / 10 | 0; return TAUNTS[i === 3 ? 1 : i][n % 10 - 1] || ''; } // the 103x set repeats 101x
  return ENEMY_SAY[n] || '';
}
// Hint blocks — tmsg. [line, text] pairs; the line number is the original's.
const HINT = {
  1: [[1, 'From Stage 1 on, there are more'], [2, 'special gimmicks, so be careful~'], [4, 'Also, you may need to use some items…'], [6, '                          — Chiku']],
  2: [[3, '   You need a  ?  for this.'], [6, '                       m9(^Д^)']],
  3: [[3, "   Coins don't mean anything, by the way"], [6, '                      (・ω・ )ﾉｼ']],
  4: [[2, "There's a hidden block up ahead."], [4, 'Watch out!!']],
  5: [[1, ' I made it easier than last time,'], [3, ' so just relax and play.'], [6, '                          — Chiku']],
  6: [[1, ' Get close to the enemy over there'], [2, ' and it will jump along with you.'], [3, ' Cute, right?']],
  7: [[1, ' Did you manage to bring that enemy?'], [2, " If you didn't,"], [3, " dive into that pit! Let's dive!"]],
  8: [[1, "Don't lean on hints so easily."], [2, 'Go on, get moving!!']],
  9: [[1, ' The true, honest final stage.'], [2, ' Clear it and the ending is yours!!'], [3, ' You can go back through that pipe, y\'know?']],
  10: [[1, " The floor is frozen. It's super slippery."]],
  100: [[0, 'Huh? Me?'], [2, "Oh, I'm just a hint block"], [3, 'passing through~'], [5, 'Definitely not a suspicious block'], [6, '                          (…tch)']],
};
const CREDITS = [
  [12, 'Everyone who helped make and play this'], [13, 'Stage 1 playtest'], [15, 'Stage 2 playtest'], [16, 'my friend willowlet'],
  [17, 'Stage 3 playtest'], [18, 'my friend willowlet'], [19, 'Stage 4 playtest'], [20, 'my friend #2, ann'],
  [21, 'With help from'], [22, 'Senpai T'], [23, 'Senpai S'], [24, 'Video know-how'], [25, 'Senpai K'],
  [26, 'Capture, editing, encoding'], [27, 'willowlet'], [28, 'Program, art, gags, video'], [29, 'Chiku'],
  [30, 'Thank you so much for playing~'],
];

export default function catmario(env) {
  const { ctx, W, H, T, addScore } = env;
  const S = H / VH, OX = Math.round((W - VW * S) / 2), MONO = '"IBM Plex Mono",monospace';
  const held = {};
  let fresh = false, waitMsg = false, acc = 0, sel = 0, deaths = 0, lastLives = 0, lastStage = 0, dirty = true;
  const sounds = [];
  try { sel = Math.max(0, Math.min(8, +localStorage.getItem(SAVE) || 0)); } catch (e) { /* storage blocked */ }

  const E = createEngine({ hit: (k) => (held[k] ? 1 : 0), snd: (n) => { if (SFX[n]) sounds.push(n); }, bgm() {} });
  const g = E.g;

  // ── palette ────────────────────────────────────────────────────────────
  const probe = document.createElement('canvas').getContext('2d');
  function rgb(c) {
    probe.fillStyle = '#000'; probe.fillStyle = c;
    const v = probe.fillStyle;
    if (v[0] === '#') return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
    const m = v.match(/[\d.]+/g) || [0, 0, 0];
    return [+m[0], +m[1], +m[2]];
  }
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`; };
  const lum = (c) => { const [r, gg, b] = rgb(c); return r * .3 + gg * .59 + b * .11; };
  const DARK = lum(T.ink) < lum(T.bg) ? T.ink : T.bg, LIGHT = DARK === T.ink ? T.bg : T.ink;
  const C = {
    ink: T.ink, muted: T.muted, acc: T.accent, surf: T.surface, line: T.line,
    pipe: mix(T.surface, T.accent, .2), body: mix(T.surface, T.ink, .06), used: mix(T.surface, T.ink, .16),
    grey: mix(T.surface, T.ink, .22), ghost: mix(T.bg, T.ink, .12),
  };
  // Underground and castle stages sit a shade darker than the sky in either theme.
  const shade = (t) => (DARK === T.ink ? mix(T.bg, T.ink, t) : mix(T.bg, '#000', t * 4));
  const SKY = { 1: T.bg, 2: shade(.07), 3: T.bg, 4: shade(.12), 5: mix(T.bg, T.accent, .05) };

  // ── sprites ────────────────────────────────────────────────────────────
  // Each is drawn once at the stage's scale into its own canvas; the cache is
  // keyed by name and facing. Coordinates inside a sprite are logical pixels.
  const cache = {};
  function sprite(name, flip) {
    const k = name + (flip ? '<' : '');
    if (cache[k]) return cache[k];
    const [w, h, draw] = DEF[name];
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * S) + 4; c.height = Math.ceil(h * S) + 4;
    const x = c.getContext('2d');
    x.translate(2, 2); x.scale(S, S);
    if (flip) { x.translate(w, 0); x.scale(-1, 1); }
    x.lineWidth = 1.5; x.lineJoin = 'round'; x.lineCap = 'round'; x.strokeStyle = C.ink;
    draw(x, w, h);
    return (cache[k] = c);
  }
  function blit(name, lx, ly, flip, vflip) {
    const c = sprite(name, flip), px = Math.round(OX + lx * S) - 2, py = Math.round(ly * S) - 2;
    if (vflip) { ctx.save(); ctx.translate(0, py * 2 + c.height); ctx.scale(1, -1); ctx.drawImage(c, px, py); ctx.restore(); }
    else ctx.drawImage(c, px, py);
  }

  const P = (x, pts, close) => { x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); if (close !== false) x.closePath(); };
  const rr = (x, l, t, w, h, r) => { x.beginPath(); x.roundRect ? x.roundRect(l, t, w, h, r) : x.rect(l, t, w, h); };
  const ell = (x, cx, cy, rx, ry) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 6.2832); };
  const fs = (x, fill) => { x.fillStyle = fill; x.fill(); x.stroke(); };
  const dot = (x, cx, cy, r) => { x.fillStyle = C.ink; x.beginPath(); x.arc(cx, cy, r || 1.4, 0, 6.2832); x.fill(); };
  const line = (x, ...p) => { P(x, p, false); x.stroke(); };
  const txt = (x, s, cx, cy, size, col) => { x.fillStyle = col; x.font = `700 ${size}px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, cx, cy); };

  // The cat. pose: 0 stand, 1 walk, 2 jump, 3 dead. Faces right.
  function cat(x, pose, fill, k) {
    x.save(); x.scale(k || 1, k || 1);
    const lg = pose === 1 ? 2 : 0;
    P(x, [5, 13, 7, 2, 13, 8, 18, 8, 24, 2, 26, 13, 26, 20, 24, 22, 24, 31, 24 + lg, 35, 18 + lg, 35, 17, 31, 13, 31, 12 - lg, 35, 6 - lg, 35, 7, 31, 7, 22, 5, 20]);
    fs(x, fill);
    if (pose === 2) { line(x, 7, 24, 2, 17); line(x, 24, 24, 29, 17); } else { line(x, 8, 24, 5, 28); line(x, 23, 24, 26, 28); }
    if (pose === 3) { line(x, 11, 12, 15, 16); line(x, 15, 12, 11, 16); line(x, 18, 12, 22, 16); line(x, 22, 12, 18, 16); ell(x, 17, 19, 2, 1.5); x.stroke(); }
    else { line(x, 13, 12, 13, 15.5); line(x, 20, 12, 20, 15.5); line(x, 14.5, 18, 16, 19.5, 17.5, 18, 19, 19.5, 20.5, 18); }
    x.restore();
  }
  // A round "face" enemy, the game's goomba. Faces left.
  function face(x, w, h, fill, mood) {
    ell(x, w / 2, h / 2 + 1, w / 2 - 1.5, h / 2 - 2); fs(x, fill);
    dot(x, w * .33, h * .45); dot(x, w * .6, h * .45);
    if (mood === 'grin') line(x, w * .3, h * .66, w * .45, h * .74, w * .65, h * .66);
    else if (mood === 'v') line(x, w * .38, h * .62, w * .47, h * .75, w * .56, h * .62);
    else line(x, w * .36, h * .68, w * .58, h * .68);
  }
  function tile(x, kind) {
    const L = .75, R = 29.25;
    if (kind === 'q' || kind === 'hint' || kind === 'on' || kind === 'off' || kind === 'pswitch') {
      rr(x, L, L, R - L, R - L, 3); fs(x, kind === 'off' ? C.grey : C.acc);
      if (kind === 'hint') { ell(x, 15, 15, 9, 9); x.strokeStyle = C.surf; x.stroke(); line(x, 9, 15, 21, 15); line(x, 15, 6, 15, 24); return; }
      txt(x, { q: '?', on: 'ON', off: 'OFF', pswitch: 'P' }[kind], 15, 16, kind === 'q' || kind === 'pswitch' ? 19 : 10, C.surf);
      return;
    }
    x.beginPath(); x.rect(L, L, R - L, R - L);
    if (kind === 'brick') {
      fs(x, C.surf); x.strokeStyle = C.muted; x.lineWidth = 1;
      line(x, L, 10, R, 10); line(x, L, 20, R, 20); line(x, 10, L, 10, 10); line(x, 22, 10, 22, 20); line(x, 10, 20, 10, R);
    } else if (kind === 'used') {
      fs(x, C.used); [5, 25].forEach((a) => [5, 25].forEach((b) => dot(x, a, b, 1.2)));
    } else if (kind === 'hard' || kind === 'stone') {
      fs(x, kind === 'stone' ? C.grey : C.body); x.lineWidth = 1; x.strokeStyle = C.muted;
      x.strokeRect(6, 6, 18, 18); line(x, L, L, 6, 6); line(x, R, L, 24, 6); line(x, L, R, 6, 24); line(x, R, R, 24, 24);
    } else if (kind === 'gtop') {
      x.fillStyle = C.body; x.fill(); x.lineWidth = 2.5; line(x, 0, 1.25, 30, 1.25);
      x.lineWidth = 1; x.strokeStyle = C.muted; line(x, 8, 7, 11, 12, 9, 17); line(x, 21, 9, 19, 15); dot(x, 25, 22, 1);
    } else if (kind === 'gbody') {
      x.fillStyle = C.body; x.fill(); x.fillStyle = C.muted; x.fillRect(7, 9, 2, 2); x.fillRect(20, 19, 2, 2);
    } else if (kind === 'omega') {
      rr(x, L, L, R - L, R - L, 8); fs(x, C.surf); dot(x, 10, 12); dot(x, 20, 12); line(x, 11, 18, 13, 20.5, 15, 18, 17, 20.5, 19, 18);
    }
  }
  function cloud(x, w, h, evil, stealth) {
    x.beginPath();
    x.ellipse(w / 2, h / 2 + 2, w / 2 - 2, h / 2 - 5, 0, 0, 6.2832);
    x.moveTo(w * .3 + 11, h * .32); x.arc(w * .3, h * .32, 11, 0, 6.2832);
    x.moveTo(w * .62 + 13, h * .3); x.arc(w * .62, h * .3, 13, 0, 6.2832);
    if (stealth) { x.setLineDash([3, 3]); x.strokeStyle = C.muted; x.stroke(); x.setLineDash([]); x.strokeStyle = C.ink; }
    else { x.fillStyle = C.surf; x.fill(); x.save(); x.strokeStyle = evil ? C.ink : C.line; x.stroke(); x.restore(); }
    if (evil) {
      line(x, w * .28, h * .44, w * .4, h * .5); line(x, w * .72, h * .44, w * .6, h * .5);
      P(x, [w * .26, h * .64, w * .74, h * .64, w * .5, h * .82]); fs(x, C.surf);
      for (let i = 1; i < 5; i++) line(x, w * (.26 + i * .096), h * .64, w * (.26 + i * .096), h * (.64 + (i < 3 ? i : 5 - i) * .05));
    } else if (!stealth) { x.save(); x.strokeStyle = C.muted; line(x, w * .38, h * .5, w * .38, h * .56); line(x, w * .6, h * .5, w * .6, h * .56); x.restore(); }
  }
  function mushroom(x, cap, mark) {
    x.beginPath(); x.moveTo(3, 18); x.bezierCurveTo(3, 3, 27, 3, 27, 18); x.closePath(); fs(x, cap);
    rr(x, 9, 18, 12, 10, 3); fs(x, C.surf);
    dot(x, 13, 22, 1); dot(x, 17, 22, 1);
    if (mark) { x.fillStyle = C.surf; [[9, 11], [21, 11], [15, 8]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 2.2, 0, 6.2832); x.fill(); }); }
  }
  function star(x, fill, shades) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 14, a = -Math.PI / 2 + i * Math.PI / 5; pts.push(15 + Math.cos(a) * r, 16 + Math.sin(a) * r); }
    P(x, pts); fs(x, fill);
    if (shades) { x.fillStyle = C.ink; x.fillRect(9, 13, 5, 3); x.fillRect(16, 13, 5, 3); line(x, 14, 14, 16, 14); }
  }
  function flame(x, w, h) {
    x.beginPath(); x.moveTo(w / 2, 1); x.bezierCurveTo(w, h * .45, w - 2, h - 1, w / 2, h - 1); x.bezierCurveTo(2, h - 1, 0, h * .45, w / 2, 1); fs(x, C.acc);
    ell(x, w / 2, h * .68, w * .18, h * .18); x.fillStyle = C.surf; x.fill();
  }

  const DEF = {
    // player
    cat0: [30, 36, (x) => cat(x, 0, C.surf)], cat1: [30, 36, (x) => cat(x, 1, C.surf)],
    cat2: [30, 36, (x) => cat(x, 2, C.surf)], cat3: [30, 36, (x) => cat(x, 3, C.surf)],
    giant: [51, 73, (x) => { x.lineWidth = 1.2; cat(x, 0, C.surf, 1.7); x.lineWidth = 2; line(x, 18, 50, 24, 46, 30, 50); }],
    // blocks
    brick: [30, 30, (x) => tile(x, 'brick')], q: [30, 30, (x) => tile(x, 'q')], used: [30, 30, (x) => tile(x, 'used')],
    hard: [30, 30, (x) => tile(x, 'hard')], stone: [30, 30, (x) => tile(x, 'stone')], gtop: [30, 30, (x) => tile(x, 'gtop')],
    gbody: [30, 30, (x) => tile(x, 'gbody')], omega: [30, 30, (x) => tile(x, 'omega')], hint: [30, 30, (x) => tile(x, 'hint')],
    on: [30, 30, (x) => tile(x, 'on')], off: [30, 30, (x) => tile(x, 'off')], pswitch: [30, 30, (x) => tile(x, 'pswitch')],
    note: [30, 30, (x) => { rr(x, .75, .75, 28.5, 28.5, 3); fs(x, C.surf); txt(x, '♪', 15, 16, 19, C.ink); }],
    noteA: [30, 30, (x) => { rr(x, .75, .75, 28.5, 28.5, 3); fs(x, C.acc); txt(x, '♪', 15, 16, 19, C.surf); }],
    spring: [24, 27, (x) => { P(x, [2, 1, 22, 1, 15, 13.5, 22, 26, 2, 26, 9, 13.5]); fs(x, C.pipe); line(x, 5, 6, 19, 6); line(x, 5, 21, 19, 21); }],
    coin: [26, 28, (x) => { ell(x, 13, 14, 8, 12); fs(x, C.acc); x.strokeStyle = C.surf; line(x, 13, 7, 13, 21); }],
    axe: [30, 30, (x) => { x.lineWidth = 3; line(x, 5, 26, 25, 5); x.lineWidth = 1.5; P(x, [20, 3, 28, 3, 28, 12]); fs(x, C.acc); }],
    stick: [30, 30, (x) => { x.lineWidth = 3; line(x, 4, 27, 26, 4); }],
    melon: [30, 30, (x) => { ell(x, 15, 16, 12, 12); fs(x, C.acc); x.strokeStyle = C.surf; x.lineWidth = 1; line(x, 7, 12, 23, 20); line(x, 7, 20, 23, 12); line(x, 15, 5, 15, 27); }],
    stickFx: [45, 45, (x) => { x.lineWidth = 3; line(x, 4, 41, 41, 4); }],
    // enemies (face left)
    e0: [30, 30, (x, w, h) => face(x, w, h, C.surf)],
    e1: [30, 43, (x) => { ell(x, 10, 9, 7, 7); fs(x, C.surf); dot(x, 8, 8); x.beginPath(); x.moveTo(2, 38); x.bezierCurveTo(2, 14, 28, 14, 28, 38); x.closePath(); fs(x, C.pipe); line(x, 10, 22, 15, 19, 20, 22, 20, 30, 10, 30, 10, 22); line(x, 6, 38, 6, 42); line(x, 24, 38, 24, 42); }],
    e2: [30, 30, (x) => { x.beginPath(); x.moveTo(2, 27); x.bezierCurveTo(2, 3, 28, 3, 28, 27); x.closePath(); fs(x, C.pipe); line(x, 10, 13, 15, 10, 20, 13, 20, 21, 10, 21, 10, 13); }],
    e3: [30, 44, (x) => { rr(x, 2, 2, 26, 40, 13); fs(x, C.surf); dot(x, 10, 16); dot(x, 19, 16); line(x, 10, 24, 12, 27, 14.5, 24, 17, 27, 19, 24); }],
    e4: [33, 35, (x, w, h) => { x.save(); x.translate(0, 6); face(x, w, h - 6, C.surf, 'grin'); x.restore(); P(x, [8, 10, 7, 1, 12.5, 6, 16.5, 0, 20.5, 6, 26, 1, 25, 10]); fs(x, C.acc); }],
    e5: [37, 55, (x) => { x.save(); x.scale(-1, 1); x.translate(-37, 0); cat(x, 0, C.surf, 1.5); x.restore(); line(x, 13, 17, 17, 19); line(x, 24, 17, 20, 19); }],
    e6: [36, 50, (x) => robot(x, false)], e150: [36, 50, (x) => robot(x, true)],
    e7: [32, 32, (x, w, h) => face(x, w, h, C.grey, 'grin')],
    e8: [37, 47, (x) => floaty(x, false)], e151: [37, 47, (x) => floaty(x, true)],
    e9: [26, 30, (x, w, h) => flame(x, w, h)],
    e10: [46, 16, (x) => { x.beginPath(); x.moveTo(1, 8); x.bezierCurveTo(14, -2, 38, 0, 45, 8); x.bezierCurveTo(38, 16, 14, 18, 1, 8); fs(x, C.acc); x.strokeStyle = C.surf; line(x, 12, 8, 36, 8); }],
    e30: [30, 36, (x) => { x.save(); x.scale(-1, 1); x.translate(-30, 0); cat(x, 0, C.surf); x.restore(); }],
    e155: [30, 36, (x) => { x.save(); x.scale(-1, 1); x.translate(-30, 0); cat(x, 2, C.grey); x.restore(); }],
    e31: [49, 79, (x) => { P(x, [18, 10, 20, 2, 24, 7, 28, 1, 31, 9]); fs(x, C.acc); ell(x, 25, 17, 10, 9); fs(x, C.surf); P(x, [15, 17, 8, 20, 15, 22]); fs(x, C.acc); dot(x, 21, 15); rr(x, 11, 26, 28, 30, 8); fs(x, C.surf); line(x, 13, 38, 37, 44); line(x, 13, 44, 37, 38); rr(x, 14, 52, 22, 10, 3); fs(x, C.pipe); line(x, 18, 62, 17, 76, 12, 78); line(x, 32, 62, 33, 76, 38, 78); }],
    e84: [30, 30, (x) => { ell(x, 15, 15, 13, 13); fs(x, C.acc); }],
    e86: [49, 59, (x) => boxcat(x, false)], e152: [49, 59, (x) => boxcat(x, true)],
    e90: [64, 63, (x, w, h) => face(x, w, h, C.surf, 'v')],
    e80: [70, 40, (x, w, h) => cloud(x, w, h)], e81: [70, 40, (x, w, h) => cloud(x, w, h, true)], e130: [70, 40, (x, w, h) => cloud(x, w, h, true, true)],
    e100: [30, 30, (x) => mushroom(x, C.acc, true)], e102: [30, 30, (x) => { mushroom(x, C.grey, false); line(x, 11, 10, 14, 13); line(x, 14, 10, 11, 13); line(x, 16, 10, 19, 13); line(x, 19, 10, 16, 13); }],
    e101: [30, 30, (x) => { x.lineWidth = 2; line(x, 15, 16, 15, 29); x.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; ell(x, 15 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, 4.5, 4.5); fs(x, C.acc); } ell(x, 15, 10, 3.5, 3.5); fs(x, C.surf); }],
    e105: [30, 30, (x) => { ell(x, 15, 15, 13, 13); fs(x, C.pipe); txt(x, '?', 15, 16, 17, C.ink); }],
    e110: [30, 30, (x) => star(x, C.acc, true)],
    // background
    n0: [150, 90, (x) => { x.beginPath(); x.moveTo(0, 90); x.bezierCurveTo(30, 20, 55, 2, 75, 2); x.bezierCurveTo(95, 2, 120, 20, 150, 90); x.fillStyle = C.ghost; x.globalAlpha = .45; x.fill(); x.globalAlpha = 1; x.strokeStyle = C.line; x.stroke(); x.fillStyle = C.line; [[62, 30], [70, 32], [92, 45], [99, 47], [60, 60]].forEach(([a, b]) => { x.beginPath(); x.ellipse(a, b, 2, 4, 0, 0, 6.28); x.fill(); }); }],
    n1: [65, 29, (x) => { x.strokeStyle = C.line; P(x, [0, 29, 6, 6, 12, 22, 20, 2, 28, 22, 34, 4, 42, 22, 50, 5, 56, 22, 62, 8, 65, 29], false); x.fillStyle = C.ghost; x.fill(); x.stroke(); }],
    n2: [70, 40, (x, w, h) => cloud(x, w, h)],
    n3: [100, 90, (x) => { x.strokeStyle = C.muted; x.fillStyle = C.body; x.beginPath(); x.rect(5, 38, 90, 52); x.rect(25, 10, 50, 28); x.fill(); x.stroke(); for (let i = 0; i < 5; i++) x.strokeRect(25 + i * 11, 4, 6, 6); x.beginPath(); x.moveTo(40, 90); x.lineTo(40, 66); x.arc(50, 66, 10, Math.PI, 0); x.lineTo(60, 90); fs(x, C.used); x.strokeRect(44, 18, 12, 12); }],
    n4: [51, 29, (x) => { ell(x, 25, 15, 23, 12); x.fillStyle = C.surf; x.fill(); x.strokeStyle = C.line; x.stroke(); }],
    n5: [28, 60, (x) => { x.strokeStyle = C.line; x.fillStyle = C.ghost; P(x, [14, 0, 26, 24, 18, 24, 28, 44, 0, 44, 10, 24, 2, 24]); x.fill(); x.stroke(); line(x, 14, 44, 14, 60); }],
    n6: [90, 40, (x) => { x.beginPath(); x.moveTo(0, 40); x.lineTo(0, 12); for (let i = 0; i < 6; i++) x.quadraticCurveTo(i * 15 + 7.5, i % 2 ? 0 : 20, i * 15 + 15, 10); x.lineTo(90, 40); x.fillStyle = C.acc; x.fill(); }],
    mid: [40, 60, (x) => { x.lineWidth = 2; line(x, 4, 2, 4, 59); x.lineWidth = 1.5; P(x, [5, 3, 37, 3, 37, 22, 5, 22]); fs(x, C.pipe); txt(x, 'MID', 21, 13, 10, C.ink); }],
  };
  function robot(x, alt) {
    x.lineWidth = 1.5; rr(x, 3, 2, 30, 38, 3); fs(x, C.surf);
    x.fillStyle = C.ink; x.fillRect(10, 12, 4, 4); x.fillRect(22, 12, 4, 4);
    x.strokeRect(10, 24, 16, 6); for (let i = 1; i < 4; i++) line(x, 10 + i * 4, 24, 10 + i * 4, 30);
    if (alt) { line(x, 3, 20, -1, 10); line(x, 33, 20, 36, 10); } else { line(x, 3, 22, 0, 32); line(x, 33, 22, 36, 32); }
    line(x, 11, 40, 11, 49); line(x, 25, 40, 25, 49);
  }
  function floaty(x, alt) {
    ell(x, 18, 18, 14, 16); fs(x, C.surf); dot(x, 13, 14); dot(x, 22, 14); line(x, 15, 21, 20, 21);
    ell(x, 18, 30, 16, 5); fs(x, C.pipe);
    if (alt) { line(x, 4, 20, 0, 8); line(x, 32, 20, 36, 8); } else { line(x, 4, 20, 0, 28); line(x, 32, 20, 36, 28); }
    line(x, 12, 34, 10, 46); line(x, 24, 34, 26, 46);
  }
  function boxcat(x, angry) {
    P(x, [4, 58, 4, 12, 8, 2, 16, 12, 33, 12, 41, 2, 45, 12, 45, 58]); fs(x, C.pipe);
    if (angry) { line(x, 12, 26, 20, 30); line(x, 37, 26, 29, 30); P(x, [15, 40, 34, 40, 30, 50, 19, 50]); fs(x, C.surf); }
    else { dot(x, 16, 28, 2); dot(x, 33, 28, 2); line(x, 21, 38, 24.5, 41, 28, 38); }
  }

  // Which sprite a block type shows (ttype < 100 by its tile, >= 100 by rule).
  const TILE = { 1: 'brick', 2: 'q', 3: 'used', 4: 'hard', 5: 'gtop', 6: 'gbody', 8: 'omega', 10: 'omega' };
  function blockSprite(tp, tx) {
    if (tp < 100) return TILE[tp] || null;
    if (tx === 10 && tp < 120) return null;
    if (tp <= 103 || tp === 116 || (tp === 104 || tp === 114) && tx === 1) return 'q';
    if (tp === 112 || tp === 104 && tx === 0 || tp === 115 && (tx === 1 || tx === 3)) return 'brick';
    if (tp === 111 || tp === 113 || tp === 115 && tx === 0 || tp === 124) return 'used';
    if (tp === 117) return tx === 1 ? 'noteA' : tx >= 3 ? 'note' : null;
    if (tp === 120 && tx !== 1) return 'spring';
    return { 130: 'on', 131: 'off', 140: 'axe', 141: 'stick', 142: 'melon', 300: 'hint', 301: 'hint', 400: 'pswitch', 800: 'coin' }[tp] || null;
  }
  // Castle stages reuse the ground tiles in stone.
  const ground = (k) => (g.stagecolor === 4 && (k === 'gtop' || k === 'gbody') ? 'stone' : k);

  // ── the per-frame bookkeeping rpaint() used to do ──────────────────────
  function post() {
    g.mrzimen = g.stagecolor === 5 ? 1 : 0; // snow stages are icy
    if (g.mainZ !== 1 || g.zxon < 1) return;
    if (g.mactp >= 2000) { g.mactp -= 2000; g.mact = g.mact ? 0 : 1; }
    if (g.mmsgtm >= 1) g.mmsgtm--;
    for (let t = 0; t < g.amsgtm.length; t++) if (g.amsgtm[t] >= 1) g.amsgtm[t]--;
    if (g.tmsgtm > 0) {
      if (g.tmsgtype === 1) { g.tmsgy += 1200; if (g.tmsgtm === 1) { g.tmsgtm = 80000000; g.tmsgtype = 2; } }
      else if (g.tmsgtype === 2) { g.tmsgy = 0; g.tmsgtype = 3; g.tmsgtm = 16; waitMsg = true; fresh = false; }
      else if (g.tmsgtype === 3) { g.tmsgy += 1200; if (g.tmsgtm === 1) { g.tmsgtm = 0; g.tmsgtype = 0; g.tmsgy = 0; } }
      g.tmsgtm--;
    }
    if (g.blacktm > 0) { g.blacktm--; if (g.blacktm === 0 && g.blackx === 1) g.zxon = 0; }
  }

  function begin(i, mystery) {
    sel = i;
    try { localStorage.setItem(SAVE, String(i)); } catch (e) { /* storage blocked */ }
    Object.assign(g, { mainZ: 10, zxon: 0, maintm: 0, nokori: 2, fast: 0, trap: 0, tyuukan: 0, over: mystery ? 1 : 0, sta: STAGES[i][0], stb: STAGES[i][1], stc: 0 });
    lastLives = 2; lastStage = 0; deaths = 0;
  }

  function step() {
    if (waitMsg) { if (!fresh) return; waitMsg = false; }
    if (g.mainZ === 100) return;
    const wasZ = g.mainZ;
    E.Mainprogram();
    post();
    if (g.nokori < lastLives) deaths++;
    lastLives = g.nokori;
    if (g.mainZ === 1) {
      const st = g.sta * 10 + g.stb;
      if (lastStage && st > lastStage) {
        addScore(100);
        const i = STAGES.findIndex(([a, b]) => a * 10 + b === st);
        if (i >= 0) { sel = i; try { localStorage.setItem(SAVE, String(i)); } catch (e) { /* storage blocked */ } }
      }
      lastStage = st;
    }
    if (wasZ === 1 && g.mainZ === 2) addScore(500);
    if (sounds.length) { const n = sounds[sounds.length - 1]; sounds.length = 0; T.beep && T.beep(SFX[n][0], SFX[n][1], 'square'); }
    dirty = true;
  }

  // ── drawing ────────────────────────────────────────────────────────────
  const world = () => ctx.setTransform(S, 0, 0, S, OX, 0);
  const screen = () => ctx.setTransform(1, 0, 0, 1, 0, 0);
  function wtext(s, x, y, size, col, align, edge) {
    ctx.font = `${size}px ${MONO}`; ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
    if (edge) { ctx.lineWidth = 3; ctx.strokeStyle = edge; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = col; ctx.fillText(s, x, y);
  }
  function rect(l, t, w, h, fill, stroke, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(l, t, w, h); }
    if (stroke) { ctx.lineWidth = lw || 1.5; ctx.strokeStyle = stroke; ctx.strokeRect(l, t, w, h); }
  }
  function ball(cx, cy, r, fill) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = C.ink; ctx.stroke(); }
  const vis = (x, w) => x + w >= -40 && x <= VW + 40;

  function drawStage() {
    const fx = g.fx, fy = g.fy, fma = g.fma, fmb = g.fmb;
    world(); rect(0, 0, VW, VH, SKY[g.stagecolor] || T.bg);

    // background
    for (let t = 0; t < g.na.length; t++) {
      const x = (g.na[t] - fx) / 100 | 0, y = (g.nb[t] - fy) / 100 | 0, n = g.ntype[t];
      if (x + 160 < 0 || x > VW) continue;
      if (n >= 100) { wtext(n === 100 ? '51' : n === 101 ? 'GAME CLEAR' : 'Thanks for playing!', x + fma, y + fmb, 16, C.ink); world(); continue; }
      if (DEF['n' + n]) { screen(); blit('n' + n, n === 3 ? x - 5 : x, y); world(); }
    }
    // effects: coins, debris, poles
    for (let t = 0; t < g.ea.length; t++) {
      const x = (g.ea[t] - fx) / 100 | 0, y = (g.eb[t] - fy) / 100 | 0, k = g.egtype[t];
      if (!vis(x, 50) || y > VH + 20) continue;
      if (k === 0) { screen(); blit('coin', x, y); world(); }
      else if (k === 1) ball(x, y, 6, C.body);
      else if (k === 2 || k === 3) { screen(); blit('stickFx', x, y, k === 3); world(); }
      else if (k === 4) { rect(x + 10, y, 10, g.enobib[t] / 100, C.surf, C.ink); ball(x + 14, y, 9, C.acc); }
    }
    // lifts
    for (let t = 0; t < g.sra.length; t++) {
      const x = (g.sra[t] - fx) / 100 | 0, y = (g.srb[t] - fy) / 100 | 0, w = g.src[t] / 100 | 0, sp = g.srsp[t];
      if (!vis(x, w) || w < 1) continue;
      if (sp <= 9 || sp >= 20) rect(x, y, w, sp === 1 ? 12 : 14, sp === 21 ? C.grey : sp === 2 || sp === 3 ? C.pipe : C.acc, C.ink);
      else if (sp <= 14 && g.src[t] >= 5000) { rect(x + 20, y + 30, w - 40, 480, C.body, C.muted); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, 30, 12) : ctx.rect(x, y, w, 30); ctx.fillStyle = C.pipe; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.stroke(); }
      if (sp === 15) { screen(); for (let i = 0; i < 3; i++) blit('brick', x + i * 29, y); world(); }
    }
    // the cat
    screen();
    const mx = g.ma / 100 | 0, my = g.mb / 100 | 0, flip = g.mmuki === 0;
    if (g.mtype === 1) blit('giant', mx, my, flip);
    else if (g.mtype === 200) blit('cat3', mx, my, flip);
    else blit(g.mzimen ? (g.mact ? 'cat1' : 'cat0') : 'cat2', mx, my, flip);
    // enemies and items
    for (let t = 0; t < g.aa.length; t++) {
      const x = (g.aa[t] - fx) / 100 | 0, y = (g.ab[t] - fy) / 100 | 0, tp = g.atype[t], ax = g.axtype[t];
      if (!vis(x, g.anobia[t] / 100) || y > VH + 40 || y + g.anobib[t] / 100 < -40) continue;
      const mir = g.amuki[t] === 1 && tp < 100;
      if (tp === 79) { world(); rect(x, y, g.anobia[t] / 100, g.anobib[t] / 100, C.acc, C.ink); screen(); continue; }
      if (tp === 85) { world(); rect(x + 10, y, 10, g.anobib[t] / 100, C.surf, C.ink); ball(x + 14, y, 9, C.pipe); screen(); continue; }
      if (tp === 82 || tp === 83) {
        const k = ax === 2 ? 'e84' : ax === 1 ? 'used' : 'brick', o = tp === 83 ? 10 : 0;
        blit(k === 'used' && g.stagecolor === 4 ? 'stone' : k, x + o, y + (tp === 83 ? 9 : 0));
        continue;
      }
      if (tp === 87 || tp === 88) continue; // fire bars are drawn on top, later
      let k = 'e' + tp, vf = false;
      if (tp === 200) k = 'e0';
      else if (tp === 6 && (g.atm[t] >= 10 && g.atm[t] <= 19 || g.atm[t] >= 100 && g.atm[t] <= 119 || g.atm[t] >= 200)) k = 'e150';
      else if (tp === 8 && ax === 1) k = 'e151';
      else if (tp === 30 && ax === 1) k = 'e155';
      else if (tp === 81 && ax === 1) k = 'e130';
      else if (tp === 80 && ax === 1) continue;
      else if (tp === 86 && g.ma >= g.aa[t] - fx - g.mnobia - 4000 && g.ma <= g.aa[t] - fx + g.anobia[t] + 4000) k = 'e152';
      if (tp === 3 && ax === 1 || tp === 9 && g.ad[t] >= 1) vf = true;
      if (DEF[k]) blit(k, x, y, mir, vf);
    }
    // blocks
    for (let t = 0; t < g.ta.length; t++) {
      const x = (g.ta[t] - fx) / 100 | 0;
      if (x + 30 < -10 || x > VW + 10) continue;
      const y = (g.tb[t] - fy) / 100 | 0, k = blockSprite(g.ttype[t], g.txtype[t]);
      if (!k) continue;
      if (k === 'spring') blit(k, x + 3, y + 2);
      else if (k === 'coin') blit(k, x + 2, y + 1);
      else blit(ground(k), x, y);
    }
    // ground, pipes, goal
    for (let pass = 0; pass < 2; pass++) for (let t = 0; t < g.sa.length; t++) {
      const x = (g.sa[t] - fx) / 100 + fma | 0, y = (g.sb[t] - fy) / 100 + fmb | 0, w = g.sc[t] / 100 | 0, h = g.sd[t] / 100 | 0, tp = g.stype[t], sx = g.sxtype[t];
      if (g.sa[t] - fx + g.sc[t] < -10 || g.sa[t] - fx > g.fxmax + 1100) continue;
      if (pass === 0) {
        if (tp === 0) { world(); rect(x, y, w, h, C.body, C.ink); }
        else if (tp === 1) { world(); rect(x, y, w, h, C.pipe, C.ink); }
        else if (tp === 2 || tp === 5) {
          world(); rect(x, y + 1, w, h, C.pipe); ctx.lineWidth = 1.5; ctx.strokeStyle = C.ink; ctx.beginPath();
          if (tp === 2) { ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); }
          else { ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); }
          ctx.stroke();
        } else if (tp === 51) {
          screen(); const k = sx <= 2 ? 'brick' : 'stone', rows = sx === 3 || sx === 4 ? g.sd[t] / 3000 | 0 : 0;
          for (let i = 0; i <= (g.sc[t] / 3000 | 0); i++) for (let j = 0; j <= rows; j++) blit(k, x + 29 * i, y + 29 * j);
        } else if (tp === 52) {
          screen();
          for (let i = 0; i <= (g.sc[t] / 3000 | 0); i++) {
            if (sx === 0) { blit(ground('gtop'), x + 29 * i, y); blit(ground(g.stagecolor === 4 ? 'gtop' : 'gbody'), x + 29 * i, y + 29); }
            else for (let j = 0; j <= (g.sd[t] / 3000 | 0); j++) blit(sx === 1 ? 'brick' : ground('gtop'), x + 29 * i, y + 29 * j);
          }
        } else if (tp >= 100 && tp <= 299 && g.trap === 1) { world(); ctx.setLineDash([4, 3]); rect(x, y, w, h, null, C.muted, 1); ctx.setLineDash([]); }
        else if (tp === 300) { world(); rect(x + 10, y, 10, h - 8, C.surf, C.ink); ball(x + 14, y, 9, C.acc); }
        else if (tp === 500) { screen(); blit('mid', x, y); }
      } else {
        if (tp === 40) { world(); rect(x, y + 1, w, h, C.pipe, C.ink); }
        else if (tp === 50) {
          world(); rect(x + 5, y + 30, 50, h - 30, C.pipe); ctx.lineWidth = 1.5; ctx.strokeStyle = C.ink; ctx.beginPath();
          ctx.moveTo(x + 5, y + 30); ctx.lineTo(x + 5, y + h); ctx.moveTo(x + 55, y + 30); ctx.lineTo(x + 55, y + h); ctx.stroke();
          rect(x, y + 1, 60, 30, C.pipe, C.ink);
        } else if (tp === 200) { screen(); for (let i = 0; i <= (g.sc[t] / 3000 | 0); i++) for (let j = 0; j <= (g.sd[t] / 3000 | 0); j++) blit('stone', x + 29 * i, y + 29 * j); }
      }
    }
    // fire bars
    world();
    for (let t = 0; t < g.aa.length; t++) {
      if (g.atype[t] !== 87 && g.atype[t] !== 88) continue;
      const x = (g.aa[t] - fx) / 100, y = (g.ab[t] - fy) / 100, a = g.atm[t] * Math.PI / 360, sgn = g.atype[t] === 87 ? 1 : -1;
      if (x < -130 || x > VW + 130) continue;
      for (let i = 0; i <= g.axtype[t] % 100; i++) ball(x + sgn * (i * 18 * Math.cos(a) | 0), y + (i * 18 * Math.sin(a) | 0), 7, C.acc);
    }
    // speech
    if (g.mmsgtm >= 1 && SAY[g.mmsgtype]) wtext(SAY[g.mmsgtype], (g.ma + g.mnobia + 300) / 100, g.mb / 100, 13, C.ink, 'left', SKY[g.stagecolor]);
    for (let t = 0; t < g.aa.length; t++) {
      if (g.amsgtm[t] < 1) continue;
      const s = tauntFor(g.amsgtype[t]);
      if (s) wtext(s, (g.aa[t] + g.anobia[t] + 300 - fx) / 100, (g.ab[t] - fy - (g.amsgtype[t] === 31 ? 800 : 0)) / 100, 13, C.acc, 'left', SKY[g.stagecolor]);
    }
    // hint box: grows, holds for a key press, shrinks
    if (g.tmsgtm > 0 || waitMsg) {
      if (g.tmsgtype === 1) rect(60, 40, 360, g.tmsgy / 100, C.surf, C.ink);
      else if (waitMsg || g.tmsgtype === 2) {
        rect(60, 40, 360, 183, C.surf, C.ink);
        for (const [ln, s] of HINT[g.tmsg] || []) wtext(s, 70, 50 + ln * 24, 14, C.ink);
        if (waitMsg) wtext('press any key', 410, 204, 10, C.muted, 'right');
      } else if (g.tmsgtype === 3) { const hh = 183 - g.tmsgy / 100; if (hh > 0) rect(60, 40 + g.tmsgy / 100, 360, hh, C.surf, C.ink); }
    }
    if (g.mainmsgtype === 1) {
      wtext('WELCOME TO OWATA ZONE', VW / 2, 100, 20, C.ink, 'center');
      for (let i = 0; i < 3; i++) wtext('1', 88 + i * 143, 210, 20, C.ink);
    }
    if (g.blacktm > 0) rect(0, 0, VW, VH, DARK);
  }

  function drawTitle() {
    world(); rect(0, 0, VW, VH, T.bg);
    screen(); blit('n0', 176, 13 * 29 - 12 - 90); blit('n2', 392, 236); blit('n4', 40, 120); blit('n1', 300, 12 * 29 - 12);
    for (let i = 0; i <= 16; i++) { blit('gtop', 29 * i, 13 * 29 - 12); blit('gbody', 29 * i, 14 * 29 - 12); }
    blit('cat0', 60, 12 * 29 - 18);
    world();
    wtext('しょぼんのアクション', VW / 2, 54, 34, C.ink, 'center');
    wtext('SYOBON ACTION  ·  a.k.a. Cat Mario', VW / 2, 100, 13, C.muted, 'center');
    wtext('pick a stage', VW / 2, 162, 11, C.muted, 'center');
    const cw = 44, gap = 6, x0 = (VW - (cw * 9 + gap * 8)) / 2;
    for (let i = 0; i < 9; i++) {
      const x = x0 + i * (cw + gap), on = i === sel;
      rect(x, 180, cw, 24, on ? C.acc : C.surf, on ? C.acc : C.line, 1);
      wtext(STAGES[i].join('-'), x + cw / 2, 185, 12, on ? C.surf : C.ink, 'center');
    }
    wtext('← → choose  ·  jump or tap to start', VW / 2, 222, 12, C.ink, 'center');
    wtext('0 on this screen: the "mystery dungeon"', VW / 2, 242, 10, C.muted, 'center');
  }
  function titleHit(x, y) {
    const lx = (x - OX) / S, ly = y / S, cw = 44, gap = 6, x0 = (VW - (cw * 9 + gap * 8)) / 2;
    if (ly >= 176 && ly <= 208) { const i = Math.floor((lx - x0) / (cw + gap)); if (i >= 0 && i < 9 && lx - x0 - i * (cw + gap) <= cw) return i; }
    return -1;
  }

  function drawLives() {
    world(); rect(0, 0, VW, VH, DARK);
    wtext('STAGE ' + g.sta + '-' + g.stb, VW / 2, 150, 16, LIGHT, 'center');
    screen(); blit('cat0', 190, 190); world();
    wtext('× ' + g.nokori, 230, 198, 18, LIGHT);
  }
  function drawCredits() {
    world(); rect(0, 0, VW, VH, DARK);
    for (const [i, s] of CREDITS) { const y = g.xx[i] / 100; if (y > -30 && y < VH + 10) wtext(s, VW / 2, y, 16, i === 29 ? T.accent : LIGHT, 'center'); }
  }

  // Side panels live in the letterbox either side of the 480×420 stage.
  function drawPanels() {
    screen();
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, OX, H); ctx.fillRect(OX + VW * S, 0, W - OX - VW * S, H);
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.strokeRect(OX + .5, .5, VW * S - 1, H - 1);
    if (g.mainZ === 100 || OX < 50) return;
    const lab = (s, x, y) => { ctx.font = `10px ${MONO}`; ctx.fillStyle = C.muted; ctx.textAlign = 'center'; ctx.fillText(s, x, y); };
    const val = (s, x, y, col) => { ctx.font = `700 17px ${MONO}`; ctx.fillStyle = col || C.ink; ctx.textAlign = 'center'; ctx.fillText(s, x, y); };
    const L = OX / 2, R = W - OX / 2;
    lab('STAGE', L, 28); val(g.sta + '-' + g.stb, L, 48);
    lab('LIVES', R, 28); val('× ' + g.nokori, R, 48, g.nokori < 0 ? C.acc : C.ink);
    lab('DEATHS', R, 80); val(String(deaths), R, 100);
    ctx.fillStyle = C.acc; ctx.fillRect(L - 12, 58, 24, 2); ctx.fillRect(R - 12, 58, 24, 2);
    lab('O = give up', L, H - 30); lab('esc = title', L, H - 16);
    lab('shift = 2×', R, H - 16);
  }

  function render() {
    ctx.save();
    screen(); ctx.beginPath(); ctx.rect(OX, 0, VW * S, H); ctx.clip();
    if (g.mainZ === 100) drawTitle();
    else if (g.mainZ === 10) drawLives();
    else if (g.mainZ === 2) drawCredits();
    else drawStage();
    ctx.restore();
    drawPanels();
    screen();
  }

  return {
    key(k, down) {
      const lk = k.toLowerCase(), name = KEYS[lk];
      if (down && !(name && held[name])) fresh = true;
      if (name) held[name] = down;
      if (!down || g.mainZ !== 100) return;
      if (lk === 'arrowleft' || lk === 'a') { sel = (sel + 8) % 9; dirty = true; }
      else if (lk === 'arrowright' || lk === 'd') { sel = (sel + 1) % 9; dirty = true; }
      else if (/^[1-9]$/.test(lk)) begin(+lk - 1);
      else if (lk === '0') begin(0, true);
      else if (name === 'UP' || name === 'RETURN') begin(sel);
    },
    pointer(x, y, type) {
      if (type !== 'down') return;
      fresh = true;
      if (g.mainZ === 100) { const i = titleHit(x, y); begin(i >= 0 ? i : sel); }
    },
    tick(dt) {
      acc += dt * (held.SPACE ? 2 : 1);
      let n = 0;
      while (acc >= STEP && n < 4) { step(); acc -= STEP; n++; }
      if (n === 4) acc = 0;
      if (dirty) { render(); dirty = false; }
    },
  };
}

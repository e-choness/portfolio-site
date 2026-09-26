// sound.js — WebAudio beep() (§6.9).
import { store } from './store.js';

let ctx = null;

function ensureCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  // 'suspended' before a gesture; iOS also parks it in 'interrupted' after a
  // call or a trip to the background.
  if (ctx.state !== 'running') {
    const p = ctx.resume();
    if (p) p.catch(() => {});
  }
  return ctx;
}

export function beep(freq = 700, dur = 0.06, type = 'sine') {
  if (store.get().sound !== 'on') return;
  // Before any gesture a new context would start suspended (the boot chirp on
  // a phone), so skip it instead of queueing a beep that plays late.
  if (!ctx && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  const ac = ensureCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.045;
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  } catch { /* audio unavailable — beep is decorative */ }
}

// Beeps match the prototype (Patch 28).
export const sfx = {
  open: () => beep(560, 0.05),
  close: () => beep(360, 0.05),
  error: () => beep(220, 0.08),  // terminal "command not found"
  toggleTheme: () => beep(500, 0.05),
  toggleSound: () => beep(700, 0.05),
  guideNext: () => beep(640, 0.04),
  pickGame: () => beep(700, 0.06),
  blogOpen: () => beep(600, 0.04),
  blogCatPick: () => beep(600, 0.03),
  bootA: () => beep(660, 0.08),
  bootB: () => beep(880, 0.1),
};

// Unlock audio on a user gesture. Browsers only let a context start from a
// user activation, and for touch that is pointerup/touchend — not pointerdown,
// which is why sound never started on phones. The listeners stay until the
// context runs, so a failed or interrupted unlock retries on the next tap.
function unlockAudio() {
  if (ctx && ctx.state === 'running') return;
  if (store.get().sound !== 'on') return;
  const ac = ensureCtx();
  if (!ac) return;
  // Older iOS only unmutes once a source has started inside the gesture.
  try {
    const src = ac.createBufferSource();
    src.buffer = ac.createBuffer(1, 1, 22050);
    src.connect(ac.destination);
    src.start(0);
  } catch { /* decorative */ }
}

for (const type of ['pointerup', 'touchend', 'click', 'keydown']) {
  document.addEventListener(type, unlockAudio, { capture: true, passive: true });
}

// sound.js — WebAudio beep() (§6.9).
import { store } from './store.js';

let ctx = null;

function ensureCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function beep(freq = 700, dur = 0.06, type = 'sine') {
  if (store.get().sound !== 'on') return;
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

export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

// Resume a suspended AudioContext on the first user gesture.
document.addEventListener('pointerdown', resumeAudio, { once: true });
document.addEventListener('keydown', resumeAudio, { once: true });

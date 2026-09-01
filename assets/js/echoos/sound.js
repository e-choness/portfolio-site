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

// Distinct beeps from §6.9: open 700Hz, close 420Hz, error 220Hz, game over 160Hz/.3s.
export const sfx = {
  open: () => beep(700, 0.06),
  close: () => beep(420, 0.06),
  error: () => beep(220, 0.1),
  gameOver: () => beep(160, 0.3),
};

export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

// Resume a suspended AudioContext on the first user gesture.
document.addEventListener('pointerdown', resumeAudio, { once: true });
document.addEventListener('keydown', resumeAudio, { once: true });

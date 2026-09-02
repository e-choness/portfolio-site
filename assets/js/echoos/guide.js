// guide.js — chat-bubble guided tour (§6.1). The 7 step texts live in
// _data/guide.yml (verbatim from EchoOS.dc.html lines 622-628) and arrive via
// content.json; per-step action buttons ("Open About" / "Open Projects" /
// "Open Arcade" / "Try search" → spotlight / "Open Terminal") mirror
// guideAction there. The final step is the tour's end: "Restart tour" replays
// from step 0 (prototype line 476).
import { store } from './store.js';
import { beep } from './sound.js';

export function renderGuide(bodyEl, { wm, openSpotlight, content }) {
  const steps = (content && content.guide && content.guide.steps) || [];
  if (!steps.length) return;
  let step = 0;

  bodyEl.innerHTML = `
    <div class="os-guide">
      <div class="os-guide-chat"></div>
      <div class="os-guide-actions"></div>
    </div>`;

  const chat = bodyEl.querySelector('.os-guide-chat');
  const actions = bodyEl.querySelector('.os-guide-actions');

  function render() {
    // Bubbles up to and including the current step (prototype slice(0, step+1)).
    chat.innerHTML = '';
    for (let i = 0; i <= step; i++) {
      const s = steps[i];
      const row = document.createElement('div');
      row.className = 'os-guide-msg';
      const av = document.createElement('span');
      av.className = 'os-guide-avatar';
      av.textContent = '?';
      const bubble = document.createElement('div');
      bubble.className = 'os-guide-bubble';
      bubble.textContent = s.text;
      row.append(av, bubble);
      chat.appendChild(row);
    }
    chat.scrollTop = chat.scrollHeight;

    // Footer: current step's action button (if any) + Next / Restart tour.
    actions.innerHTML = '';
    const cur = steps[step];
    if (cur.app || cur.spot) {
      const a = document.createElement('button');
      a.type = 'button';
      a.className = 'os-guide-action';
      a.textContent = cur.action;
      a.addEventListener('click', () => {
        if (cur.spot) {
          if (openSpotlight) openSpotlight();
        } else {
          wm && wm.openApp(cur.app);
        }
      });
      actions.appendChild(a);
    }
    if (step < steps.length - 1) {
      const n = document.createElement('button');
      n.type = 'button';
      n.className = 'os-guide-next';
      n.textContent = 'Next';
      n.addEventListener('click', () => {
        step += 1;
        beep(640, 0.04); // prototype guideNext beep
        render();
      });
      actions.appendChild(n);
    } else {
      // Tour complete — mark done so it doesn't auto-open on the next visit.
      store.set({ guideDone: true });
      const r = document.createElement('button');
      r.type = 'button';
      r.className = 'os-guide-restart';
      r.textContent = 'Restart tour';
      r.addEventListener('click', () => {
        step = 0;
        render();
      });
      actions.appendChild(r);
    }
  }

  render();
}

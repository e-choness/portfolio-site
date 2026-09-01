// guide.js — 8-step guided tour (rendered in the guide window, §6.1).
// Step copy is terse and describes the real OS UI it points at; nothing here
// invents site content.
import { store } from './store.js';

const STEPS = [
  { title: 'Dock', text: 'Your apps live in the dock. Click any icon to open or toggle a window.', target: '.os-dock' },
  { title: 'Desktop icons', text: 'Click a desktop icon to open that app window.', target: '.os-desktop' },
  { title: 'Spotlight', text: 'Press ⌘K (Ctrl+K on Windows/Linux) to jump to any app, project, or post.', target: '.os-spotlight-input' },
  { title: 'Windows', text: 'Drag a window by its title bar and resize it from the bottom-right corner.', target: '.os-win-bar' },
  { title: 'Terminal', text: 'Open the Terminal and type help for the full command set.', target: '.os-dock-item[data-app="term"]' },
  { title: 'Theme & sound', text: 'Toggle light/dark theme and sound from the menu bar.', target: '.os-mb-right' },
  { title: 'Blog', text: 'Every post opens in its own reader pane — no page reloads.', target: '.os-dock-item[data-app="blog"]' },
  { title: 'Classic view', target: null, html(root) { const base = (root && root.dataset.base) || ''; return `Prefer a static page? The no-JS version lives at <a class="os-guide-link" href="${base}classic/">/classic/</a>.`; } },
];

let ring = null;

function highlight(target, root) {
  clearHighlight();
  if (!target) return;
  const el = typeof target === 'string' ? root.querySelector(target) : target;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  ring = document.createElement('div');
  ring.className = 'os-guide-ring';
  ring.style.top = `${rect.top - 6}px`;
  ring.style.left = `${rect.left - 6}px`;
  ring.style.width = `${rect.width + 12}px`;
  ring.style.height = `${rect.height + 12}px`;
  document.body.appendChild(ring);
}

function clearHighlight() {
  if (ring) {
    ring.remove();
    ring = null;
  }
}

export function renderGuide(bodyEl, { root, wm }) {
  let step = 0;

  bodyEl.innerHTML = `
    <div class="os-guide">
      <ol class="os-guide-dots"></ol>
      <h3 class="os-guide-title"></h3>
      <p class="os-guide-text"></p>
      <div class="os-guide-actions">
        <button type="button" class="os-guide-prev">Prev</button>
        <button type="button" class="os-guide-next">Next</button>
      </div>
    </div>`;

  const title = bodyEl.querySelector('.os-guide-title');
  const text = bodyEl.querySelector('.os-guide-text');
  const dots = bodyEl.querySelector('.os-guide-dots');
  const prev = bodyEl.querySelector('.os-guide-prev');
  const next = bodyEl.querySelector('.os-guide-next');

  for (let i = 0; i < STEPS.length; i++) {
    const li = document.createElement('li');
    li.className = 'os-guide-dot';
    li.dataset.i = String(i);
    dots.appendChild(li);
  }

  function render() {
    const s = STEPS[step];
    title.textContent = `${step + 1}. ${s.title}`;
    if (s.html) {
      text.innerHTML = s.html(root);
    } else {
      text.textContent = s.text;
    }
    Array.from(dots.children).forEach((li, i) => li.classList.toggle('is-on', i === step));
    prev.disabled = step === 0;
    next.textContent = step === STEPS.length - 1 ? 'Done' : 'Next';
    highlight(s.target, root || document.body);
  }

  function finish() {
    store.set({ guideDone: true });
    clearHighlight();
    wm && wm.closeApp('guide');
  }

  next.addEventListener('click', () => {
    if (step < STEPS.length - 1) {
      step += 1;
      render();
    } else {
      finish();
    }
  });
  prev.addEventListener('click', () => {
    if (step > 0) {
      step -= 1;
      render();
    }
  });
  dots.addEventListener('click', (e) => {
    const li = e.target.closest('.os-guide-dot');
    if (li) {
      step = Number(li.dataset.i);
      render();
    }
  });

  // Drop the ring when the window is closed / the body unmounts.
  new MutationObserver((_, obs) => {
    if (!bodyEl.isConnected) {
      clearHighlight();
      obs.disconnect();
    }
  }).observe(bodyEl, { childList: true });

  render();
}

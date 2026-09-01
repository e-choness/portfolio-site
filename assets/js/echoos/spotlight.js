// spotlight.js — ⌘K / Ctrl+K palette (§6.1).
// Fuzzy-ish search over apps, projects, posts and actions. Enter opens the
// top result; Escape dismisses. Mirrors EchoOS.dc.html lines 506-525 / 977-996.
import { beep } from './sound.js';

export function initSpotlight(root, { apps, content, wm, store, onOpenResult }) {
  let isOpen = false;
  let items = [];
  let active = 0;

  const overlay = document.createElement('div');
  overlay.className = 'os-spotlight';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="os-spotlight-box" role="dialog" aria-label="Spotlight" aria-modal="true">
      <div class="os-spotlight-inputrow">
        <span class="os-spotlight-search" aria-hidden="true">⌕</span>
        <input class="os-spotlight-input" type="text" placeholder="Search apps, projects, posts…" aria-label="Spotlight search" autocomplete="off" spellcheck="false" />
        <span class="os-spotlight-hint">↑↓ · ↵ open · esc</span>
      </div>
      <ul class="os-spotlight-results"></ul>
    </div>`;
  root.appendChild(overlay);

  const input = overlay.querySelector('.os-spotlight-input');
  const results = overlay.querySelector('.os-spotlight-results');

  function buildIndex() {
    const idx = [];
    for (const app of apps) {
      idx.push({ kind: 'app', id: app.id, title: app.label, sub: app.title, hay: `${app.label} ${app.title}` });
    }
    for (const p of (content && content.projects) || []) {
      idx.push({ kind: 'project', id: p.slug, title: p.title, sub: 'project', hay: `${p.title} ${(p.tech || []).join(' ')}` });
    }
    for (const p of (content && content.posts) || []) {
      idx.push({ kind: 'post', id: p.slug, title: p.title, sub: `${p.date}`, hay: p.title });
    }
    idx.push({ kind: 'action', id: 'theme', title: 'Toggle dark / light theme', sub: 'action', hay: 'Toggle dark / light theme' });
    return idx;
  }

  function query(q) {
    const t = q.trim().toLowerCase();
    if (!t) return buildIndex().slice(0, 8);
    const scored = buildIndex()
      .map((it) => {
        const h = it.hay.toLowerCase();
        let score = h.startsWith(t) ? 0 : h.includes(t) ? 1 : 2;
        if (it.kind === 'app') score -= 0.5;
        return { it, score };
      })
      .filter((r) => r.score < 2)
      .sort((a, b) => a.score - b.score)
      .slice(0, 8)
      .map((r) => r.it);
    return scored;
  }

  function render() {
    const list = query(input.value);
    items = list;
    active = 0;
    results.innerHTML = '';
    if (!list.length) {
      results.innerHTML = '<li class="os-spotlight-empty">No results</li>';
      return;
    }
    for (const it of list) {
      const li = document.createElement('li');
      li.className = 'os-spotlight-item';
      li.innerHTML = `
        <span class="os-spotlight-label"></span>
        <span class="os-spotlight-kind"></span>`;
      li.querySelector('.os-spotlight-label').textContent = it.title;
      li.querySelector('.os-spotlight-kind').textContent = it.kind;
      li.dataset.index = String(items.indexOf(it));
      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        openItem(it);
      });
      results.appendChild(li);
    }
    highlight();
  }

  function highlight() {
    Array.from(results.children).forEach((li, i) => {
      li.classList.toggle('is-active', i === active);
    });
  }

  function openItem(it) {
    if (!it) return;
    close();
    if (it.kind === 'app') {
      wm && wm.openApp(it.id);
    } else if (it.kind === 'action' && store) {
      // Prototype toggleThemeFn: flip theme + confirmation blip.
      const cur = store.get().theme;
      store.set({ theme: cur === 'dark' ? 'light' : 'dark' });
      beep(500, 0.05);
    } else if (onOpenResult) {
      onOpenResult(it);
    }
  }

  function open() {
    isOpen = true;
    overlay.hidden = false;
    input.value = '';
    render();
    input.focus();
  }

  function close() {
    isOpen = false;
    overlay.hidden = true;
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  input.addEventListener('input', render);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = Math.min(active + 1, items.length - 1);
      highlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(active - 1, 0);
      highlight();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      openItem(items[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  return { open, close, toggle, isOpen: () => isOpen };
}

// spotlight.js — ⌘K / Ctrl+K palette (§6.1).
// Fuzzy-ish search over apps, projects and posts. Enter opens the top result.
export function initSpotlight(root, { apps, content, wm, onOpenResult }) {
  let isOpen = false;
  let items = [];
  let active = 0;

  const overlay = document.createElement('div');
  overlay.className = 'os-spotlight';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="os-spotlight-box" role="dialog" aria-label="Spotlight" aria-modal="true">
      <input class="os-spotlight-input" type="text" placeholder="Search apps, projects, posts…" aria-label="Spotlight search" autocomplete="off" spellcheck="false" />
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
      li.textContent = `${it.title} — ${it.sub}`;
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
    } else if (onOpenResult) {
      onOpenResult(it);
    }
  }

  function open() {
    isOpen = true;
    overlay.hidden = false;
    render();
    input.value = '';
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
    }
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  return { open, close, toggle, isOpen: () => isOpen };
}

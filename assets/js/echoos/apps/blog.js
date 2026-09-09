// apps/blog.js — Blog window, prototype layout (EchoOS.dc.html lines 260-316):
// toolbar (⌕ search, category dropdown with ✓ marks, filtered/total count),
// flat post rows (82px date / title / 2-line clamp excerpt / cat badge) and a
// reading view (‹ all posts, cat · date, h1, excerpt) followed by the full
// markdown post rendered in-window from the per-post JSON
// (_plugins/post_json.rb → assets/data/posts/<slug>.json). Mermaid and markmap
// blocks are transformed exactly like the classic route so existing markdown
// support is preserved. On fetch failure the prototype's "read the full post on
// the current site" note + link remains as the fallback.
import { url } from '../base.js';

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
const MARKMAP_AUTOLOADER = 'https://cdn.jsdelivr.net/npm/markmap-autoloader@0.16';

let mermaidPromise = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import(/* webpackIgnore: true */ MERMAID_CDN)
      .then((m) => m.default || m)
      .catch(() => null);
  }
  return mermaidPromise;
}

let outsideClickListener = null;
function registerOutsideClickListener(app) {
  if (outsideClickListener) {
    document.removeEventListener('pointerdown', outsideClickListener);
  }
  outsideClickListener = (e) => {
    const catEl = app.querySelector('.os-blog-cat');
    if (catEl && !catEl.contains(e.target)) {
      state.catOpen = false;
      // Re-render to close the menu
      const rows = app.closest('.os-blog');
      if (rows && !state.sel) {
        document.removeEventListener('pointerdown', outsideClickListener);
        outsideClickListener = null;
      }
    }
  };
  document.addEventListener('pointerdown', outsideClickListener);
}

function clearOutsideClickListener() {
  if (outsideClickListener) {
    document.removeEventListener('pointerdown', outsideClickListener);
    outsideClickListener = null;
  }
}

async function renderDiagrams(container) {
  // Rouge wraps unknown lexers as <div class="language-X highlighter-rouge">…<code>
  // (no class on the code element); plain Kramdown uses <pre><code class="language-X">.
  const mermaidBlocks = container.querySelectorAll(
    'pre code.language-mermaid, .language-mermaid.highlighter-rouge pre code'
  );
  for (const code of mermaidBlocks) {
    const pre = document.createElement('pre');
    pre.className = 'mermaid';
    pre.textContent = code.textContent;
    (code.closest('.highlighter-rouge') || code.closest('pre')).replaceWith(pre);
  }
  if (mermaidBlocks.length) {
    const mermaid = await loadMermaid();
    if (mermaid) {
      try {
        mermaid.initialize({ startOnLoad: false, theme: document.documentElement.dataset.echoTheme === 'dark' ? 'dark' : 'default' });
        await mermaid.run({ nodes: container.querySelectorAll('pre.mermaid') });
      } catch { /* diagram failed — show source */ }
    }
  }

  const markmapBlocks = container.querySelectorAll(
    'pre code.language-markmap, .language-markmap.highlighter-rouge pre code'
  );
  if (markmapBlocks.length && !window.markmap) {
    const s = document.createElement('script');
    s.src = MARKMAP_AUTOLOADER;
    s.defer = true;
    document.head.appendChild(s);
  }
  for (const code of markmapBlocks) {
    const div = document.createElement('div');
    div.className = 'markmap';
    div.textContent = code.textContent;
    (code.closest('.highlighter-rouge') || code.closest('pre')).replaceWith(div);
  }
}

// Spotlight post selection (boot.js) asks the open reader to jump to a post.
// Kept at module scope so re-renders replace the listener instead of stacking.
let onOpenPost = null;
// Module-scope UI state (prototype S.blog*): survives window re-renders.
const state = { query: '', cat: 'All categories', catOpen: false, sel: null, page: 1 };

export function renderBlog(bodyEl, { content, toast }) {
  const posts = content.posts || [];
  const catOf = (p) => (p.categories && p.categories[0]) || p.category || '';
  const cats = ['All categories', ...new Set(posts.map(catOf).filter(Boolean))];

  if (onOpenPost) document.removeEventListener('echoos:open-post', onOpenPost);

  bodyEl.innerHTML = '<div class="os-blog"></div>';
  const app = bodyEl.querySelector('.os-blog');

  function filtered() {
    const q = state.query.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (state.cat === 'All categories' || catOf(p) === state.cat) &&
        (!q || (p.title + ' ' + (p.excerpt || '')).toLowerCase().includes(q))
    );
  }

  function renderList() {
    const PAGE_SIZE = 8;
    const all = filtered();
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    const rows = all.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    app.innerHTML = `
      <div class="os-blog-bar">
        <div class="os-blog-search">
          <span class="os-blog-search-ico">⌕</span>
          <input class="os-blog-search-input" placeholder="Search posts" spellcheck="false" aria-label="Search posts" />
        </div>
        <div class="os-blog-cat">
          <button type="button" class="os-blog-cat-btn" aria-haspopup="listbox" aria-expanded="${state.catOpen}">
            <span class="os-blog-cat-label">${esc(state.cat)}</span>
            <span class="os-blog-cat-caret">▾</span>
          </button>
          <div class="os-blog-cat-menu" ${state.catOpen ? '' : 'hidden'}></div>
        </div>
        <span class="os-blog-count">${all.length}/${posts.length}</span>
      </div>
      <div class="os-blog-rows"></div>
      <div class="os-blog-pager"></div>`;

    const input = app.querySelector('.os-blog-search-input');
    input.value = state.query;
    input.addEventListener('input', () => {
      state.query = input.value;
      state.page = 1;
      renderList();
    });

    app.querySelector('.os-blog-cat-btn').addEventListener('click', () => {
      state.catOpen = !state.catOpen;
      renderList();
    });

    const menu = app.querySelector('.os-blog-cat-menu');
    if (state.catOpen) {
      for (const c of cats) {
        const opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'os-blog-cat-opt';
        opt.innerHTML = `<span class="os-blog-cat-mark">${c === state.cat ? '✓' : ''}</span><span>${esc(c)}</span>`;
        opt.addEventListener('click', () => {
          state.cat = c;
          state.catOpen = false;
          state.page = 1;
          renderList();
        });
        menu.appendChild(opt);
      }
      registerOutsideClickListener(app);
    } else {
      clearOutsideClickListener();
    }

    // Rows with month/year separators
    const rowsEl = app.querySelector('.os-blog-rows');
    let lastGroup = null;
    for (const p of rows) {
      const parts = (p.date || '').split(' ');
      const group = parts.length >= 3 ? `${parts[0]} ${parts[2]}` : (p.date || '');
      if (group && group !== lastGroup) {
        const sep = document.createElement('div');
        sep.className = 'os-blog-sep';
        sep.textContent = `— ${group} —`;
        rowsEl.appendChild(sep);
        lastGroup = group;
      }
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'os-blog-row';
      row.innerHTML = `
        <span class="os-blog-row-date">${esc(p.date || '')}</span>
        <span class="os-blog-row-main">
          <span class="os-blog-row-title">${esc(p.title)}</span>
          <span class="os-blog-row-excerpt">${esc(p.excerpt || '')}</span>
        </span>
        ${catOf(p) ? `<span class="os-blog-row-cat">${esc(catOf(p))}</span>` : ''}`;
      row.addEventListener('click', () => {
        state.sel = posts.indexOf(p);
        renderReading(p);
      });
      rowsEl.appendChild(row);
    }

    // Pagination
    if (totalPages <= 1) return;
    const pagerEl = app.querySelector('.os-blog-pager');

    function pageSeq(cur, total) {
      const set = new Set([1, total, cur - 1, cur, cur + 1].filter(n => n >= 1 && n <= total));
      const sorted = [...set].sort((a, b) => a - b);
      const out = [];
      let prev = 0;
      for (const n of sorted) {
        if (n - prev > 1) out.push('…');
        out.push(n);
        prev = n;
      }
      return out;
    }

    const addBtn = (label, target, disabled, active) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'os-blog-page-btn' + (active ? ' is-active' : '');
      btn.textContent = label;
      if (disabled) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => { state.page = target; renderList(); });
      }
      pagerEl.appendChild(btn);
    };

    addBtn('«', 1, state.page === 1, false);
    addBtn('‹', state.page - 1, state.page === 1, false);
    for (const n of pageSeq(state.page, totalPages)) {
      if (n === '…') {
        const el = document.createElement('span');
        el.className = 'os-blog-page-ellipsis';
        el.textContent = '…';
        pagerEl.appendChild(el);
      } else {
        addBtn(String(n), n, false, n === state.page);
      }
    }
    addBtn('›', state.page + 1, state.page === totalPages, false);
    addBtn('»', totalPages, state.page === totalPages, false);
  }

  async function renderReading(post) {
    state.catOpen = false;
    const idx = state.sel;
    const prevPost = posts[idx + 1] || null; // older = previous
    const nextPost = posts[idx - 1] || null; // newer = next
    const imageHtml = post.image ? `<img class="os-blog-image" src="${esc(post.image)}" alt="">` : '';
    app.innerHTML = `
      <div class="os-blog-back-bar">
        <button type="button" class="os-blog-back">‹ all posts</button>
      </div>
      <div class="os-blog-meta">${catOf(post) ? esc(catOf(post)) + ' · ' : ''}${esc(post.date || '')}</div>
      <h1 class="os-blog-h1">${esc(post.title)}</h1>
      ${imageHtml}
      <p class="os-blog-excerpt">${esc(post.excerpt || '')}</p>
      <div class="os-blog-loading">Loading…</div>
      <div class="os-blog-nav">
        <button type="button" class="os-blog-nav-btn os-blog-nav-prev"${!prevPost ? ' disabled' : ''}>‹ Previous</button>
        <button type="button" class="os-blog-nav-btn os-blog-nav-next"${!nextPost ? ' disabled' : ''}>Next ›</button>
      </div>`;

    app.querySelector('.os-blog-back-bar .os-blog-back').addEventListener('click', () => {
      state.sel = null;
      renderList();
    });
    if (prevPost) {
      app.querySelector('.os-blog-nav-prev').addEventListener('click', () => {
        state.sel = idx + 1;
        renderReading(prevPost);
      });
    }
    if (nextPost) {
      app.querySelector('.os-blog-nav-next').addEventListener('click', () => {
        state.sel = idx - 1;
        renderReading(nextPost);
      });
    }

    const heroImg = app.querySelector('.os-blog-image');
    if (heroImg) heroImg.addEventListener('error', () => heroImg.remove(), { once: true });

    const holder = app.querySelector('.os-blog-loading');
    holder.className = 'os-blog-body';
    const fallbackNote = () => {
      holder.innerHTML = `
        <div class="os-blog-note">
          <div class="os-blog-note-text">In the Jekyll build, the full markdown post renders here inside the window.</div>
          <a class="os-blog-note-link" href="${esc(post.url)}" target="_blank" rel="noopener">Read the full post on the current site ↗</a>
        </div>`;
    };
    try {
      const res = await fetch(url(`/assets/data/posts/${post.slug}.json`));
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const article = document.createElement('article');
      article.className = 'os-post';
      article.innerHTML = `<div class="os-post-body">${data.html || ''}</div>`;
      holder.innerHTML = '';
      holder.appendChild(article);
      await renderDiagrams(article);
      if (!post.image && data.image) {
        const img = document.createElement('img');
        img.className = 'os-blog-image';
        img.src = data.image;
        img.alt = '';
        img.addEventListener('error', () => img.remove(), { once: true });
        app.querySelector('.os-blog-h1').after(img);
      }
    } catch {
      if (toast) toast('Could not load post — opening in a new tab');
      fallbackNote();
    }
  }

  if (state.sel != null) {
    const post = posts[state.sel];
    if (post) renderReading(post);
    else {
      state.sel = null;
      renderList();
    }
  } else {
    renderList();
  }

  onOpenPost = (e) => {
    const slug = e.detail && e.detail.slug;
    const i = posts.findIndex((p) => p.slug === slug);
    if (i >= 0) {
      state.sel = i;
      renderReading(posts[i]);
    }
  };
  document.addEventListener('echoos:open-post', onOpenPost);

  // Return teardown function (Patch 23 contract)
  return () => {
    clearOutsideClickListener();
    document.removeEventListener('echoos:open-post', onOpenPost);
  };
}

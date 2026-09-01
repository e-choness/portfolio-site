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
    mermaidPromise = import(/* webpackIgnore: true */ MERMAID_CDN).catch(() => null);
  }
  return mermaidPromise;
}

async function renderDiagrams(container) {
  const mermaidBlocks = container.querySelectorAll('pre code.language-mermaid');
  for (const code of mermaidBlocks) {
    const pre = document.createElement('pre');
    pre.className = 'mermaid';
    pre.textContent = code.textContent;
    code.closest('pre').replaceWith(pre);
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

  const markmapBlocks = container.querySelectorAll('pre code.language-markmap');
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
    code.closest('pre').replaceWith(div);
  }
}

// Spotlight post selection (boot.js) asks the open reader to jump to a post.
// Kept at module scope so re-renders replace the listener instead of stacking.
let onOpenPost = null;
// Module-scope UI state (prototype S.blog*): survives window re-renders.
const state = { query: '', cat: 'All categories', catOpen: false, sel: null };

export function renderBlog(bodyEl, { content, toast }) {
  const posts = content.posts || [];
  const catOf = (p) => (p.categories && p.categories[0]) || 'Uncategorized';
  const cats = ['All categories', ...new Set(posts.map(catOf))];

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
    const rows = filtered();
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
        <span class="os-blog-count">${rows.length}/${posts.length}</span>
      </div>
      <div class="os-blog-rows"></div>`;

    const input = app.querySelector('.os-blog-search-input');
    input.value = state.query;
    input.addEventListener('input', () => {
      state.query = input.value;
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
          renderList();
        });
        menu.appendChild(opt);
      }
    }

    const rowsEl = app.querySelector('.os-blog-rows');
    for (const p of rows) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'os-blog-row';
      row.innerHTML = `
        <span class="os-blog-row-date">${esc(p.date || '')}</span>
        <span class="os-blog-row-main">
          <span class="os-blog-row-title">${esc(p.title)}</span>
          <span class="os-blog-row-excerpt">${esc(p.excerpt || '')}</span>
        </span>
        <span class="os-blog-row-cat">${esc(catOf(p))}</span>`;
      row.addEventListener('click', () => {
        state.sel = posts.indexOf(p);
        renderReading(p);
      });
      rowsEl.appendChild(row);
    }
  }

  async function renderReading(post) {
    state.catOpen = false;
    app.innerHTML = `
      <button type="button" class="os-blog-back">‹ all posts</button>
      <div class="os-blog-meta">${esc(catOf(post))} · ${esc(post.date || '')}</div>
      <h1 class="os-blog-h1">${esc(post.title)}</h1>
      <p class="os-blog-excerpt">${esc(post.excerpt || '')}</p>
      <div class="os-blog-loading">Loading…</div>`;

    app.querySelector('.os-blog-back').addEventListener('click', () => {
      state.sel = null;
      renderList();
    });

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
      // Prototype keeps a link to the live post below the in-window render.
      const note = document.createElement('div');
      note.className = 'os-blog-note';
      note.innerHTML = `
        <div class="os-blog-note-text">Read the full post on the current site.</div>
        <a class="os-blog-note-link" href="${esc(post.url)}" target="_blank" rel="noopener">Read the full post on the current site ↗</a>`;
      holder.appendChild(note);
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
}

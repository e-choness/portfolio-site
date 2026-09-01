// apps/blog.js — post list + reader pane (§6.5).
// The reader fetches the per-post JSON (assets/data/posts/<slug>.json) and
// falls back to window.open(post.url) when the fetch fails. Mermaid and
// markmap blocks are transformed exactly like the classic route
// (_includes/scripts.html) so existing markdown support is preserved.
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

export function renderBlog(bodyEl, { content, toast }) {
  const posts = content.posts || [];

  bodyEl.innerHTML = `
    <div class="os-blog">
      <ul class="os-blog-list"></ul>
      <div class="os-blog-reader">
        <p class="os-blog-empty">Pick a post to read it here.</p>
      </div>
    </div>`;

  const list = bodyEl.querySelector('.os-blog-list');
  const reader = bodyEl.querySelector('.os-blog-reader');

  for (const post of posts) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'os-blog-item';
    btn.innerHTML = `
      <span class="os-blog-item-title"></span>
      <span class="os-blog-item-meta"></span>`;
    btn.querySelector('.os-blog-item-title').textContent = post.title;
    const meta = [];
    if (post.date) meta.push(post.date);
    if (post.readTime) meta.push(`${post.readTime} min read`);
    if (post.categories && post.categories.length) meta.push(post.categories.join(', '));
    btn.querySelector('.os-blog-item-meta').textContent = meta.join(' · ');
    btn.addEventListener('click', () => openPost(post));
    li.appendChild(btn);
    list.appendChild(li);
  }

  async function openPost(post) {
    reader.innerHTML = '<p class="os-blog-loading">Loading…</p>';
    list.querySelectorAll('.os-blog-item').forEach((b) => b.classList.remove('is-on'));
    const btn = Array.from(list.querySelectorAll('.os-blog-item')).find(
      (b) => b.querySelector('.os-blog-item-title').textContent === post.title
    );
    if (btn) btn.classList.add('is-on');
    try {
      const res = await fetch(url(`/assets/data/posts/${post.slug}.json`));
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const article = document.createElement('article');
      article.className = 'os-post';
      const h = document.createElement('h2');
      h.textContent = data.title || post.title;
      const d = document.createElement('p');
      d.className = 'os-post-date';
      d.textContent = data.date || '';
      article.append(h, d);
      const body = document.createElement('div');
      body.className = 'os-post-body';
      body.innerHTML = data.html || '';
      article.appendChild(body);
      reader.innerHTML = '';
      reader.appendChild(article);
      await renderDiagrams(article);
    } catch {
      if (toast) toast('Could not load post — opening in a new tab');
      window.open(post.url, '_blank', 'noopener');
    }
  }
}

// apps/projects.js — card gallery with in-window detail view (patch 73+77).
import { url } from '../base.js';
import { writeRoute } from '../router.js';

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

// Module-scope: survives window re-renders (same pattern as blog.js).
const state = { sel: null };
// Deep-link / router listener, replaced on every render (see blog.js onOpenPost).
let onOpenProject = null;

// Outbound links, in display order: live/store, docs, repository, website.
// `live_pending` shows the demo link greyed out until there is a live_url.
function projectLinks(p, className) {
  const links = document.createElement('div');
  links.className = className;
  const add = (href, cls, text) => {
    if (!href) return;
    const a = document.createElement('a');
    a.className = cls;
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = `${text} ↗`;
    links.appendChild(a);
  };
  if (p.demo) add(p.demo, 'os-proj-demo', p.demoLabel || 'Live Demo');
  else if (p.demoPending) {
    const s = document.createElement('span');
    s.className = 'os-proj-demo is-pending';
    s.title = 'Not deployed yet';
    s.setAttribute('aria-disabled', 'true');
    s.textContent = `${p.demoLabel || 'Live Demo'} ↗`;
    links.appendChild(s);
  }
  add(p.docs, 'os-proj-repo', 'Docs');
  add(p.repo, 'os-proj-repo', 'GitHub');
  add(p.website, 'os-proj-repo', 'Website');
  return links;
}

export function renderProjects(bodyEl, { content }) {
  const projects = content.projects || [];

  function renderList() {
    state.sel = null;
    writeRoute('proj', null);
    bodyEl.innerHTML = `<div class="os-proj-grid"></div>`;
    const grid = bodyEl.querySelector('.os-proj-grid');
    for (const p of projects) grid.appendChild(card(p));
  }

  function card(p) {
    const article = document.createElement('article');
    article.className = 'os-proj-card';

    if (p.image) {
      const img = document.createElement('img');
      img.className = 'os-proj-image';
      img.src = p.image;
      img.alt = p.title;
      img.loading = 'lazy';
      img.addEventListener('error', () => img.remove(), { once: true });
      article.appendChild(img);
    } else {
      const cover = document.createElement('div');
      cover.className = 'os-proj-cover';
      const label = document.createElement('span');
      label.className = 'os-proj-cover-label';
      label.textContent = 'cover art';
      cover.appendChild(label);
      article.appendChild(cover);
    }

    const body = document.createElement('div');
    body.className = 'os-proj-body';

    if (p.cat) {
      const cat = document.createElement('span');
      cat.className = 'os-proj-cat';
      cat.textContent = p.cat;
      body.appendChild(cat);
    }

    // Title as button — opens in-window detail view (patch 73).
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'os-proj-title';
    btn.textContent = p.title;
    btn.addEventListener('click', () => {
      state.sel = projects.indexOf(p);
      renderDetail(p);
    });
    body.appendChild(btn);

    if (p.desc) {
      const d = document.createElement('p');
      d.className = 'os-proj-desc';
      d.textContent = p.desc;
      body.appendChild(d);
    }

    if ((p.tech || []).length) {
      const ul = document.createElement('ul');
      ul.className = 'os-chips';
      for (const t of p.tech) {
        const li = document.createElement('li');
        li.className = 'os-chip';
        li.textContent = t;
        ul.appendChild(li);
      }
      body.appendChild(ul);
    }

    const links = projectLinks(p, 'os-proj-links');
    if (links.childElementCount) body.appendChild(links);

    article.appendChild(body);
    return article;
  }

  function renderDetail(p) {
    writeRoute('proj', p.slug || null);
    bodyEl.innerHTML = '';

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'os-proj-back';
    back.textContent = '‹ all projects';
    back.addEventListener('click', renderList);
    bodyEl.appendChild(back);

    const detail = document.createElement('div');
    detail.className = 'os-proj-detail';

    if (p.video) {
      // Animated previews ship as video (a GIF of the same loop was 30× the
      // size). Cards show only the poster; the clip loads here. Reduced motion
      // gets controls instead of autoplay.
      const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const vid = document.createElement('video');
      vid.className = 'os-proj-detail-img';
      vid.src = p.video;
      if (p.image) vid.poster = p.image;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.autoplay = !still;
      vid.controls = still;
      vid.setAttribute('aria-label', `${p.title} gameplay`);
      detail.appendChild(vid);
    } else if (p.image) {
      const img = document.createElement('img');
      img.className = 'os-proj-detail-img';
      img.src = p.image;
      img.alt = p.title;
      img.addEventListener('error', () => img.remove(), { once: true });
      detail.appendChild(img);
    } else {
      const cover = document.createElement('div');
      cover.className = 'os-proj-detail-cover';
      const label = document.createElement('span');
      label.className = 'os-proj-cover-label';
      label.textContent = 'cover art';
      cover.appendChild(label);
      detail.appendChild(cover);
    }

    if (p.cat) {
      const cat = document.createElement('span');
      cat.className = 'os-proj-cat';
      cat.textContent = p.cat;
      detail.appendChild(cat);
    }

    const h1 = document.createElement('h1');
    h1.className = 'os-proj-detail-title';
    h1.textContent = p.title;
    detail.appendChild(h1);

    // Links sit right under the title so they're visible without scrolling.
    const links = projectLinks(p, 'os-proj-detail-links');
    if (links.childElementCount) detail.appendChild(links);

    if (p.desc) {
      const desc = document.createElement('p');
      desc.className = 'os-proj-desc';
      desc.textContent = p.desc;
      detail.appendChild(desc);
    }

    if ((p.tech || []).length) {
      const ul = document.createElement('ul');
      ul.className = 'os-chips';
      for (const t of p.tech) {
        const li = document.createElement('li');
        li.className = 'os-chip';
        li.textContent = t;
        ul.appendChild(li);
      }
      detail.appendChild(ul);
    }

    // Placeholder filled by the async fetch below.
    const bodyDiv = document.createElement('div');
    detail.appendChild(bodyDiv);

    bodyEl.appendChild(detail);

    // Fetch rendered markdown body from the build-time JSON (patch 77).
    if (p.slug) {
      fetch(url('/assets/data/projects/' + p.slug + '.json'))
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.html && bodyEl.contains(bodyDiv)) {
            bodyDiv.className = 'os-post-body';
            bodyDiv.innerHTML = data.html;
          }
        })
        .catch(() => {});
    }
  }

  if (state.sel != null) {
    const p = projects[state.sel];
    if (p) renderDetail(p);
    else renderList();
  } else {
    renderList();
  }

  if (onOpenProject) document.removeEventListener('echoos:open-project', onOpenProject);
  onOpenProject = (e) => {
    const slug = e.detail && e.detail.slug;
    const i = projects.findIndex((p) => p.slug === slug);
    if (i >= 0) {
      state.sel = i;
      renderDetail(projects[i]);
    }
  };
  document.addEventListener('echoos:open-project', onOpenProject);

  return () => {
    document.removeEventListener('echoos:open-project', onOpenProject);
    onOpenProject = null;
  };
}

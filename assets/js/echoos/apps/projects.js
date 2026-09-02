// apps/projects.js — card gallery with in-window detail view (patch 73).
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

// Module-scope: survives window re-renders (same pattern as blog.js).
const state = { sel: null };

export function renderProjects(bodyEl, { content }) {
  const projects = content.projects || [];

  function renderList() {
    state.sel = null;
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

    const links = document.createElement('div');
    links.className = 'os-proj-links';
    if (p.demo) {
      const a = document.createElement('a');
      a.className = 'os-proj-demo';
      a.href = p.demo;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Live Demo ↗';
      links.appendChild(a);
    }
    if (p.repo) {
      const a = document.createElement('a');
      a.className = 'os-proj-repo';
      a.href = p.repo;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'GitHub ↗';
      links.appendChild(a);
    }
    if (links.childElementCount) body.appendChild(links);

    article.appendChild(body);
    return article;
  }

  function renderDetail(p) {
    bodyEl.innerHTML = '';

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'os-proj-back';
    back.textContent = '‹ all projects';
    back.addEventListener('click', renderList);
    bodyEl.appendChild(back);

    const detail = document.createElement('div');
    detail.className = 'os-proj-detail';

    if (p.image) {
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

    const links = document.createElement('div');
    links.className = 'os-proj-detail-links';
    if (p.demo) {
      const a = document.createElement('a');
      a.className = 'os-proj-demo';
      a.href = p.demo;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Live Demo ↗';
      links.appendChild(a);
    }
    if (p.repo) {
      const a = document.createElement('a');
      a.className = 'os-proj-repo';
      a.href = p.repo;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'GitHub ↗';
      links.appendChild(a);
    }
    if (links.childElementCount) detail.appendChild(links);

    bodyEl.appendChild(detail);
  }

  if (state.sel != null) {
    const p = projects[state.sel];
    if (p) renderDetail(p);
    else renderList();
  } else {
    renderList();
  }
}

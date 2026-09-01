// apps/projects.js — card gallery without filter chips (prototype-only).
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

export function renderProjects(bodyEl, { content }) {
  const projects = content.projects || [];

  bodyEl.innerHTML = `<div class="os-proj-grid"></div>`;

  const grid = bodyEl.querySelector('.os-proj-grid');

  function card(p) {
    const article = document.createElement('article');
    article.className = 'os-proj-card';

    // Cover: real screenshot when available, else striped "cover art"
    // placeholder (prototype EchoOS.dc.html lines 195-201).
    if (p.image) {
      const img = document.createElement('img');
      img.className = 'os-proj-image';
      img.src = p.image;
      img.alt = p.title;
      img.loading = 'lazy';
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

    const h = document.createElement('a');
    h.className = 'os-proj-title';
    h.textContent = p.title;
    if (p.url) h.href = p.url;
    body.appendChild(h);

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

    // Links row: Live Demo ↗ + GitHub ↗ (title is now the link to project page)
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

  function render() {
    grid.innerHTML = '';
    for (const p of projects) grid.appendChild(card(p));
  }

  render();
}

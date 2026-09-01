// apps/projects.js — card gallery with tech filter chips (§6.5).
// Filter options are derived from the union of tech[] — never hardcoded.
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

export function renderProjects(bodyEl, { content }) {
  const projects = content.projects || [];
  const allTech = [...new Set(projects.flatMap((p) => p.tech || []))].sort();
  let active = 'All';

  bodyEl.innerHTML = `
    <div class="os-proj-filters">
      <button type="button" class="os-chip-btn is-on" data-t="All">All</button>
    </div>
    <div class="os-proj-grid"></div>`;

  const filters = bodyEl.querySelector('.os-proj-filters');
  const grid = bodyEl.querySelector('.os-proj-grid');

  for (const t of allTech) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'os-chip-btn';
    b.dataset.t = t;
    b.textContent = t;
    filters.appendChild(b);
  }

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

    const h = document.createElement('h4');
    h.className = 'os-proj-title';
    h.textContent = p.title;
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

    // Details (plan: keeps the per-project page) + prototype's ↗ links.
    const links = document.createElement('div');
    links.className = 'os-proj-links';
    if (p.url) {
      const a = document.createElement('a');
      a.className = 'os-proj-details';
      a.href = p.url;
      a.textContent = 'Details';
      links.appendChild(a);
    }
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
    const shown = active === 'All' ? projects : projects.filter((p) => (p.tech || []).includes(active));
    for (const p of shown) grid.appendChild(card(p));
  }

  filters.addEventListener('click', (e) => {
    const b = e.target.closest('.os-chip-btn');
    if (!b) return;
    active = b.dataset.t;
    filters.querySelectorAll('.os-chip-btn').forEach((x) => x.classList.toggle('is-on', x === b));
    render();
  });

  render();
}

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

    if (p.image) {
      const img = document.createElement('img');
      img.className = 'os-proj-image';
      img.src = p.image;
      img.alt = p.title;
      img.loading = 'lazy';
      article.appendChild(img);
    }

    const h = document.createElement('h4');
    h.className = 'os-proj-title';
    h.textContent = p.title;
    article.appendChild(h);

    if (p.desc) {
      const d = document.createElement('p');
      d.className = 'os-proj-desc';
      d.textContent = p.desc;
      article.appendChild(d);
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
      article.appendChild(ul);
    }

    const links = document.createElement('div');
    links.className = 'os-proj-links';
    if (p.url) {
      const a = document.createElement('a');
      a.className = 'os-proj-link';
      a.href = p.url;
      a.textContent = 'Details';
      links.appendChild(a);
    }
    if (p.demo) {
      const a = document.createElement('a');
      a.className = 'os-proj-link';
      a.href = p.demo;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Demo';
      links.appendChild(a);
    }
    if (p.repo) {
      const a = document.createElement('a');
      a.className = 'os-proj-link';
      a.href = p.repo;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'GitHub';
      links.appendChild(a);
    }
    if (links.childElementCount) article.appendChild(links);

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

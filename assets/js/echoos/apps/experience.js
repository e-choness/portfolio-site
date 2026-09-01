// apps/experience.js — vertical timeline of roles (§6.5).
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function chips(list) {
  const ul = document.createElement('ul');
  ul.className = 'os-chips';
  for (const t of list || []) {
    const li = document.createElement('li');
    li.className = 'os-chip';
    li.textContent = t;
    ul.appendChild(li);
  }
  return ul;
}

export function renderExperience(bodyEl, { content }) {
  const timeline = document.createElement('ol');
  timeline.className = 'os-timeline';

  for (const e of content.experience || []) {
    const item = document.createElement('li');
    item.className = 'os-timeline-item';

    const head = document.createElement('div');
    head.className = 'os-exp-head';
    if (e.logo) {
      const logo = document.createElement('img');
      logo.className = 'os-exp-logo';
      logo.src = e.logo;
      logo.alt = `${e.company} logo`;
      head.appendChild(logo);
    }
    const meta = document.createElement('div');
    meta.className = 'os-exp-meta';
    const role = document.createElement('h4');
    role.textContent = e.role;
    const company = document.createElement('p');
    company.className = 'os-exp-company';
    company.textContent = e.company;
    const dur = document.createElement('p');
    dur.className = 'os-exp-duration';
    dur.textContent = `${e.duration}${e.location ? ' · ' + e.location : ''}`;
    meta.append(role, company, dur);
    head.appendChild(meta);
    item.appendChild(head);

    if (e.desc) {
      const desc = document.createElement('p');
      desc.className = 'os-exp-desc';
      desc.textContent = e.desc;
      item.appendChild(desc);
    }

    if ((e.bullets || []).length) {
      const bullets = document.createElement('ul');
      bullets.className = 'os-exp-bullets';
      for (const b of e.bullets) {
        const li = document.createElement('li');
        li.textContent = b;
        bullets.appendChild(li);
      }
      item.appendChild(bullets);
    }

    if ((e.tech || []).length) {
      item.appendChild(chips(e.tech));
    }

    timeline.appendChild(item);
  }

  bodyEl.innerHTML = '';
  bodyEl.appendChild(timeline);
}

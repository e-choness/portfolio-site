// apps/experience.js — card-based roles with duration pills (patch 40).
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

export function renderExperience(bodyEl, { content }) {
  const container = document.createElement('div');
  container.className = 'os-exp-cards';

  for (const e of content.experience || []) {
    const card = document.createElement('article');
    card.className = 'os-exp-card';

    // Head row: logo + meta + duration pill
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
    role.className = 'os-exp-role';
    role.textContent = e.position;
    const company = document.createElement('p');
    company.className = 'os-exp-company';
    company.textContent = e.company;
    meta.append(role, company);
    head.appendChild(meta);

    const pill = document.createElement('div');
    pill.className = 'os-exp-pill';
    pill.textContent = esc(e.duration);
    head.appendChild(pill);

    card.appendChild(head);

    // Description
    if (e.description) {
      const desc = document.createElement('p');
      desc.className = 'os-exp-desc';
      desc.textContent = e.description;
      card.appendChild(desc);
    }

    // Responsibilities (bullets)
    if ((e.responsibilities || []).length) {
      const bullets = document.createElement('ul');
      bullets.className = 'os-exp-bullets';
      for (const b of e.responsibilities) {
        const li = document.createElement('li');
        li.textContent = b;
        bullets.appendChild(li);
      }
      card.appendChild(bullets);
    }

    // Technologies (chips)
    if ((e.technologies || []).length) {
      const chipRow = document.createElement('div');
      chipRow.className = 'os-exp-chips';
      for (const t of e.technologies) {
        const chip = document.createElement('span');
        chip.className = 'os-exp-chip';
        chip.textContent = t;
        chipRow.appendChild(chip);
      }
      card.appendChild(chipRow);
    }

    container.appendChild(card);
  }

  bodyEl.innerHTML = '';
  bodyEl.appendChild(container);
}

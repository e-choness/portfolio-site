// apps/skills.js — "system monitor": one bar per skill, grouped (§6.5).
// Bars animate width on open only.
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

export function renderSkills(bodyEl, { content }) {
  const wrap = document.createElement('div');
  wrap.className = 'os-skills';

  // Derive process count and max uptime from data
  let procCount = 0;
  let maxYears = 0;
  for (const g of content.skills || []) {
    for (const s of g.skills || []) {
      procCount++;
      maxYears = Math.max(maxYears, s.years || 0);
    }
  }

  // Header line: derived process count and uptime
  const top = document.createElement('div');
  top.className = 'os-skills-top';
  top.textContent = `echo-top — ${procCount} processes running · uptime ${maxYears}y+ · load: healthy`;
  wrap.appendChild(top);

  for (const g of content.skills || []) {
    const group = document.createElement('section');
    group.className = 'os-skills-group';

    const h = document.createElement('h4');
    h.className = 'os-skills-group-title';
    h.textContent = g.group;
    group.appendChild(h);

    const list = document.createElement('ul');
    list.className = 'os-skills-list';
    for (const s of g.items || []) {
      const li = document.createElement('li');
      li.className = 'os-skills-item';

      const label = document.createElement('span');
      label.className = 'os-skills-label';
      label.textContent = s.name;
      li.appendChild(label);

      // Prototype row: name · years (26px) · bar 170×7 · pct (34px).
      const years = document.createElement('span');
      years.className = 'os-skills-years';
      years.textContent = `${s.years}y`;
      li.appendChild(years);

      const track = document.createElement('div');
      track.className = 'os-skills-track';
      const fill = document.createElement('div');
      fill.className = 'os-skills-fill';
      fill.style.width = '0%';
      fill.dataset.level = String(s.level);
      track.appendChild(fill);
      li.appendChild(track);

      const pct = document.createElement('span');
      pct.className = 'os-skills-pct';
      pct.textContent = `${s.level}%`;
      li.appendChild(pct);

      list.appendChild(li);
    }
    group.appendChild(list);
    wrap.appendChild(group);
  }

  bodyEl.innerHTML = '';
  bodyEl.appendChild(wrap);

  // Animate once on open: set the real width on the next frame.
  requestAnimationFrame(() => {
    wrap.querySelectorAll('.os-skills-fill').forEach((f) => {
      f.style.width = `${f.dataset.level}%`;
    });
  });
}

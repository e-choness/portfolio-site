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
    for (const s of g.items || []) {
      procCount++;
      maxYears = Math.max(maxYears, s.years || 0);
    }
  }

  // Header line: derived process count; uptime is career length from
  // profile.stats[0] (the one source), falling back to longest skill tenure.
  const yearsDisplay = content.profile?.stats?.[0]?.display ?? `${maxYears}y+`;
  const top = document.createElement('div');
  top.className = 'os-skills-top';
  top.textContent = `echo-top — ${procCount} processes running · uptime ${yearsDisplay} · load: healthy`;
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

      // Row: name · bar · years. The bar is years used relative to the
      // longest-used skill, not a self-rated percentage.
      const track = document.createElement('div');
      track.className = 'os-skills-track';
      const fill = document.createElement('div');
      fill.className = 'os-skills-fill';
      fill.style.width = '0%';
      fill.dataset.level = String(maxYears ? Math.round(((s.years || 0) / maxYears) * 100) : 0);
      track.appendChild(fill);
      li.appendChild(track);

      const years = document.createElement('span');
      years.className = 'os-skills-years';
      years.textContent = `${s.years}y`;
      li.appendChild(years);

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

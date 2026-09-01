// apps/about.js — tabs: profile / education (§6.5).
import { store } from '../store.js';

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

export function renderAbout(bodyEl, { content }) {
  const p = content.profile;

  bodyEl.innerHTML = `
    <div class="os-tabs" role="tablist" aria-label="About sections">
      <button type="button" class="os-tab" data-tab="profile" role="tab">profile</button>
      <button type="button" class="os-tab" data-tab="education" role="tab">education</button>
    </div>
    <div class="os-tab-panels"></div>`;

  const panels = bodyEl.querySelector('.os-tab-panels');

  function profilePanel() {
    const frag = document.createElement('div');
    frag.className = 'os-about-profile';

    const img = document.createElement('img');
    img.className = 'os-about-portrait';
    img.src = p.portrait;
    img.alt = `Portrait of ${p.name}`;
    frag.appendChild(img);

    const bio = document.createElement('div');
    bio.className = 'os-about-bio';
    for (const para of p.about || []) {
      const el = document.createElement('p');
      el.textContent = para;
      bio.appendChild(el);
    }
    frag.appendChild(bio);

    // Stats come straight from _data/profile.yml. The prototype presents
    // "Years Experience" as "8+"; data says 8, so the "+" is presentation
    // (applied only to the first stat), not invented content.
    const stats = document.createElement('ul');
    stats.className = 'os-about-stats';
    for (let i = 0; i < (p.stats || []).length; i++) {
      const s = p.stats[i];
      const li = document.createElement('li');
      li.innerHTML = `<strong>${esc(s.value)}${i === 0 ? '+' : ''}</strong><span>${esc(s.label)}</span>`;
      stats.appendChild(li);
    }
    frag.appendChild(stats);

    const social = document.createElement('ul');
    social.className = 'os-about-social';
    for (const s of p.social || []) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.label;
      if (s.url.startsWith('mailto:')) a.href = s.url; // mailto links are fine as-is
      else a.target = '_blank';
      a.rel = 'noopener noreferrer';
      li.appendChild(a);
      social.appendChild(li);
    }
    frag.appendChild(social);

    return frag;
  }

  function educationPanel() {
    const frag = document.createElement('div');
    frag.className = 'os-about-education';
    for (const ed of content.education || []) {
      const card = document.createElement('article');
      card.className = 'os-edu-card';
      const head = document.createElement('div');
      head.className = 'os-edu-head';
      if (ed.logo) {
        const logo = document.createElement('img');
        logo.className = 'os-edu-logo';
        logo.src = ed.logo;
        logo.alt = `${ed.school} logo`;
        head.appendChild(logo);
      }
      const meta = document.createElement('div');
      meta.className = 'os-edu-meta';
      const deg = document.createElement('h4');
      deg.textContent = ed.degree;
      const school = document.createElement('p');
      school.className = 'os-edu-school';
      school.textContent = ed.school;
      const dur = document.createElement('p');
      dur.className = 'os-edu-duration';
      dur.textContent = `${ed.duration}${ed.location ? ' · ' + ed.location : ''}`;
      meta.append(deg, school, dur);
      head.appendChild(meta);
      card.appendChild(head);
      if ((ed.notes || []).length) {
        const notes = document.createElement('ul');
        notes.className = 'os-edu-notes';
        for (const n of ed.notes) {
          const li = document.createElement('li');
          li.textContent = n;
          notes.appendChild(li);
        }
        card.appendChild(notes);
      }
      frag.appendChild(card);
    }
    return frag;
  }

  function show(tab) {
    store.set({ aboutTab: tab });
    panels.innerHTML = '';
    panels.appendChild(tab === 'education' ? educationPanel() : profilePanel());
    bodyEl.querySelectorAll('.os-tab').forEach((b) => {
      b.classList.toggle('is-on', b.dataset.tab === tab);
      b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false');
    });
  }

  bodyEl.addEventListener('click', (e) => {
    const b = e.target.closest('.os-tab');
    if (b) show(b.dataset.tab);
  });

  show(store.get().aboutTab || 'profile');
}

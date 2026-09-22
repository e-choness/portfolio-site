// apps/about.js — tabs: profile / education (§6.5).
import { store } from '../store.js';
import { url } from '../base.js';

const SOCIAL_ICON_FILES = {
  GitHub:       'github.svg',
  LinkedIn:     'linkedin.svg',
  'Twitter / X':'twitter.svg',
  Email:        'email.svg',
};

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

export function renderAbout(bodyEl, { content, titlebar }) {
  const p = content.profile;

  bodyEl.innerHTML = `<div class="os-tab-panels"></div>`;

  const panels = bodyEl.querySelector('.os-tab-panels');

  // Title-bar tabs (Patch 32 titlebar element)
  if (titlebar) {
    titlebar.innerHTML = `
      <button type="button" class="os-tab-btn" data-tab="profile" role="tab" aria-selected="true">Profile</button>
      <button type="button" class="os-tab-btn" data-tab="education" role="tab" aria-selected="false">Education</button>`;
  }

  function profilePanel() {
    const frag = document.createElement('div');
    frag.className = 'os-about-profile';

    // Header row: portrait + name / title / location (EchoOS.dc.html 95-102).
    const header = document.createElement('div');
    header.className = 'os-about-header';
    const img = document.createElement('img');
    img.className = 'os-about-portrait';
    img.src = p.portrait;
    img.alt = `Portrait of ${p.name}`;
    const portraitWrap = document.createElement('div');
    portraitWrap.className = 'os-about-portrait-wrap';
    portraitWrap.appendChild(img);
    const id = document.createElement('div');
    id.className = 'os-about-id';
    const nameEl = document.createElement('div');
    nameEl.className = 'os-about-name';
    nameEl.textContent = p.name;
    const titleEl = document.createElement('div');
    titleEl.className = 'os-about-title';
    titleEl.textContent = p.title;
    const locEl = document.createElement('div');
    locEl.className = 'os-about-loc';
    locEl.textContent = p.location;
    const badge = document.createElement('div');
    badge.className = 'os-about-badge';
    const dot = document.createElement('span');
    dot.className = 'os-about-badge-dot';
    badge.append(dot, 'Open to opportunities');
    id.append(nameEl, titleEl, locEl, badge);
    header.append(portraitWrap, id);
    frag.appendChild(header);

    const bio = document.createElement('div');
    bio.className = 'os-about-bio';
    for (const para of p.about || []) {
      const el = document.createElement('p');
      el.textContent = para;
      bio.appendChild(el);
    }
    frag.appendChild(bio);

    // Stats from _data/profile.yml with optional display override
    const stats = document.createElement('ul');
    stats.className = 'os-about-stats';
    for (const s of p.stats || []) {
      const li = document.createElement('li');
      const displayValue = s.display || s.value;
      li.innerHTML = `<strong>${esc(displayValue)}</strong><span>${esc(s.label)}</span>`;
      stats.appendChild(li);
    }
    frag.appendChild(stats);

    // Contact section (formerly the Contact app): pitch + 2×2 tiles showing
    // where each link goes. The resume download lives in one place only —
    // the Experience window's title bar, next to the Resume tab.
    const contact = document.createElement('section');
    contact.className = 'os-about-contact';
    contact.setAttribute('aria-label', 'Contact');
    contact.innerHTML = `
      <div class="os-contact-eyebrow">say hello</div>
      <div class="os-contact-blurb">I'm always interested in new opportunities and exciting projects. Let's discuss how we can work together.</div>
      <div class="os-contact-social"></div>`;
    const social = contact.querySelector('.os-contact-social');
    for (const s of p.social || []) {
      const a = document.createElement('a');
      a.className = 'os-contact-social-link';
      a.href = s.url;
      if (!s.url.startsWith('mailto:')) a.target = '_blank';
      a.rel = 'noopener noreferrer';
      const host = s.url.startsWith('mailto:') ? s.url.slice(7) : new URL(s.url).host;
      const iconFile = SOCIAL_ICON_FILES[s.label];
      const icon = iconFile
        ? `<img class="os-about-social-icon" src="${esc(url('/assets/images/icons/' + iconFile))}" width="16" height="16" alt="">`
        : '<span></span>';
      a.innerHTML = `${icon}<span class="os-contact-social-label">${esc(s.label)} ↗</span><span class="os-contact-social-host">${esc(host)}</span>`;
      social.appendChild(a);
    }
    frag.appendChild(contact);

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
        logo.addEventListener('error', () => logo.remove(), { once: true });
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

      // Description paragraph
      if (ed.desc) {
        const desc = document.createElement('p');
        desc.className = 'os-edu-desc';
        desc.textContent = ed.desc;
        card.appendChild(desc);
      }

      // Skills/coursework/achievements as tags
      const items = ed.tags || ed.notes || [];
      if (items.length) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'os-edu-tags';
        for (const item of items) {
          const tag = document.createElement('span');
          tag.className = 'os-edu-tag';
          tag.textContent = item;
          tagsContainer.appendChild(tag);
        }
        card.appendChild(tagsContainer);
      }

      frag.appendChild(card);
    }
    return frag;
  }

  function show(tab) {
    store.set({ aboutTab: tab });
    panels.innerHTML = '';
    panels.appendChild(tab === 'education' ? educationPanel() : profilePanel());
    if (titlebar) {
      titlebar.querySelectorAll('.os-tab-btn').forEach((b) => {
        b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false');
      });
    }
  }

  if (titlebar) {
    titlebar.addEventListener('click', (e) => {
      const b = e.target.closest('.os-tab-btn');
      if (b) show(b.dataset.tab);
    });
  }

  show(store.get().aboutTab || 'profile');

  // { tab, section } — section 'contact' scrolls Profile to the contact block
  // (terminal `contact`, `open contact`, #/contact).
  const onTab = (e) => {
    const t = e.detail && e.detail.tab;
    if (!t) return;
    show(t);
    if (e.detail.section === 'contact') {
      const sec = panels.querySelector('.os-about-contact');
      if (sec) sec.scrollIntoView({ block: 'start' });
    }
  };
  document.addEventListener('echoos:set-about-tab', onTab);
  return () => document.removeEventListener('echoos:set-about-tab', onTab);
}

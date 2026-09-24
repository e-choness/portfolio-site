// apps/experience.js — Experience window with two title-bar tabs (same
// pattern as About's Profile / Education):
//   Experience — card-based roles with duration pills (patch 40)
//   Resume     — the typeset resume card (formerly its own Resume app)
// The window's title bar holds the site's single resume download link.
import { writeRoute } from '../router.js';

// Module-scope: the chosen tab survives window re-renders.
const state = { tab: 'experience' };

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

// "Nov. 2025 – May 2026" → one span per end, so narrow screens can break the
// range at the dash instead of squeezing the role column.
export function durationHtml(s) {
  return String(s == null ? '' : s)
    .split(/(?<=\s[–—-])\s+/)
    .map((part) => `<span class="os-dur-part">${esc(part)}</span>`)
    .join(' ');
}

function companyName(fullText) {
  if (!fullText) return '';
  const idx = fullText.indexOf('/');
  return idx > -1 ? fullText.substring(0, idx).trim() : fullText;
}

// "https://www.linkedin.com/in/x/" → "linkedin.com/in/x"
function shortUrl(u) {
  try {
    const x = new URL(u);
    return (x.hostname.replace(/^www\./, '') + x.pathname).replace(/\/$/, '');
  } catch {
    return '';
  }
}

function socialUrl(social, label) {
  const entry = (social || []).find((s) => s.label && s.label.toLowerCase().includes(label));
  return entry ? entry.url : '';
}

// First sentence of a project description ("… framework. A small kernel …").
function firstSentence(s) {
  const text = String(s || '');
  const i = text.indexOf('. ');
  return i > -1 ? text.slice(0, i + 1) : text;
}

// The resume: the single rendering of it. The Resume tab shows it, and
// printing the tab (Ctrl+P, or the build step that writes assets/resume.pdf)
// prints this same card — see printResume() and os/_print.scss.
function resumeHtml(content) {
  const p = content.profile;
  const link = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`;
  const contact = [
    link(`mailto:${p.email}`, p.email),
    esc(p.location),
    p.siteUrl && link(p.siteUrl, shortUrl(p.siteUrl)),
    socialUrl(p.social, 'github') && link(socialUrl(p.social, 'github'), shortUrl(socialUrl(p.social, 'github'))),
    socialUrl(p.social, 'linkedin') && link(socialUrl(p.social, 'linkedin'), shortUrl(socialUrl(p.social, 'linkedin'))),
  ].filter(Boolean).join(' · ');

  const expRows = (content.experience || []).map((exp) => `
      <div class="os-resume-entry">
        <div class="os-resume-item">
          <div class="os-resume-item-left"><span class="os-resume-role">${esc(exp.role)}</span> · <span class="os-resume-company">${esc(companyName(exp.company))}</span></div>
          <div class="os-resume-item-right">${durationHtml(exp.duration)}</div>
        </div>
        ${(exp.bullets || []).length ? `<ul class="os-resume-bullets">${exp.bullets.slice(0, 3).map((b) => `<li>${esc(String(b).replace(/\.$/, ''))}</li>`).join('')}</ul>` : ''}
      </div>`).join('');

  // content.projects is already sorted by `order`
  const projRows = (content.projects || []).filter((pr) => pr.featured).slice(0, 3).map((pr) => `
      <div class="os-resume-entry">
        <div class="os-resume-item">
          <div class="os-resume-item-left"><span class="os-resume-role">${pr.url ? link(pr.url, pr.title) : esc(pr.title)}</span></div>
          ${pr.repo ? `<div class="os-resume-item-right">${link(pr.repo, shortUrl(pr.repo))}</div>` : ''}
        </div>
        <div class="os-resume-proj">${esc(firstSentence(pr.desc))} <span class="os-resume-tech">${esc((pr.tech || []).join(' · '))}</span></div>
      </div>`).join('');

  const eduRows = (content.education || []).map((edu) => `
      <div class="os-resume-item">
        <div class="os-resume-item-left"><span class="os-resume-degree">${esc(edu.degree)}</span> · <span class="os-resume-institution">${esc(edu.school)}${edu.gpa ? ` · GPA ${esc(edu.gpa)}` : ''}</span></div>
        <div class="os-resume-item-right">${durationHtml(edu.duration)}</div>
      </div>`).join('');

  const skillRows = (content.skills || []).map((g) => `
      <span class="os-resume-skillgroup"><b>${esc(g.group)}</b> ${esc((g.items || []).map((s) => s.name).join(', '))}</span>`).join('');

  const summary = (p.about || [])[0];

  return `
    <div class="os-resume-body">
      <div class="os-resume-card">
        <div class="os-resume-name">${esc(p.name)}</div>
        <div class="os-resume-title">${esc(p.title)}</div>
        <div class="os-resume-contact">${contact}</div>
        ${summary ? `<p class="os-resume-summary">${esc(summary)}</p>` : ''}
        <div class="os-resume-section">
          <div class="os-resume-section-head">Experience</div>
          ${expRows}
        </div>
        ${projRows ? `<div class="os-resume-section"><div class="os-resume-section-head">Selected Projects</div>${projRows}</div>` : ''}
        <div class="os-resume-section">
          <div class="os-resume-section-head">Education</div>
          ${eduRows}
        </div>
        ${skillRows ? `<div class="os-resume-section"><div class="os-resume-section-head">Skills</div><div class="os-resume-skills">${skillRows}</div></div>` : ''}
      </div>
    </div>`;
}

// The card lives inside a positioned, clipped window, which print CSS can't
// lift out cleanly. Before printing, copy it into a top-level #os-print host;
// os/_print.scss hides everything else. Only while the Resume tab is showing.
function printResume(bodyEl) {
  const card = bodyEl.querySelector('.os-resume-card');
  if (!card) return;
  document.getElementById('os-print')?.remove();
  const host = document.createElement('div');
  host.id = 'os-print';
  host.appendChild(card.cloneNode(true));
  document.body.appendChild(host);
}

export function renderExperience(bodyEl, { content, titlebar }) {
  const href = content.profile && content.profile.resumeUrl;
  if (titlebar) {
    titlebar.innerHTML = `
      <button type="button" class="os-tab-btn" data-tab="experience" role="tab" aria-selected="true">Experience</button>
      <button type="button" class="os-tab-btn" data-tab="resume" role="tab" aria-selected="false">Resume</button>
      ${href ? `<a class="os-resume-dl" href="${esc(href)}" target="_blank" rel="noopener">download</a>` : ''}`;
    titlebar.addEventListener('click', (e) => {
      const b = e.target.closest('.os-tab-btn');
      if (b) show(b.dataset.tab);
    });
  }

  function show(tab) {
    state.tab = tab === 'resume' ? 'resume' : 'experience';
    if (state.tab === 'resume') bodyEl.innerHTML = resumeHtml(content);
    else renderCards();
    bodyEl.scrollTop = 0;
    if (titlebar) {
      titlebar.querySelectorAll('.os-tab-btn').forEach((b) => {
        b.setAttribute('aria-selected', b.dataset.tab === state.tab ? 'true' : 'false');
      });
    }
    writeRoute('exp', state.tab === 'resume' ? 'resume' : null);
  }

  show(state.tab);

  // Terminal `resume` and the #/exp/resume deep link switch tabs by event.
  const onTab = (e) => { const t = e.detail && e.detail.tab; if (t) show(t); };
  document.addEventListener('echoos:set-exp-tab', onTab);

  const onBeforePrint = () => { if (state.tab === 'resume') printResume(bodyEl); };
  const onAfterPrint = () => document.getElementById('os-print')?.remove();
  window.addEventListener('beforeprint', onBeforePrint);
  window.addEventListener('afterprint', onAfterPrint);

  return () => {
    document.removeEventListener('echoos:set-exp-tab', onTab);
    window.removeEventListener('beforeprint', onBeforePrint);
    window.removeEventListener('afterprint', onAfterPrint);
  };

  function renderCards() {
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
        logo.addEventListener('error', () => logo.remove(), { once: true });
        head.appendChild(logo);
      }

      const meta = document.createElement('div');
      meta.className = 'os-exp-meta';
      const role = document.createElement('h4');
      role.className = 'os-exp-role';
      role.textContent = e.role;
      const company = document.createElement('p');
      company.className = 'os-exp-company';
      company.textContent = e.company;
      meta.append(role, company);
      head.appendChild(meta);

      const pill = document.createElement('div');
      pill.className = 'os-exp-pill';
      pill.innerHTML = durationHtml(e.duration);
      head.appendChild(pill);

      card.appendChild(head);

      // Description
      if (e.desc) {
        const desc = document.createElement('p');
        desc.className = 'os-exp-desc';
        desc.textContent = e.desc;
        card.appendChild(desc);
      }

      // Responsibilities (bullets)
      if ((e.bullets || []).length) {
        const bullets = document.createElement('ul');
        bullets.className = 'os-exp-bullets';
        for (const b of e.bullets) {
          const li = document.createElement('li');
          li.textContent = b;
          bullets.appendChild(li);
        }
        card.appendChild(bullets);
      }

      // Technologies (chips)
      if ((e.tech || []).length) {
        const chipRow = document.createElement('div');
        chipRow.className = 'os-exp-chips';
        for (const t of e.tech) {
          const chip = document.createElement('span');
          chip.className = 'os-exp-chip';
          chip.textContent = String(t).replace(/[\s,;]+$/, '');
          chipRow.appendChild(chip);
        }
        card.appendChild(chipRow);
      }

      container.appendChild(card);
    }

    bodyEl.innerHTML = '';
    bodyEl.appendChild(container);
  }
}

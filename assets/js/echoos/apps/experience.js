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

function extractGitHubPath(social) {
  if (!social) return '';
  const entry = Array.isArray(social)
    ? social.find((s) => s.label && s.label.toLowerCase().includes('github'))
    : null;
  const rawUrl = entry ? entry.url : null;
  if (!rawUrl) return '';
  try {
    const u = new URL(rawUrl);
    return u.hostname + u.pathname;
  } catch {
    return '';
  }
}

function companyName(fullText) {
  if (!fullText) return '';
  const idx = fullText.indexOf('/');
  return idx > -1 ? fullText.substring(0, idx).trim() : fullText;
}

function buildSkillLine(skills) {
  if (!skills || !skills.length) return '';
  return skills
    .map((g) => (g.items || []).map((s) => s.name).join(', '))
    .filter(Boolean)
    .join(' · ');
}

// Typeset resume card (prototype lines 425-446). No PDF embed.
function resumeHtml(content) {
  const p = content.profile;
  const githubPath = extractGitHubPath(p.social);
  const skillLine = buildSkillLine(content.skills || []);

  let expRows = '';
  for (const exp of content.experience || []) {
    expRows += `
      <div class="os-resume-item">
        <div class="os-resume-item-left"><span class="os-resume-role">${esc(exp.role)}</span> · <span class="os-resume-company">${esc(companyName(exp.company))}</span></div>
        <div class="os-resume-item-right">${durationHtml(exp.duration)}</div>
      </div>`;
  }

  let eduRows = '';
  for (const edu of content.education || []) {
    eduRows += `
      <div class="os-resume-item">
        <div class="os-resume-item-left"><span class="os-resume-degree">${esc(edu.degree)}</span> · <span class="os-resume-institution">${esc(edu.school)}</span></div>
        <div class="os-resume-item-right">${durationHtml(edu.duration)}</div>
      </div>`;
  }

  return `
    <div class="os-resume-body">
      <div class="os-resume-card">
        <div class="os-resume-name">${esc(p.name)}</div>
        <div class="os-resume-title">${esc(p.title)}</div>
        <div class="os-resume-contact">${esc(p.email)} · ${esc(p.location)}${githubPath ? ' · ' + esc(githubPath) : ''}</div>
        <div class="os-resume-section">
          <div class="os-resume-section-head">Experience</div>
          ${expRows}
        </div>
        <div class="os-resume-section">
          <div class="os-resume-section-head">Education</div>
          ${eduRows}
        </div>
        ${skillLine ? `<div class="os-resume-section"><div class="os-resume-section-head">Core Skills</div><div class="os-resume-skills">${esc(skillLine)}</div></div>` : ''}
      </div>
    </div>`;
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
  return () => document.removeEventListener('echoos:set-exp-tab', onTab);

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

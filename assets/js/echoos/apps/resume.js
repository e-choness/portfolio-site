// apps/resume.js — typeset card (prototype lines 425-446). No PDF embed.
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
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

export function renderResume(bodyEl, { content, titlebar }) {
  const p = content.profile;
  const href = p.resumeUrl;
  if (!href) return;

  if (titlebar) {
    titlebar.innerHTML = `<a class="os-resume-dl" href="${esc(href)}" target="_blank" rel="noopener">download</a>`;
  }

  const githubPath = extractGitHubPath(p.social);
  const skillLine = buildSkillLine(content.skills || []);

  let expRows = '';
  for (const exp of content.experience || []) {
    expRows += `
      <div class="os-resume-item">
        <div class="os-resume-item-left"><span class="os-resume-role">${esc(exp.role)}</span> · <span class="os-resume-company">${esc(companyName(exp.company))}</span></div>
        <div class="os-resume-item-right">${esc(exp.duration)}</div>
      </div>`;
  }

  let eduRows = '';
  for (const edu of content.education || []) {
    eduRows += `
      <div class="os-resume-item">
        <div class="os-resume-item-left"><span class="os-resume-degree">${esc(edu.degree)}</span> · <span class="os-resume-institution">${esc(edu.school)}</span></div>
        <div class="os-resume-item-right">${esc(edu.duration)}</div>
      </div>`;
  }

  bodyEl.innerHTML = `
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

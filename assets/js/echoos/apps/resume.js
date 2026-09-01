// apps/resume.js — PDF embed with typeset fallback (prototype chrome + real PDF).
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function findGitHubUrl(social) {
  if (!social) return null;
  return social.github || null;
}

function extractGitHubPath(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    return u.hostname + u.pathname;
  } catch {
    return '';
  }
}

function buildSkillLine(skills) {
  // Group skills by category, join names within group with ', ' and groups with ' · '
  if (!skills || !skills.categories) return '';
  return skills.categories
    .map((cat) => cat.skills.map((s) => s.name).join(', '))
    .join(' · ');
}

export function renderResume(bodyEl, { content, titlebar }) {
  const p = content.profile;
  const href = p.resumeUrl;
  if (!href) return;

  // Extract just the company name (text before first "/")
  function companyName(fullText) {
    if (!fullText) return '';
    const idx = fullText.indexOf('/');
    return idx > -1 ? fullText.substring(0, idx).trim() : fullText;
  }

  // Title-bar download button (Patch 32 titlebar element)
  if (titlebar) {
    titlebar.innerHTML = `<a class="os-resume-dl" href="${esc(href)}" target="_blank" rel="noopener">download</a>`;
  }

  // Body: object with PDF, fallback card for browsers that don't embed PDFs
  const skillLine = buildSkillLine(content.skills);
  const githubPath = extractGitHubPath(findGitHubUrl(p.social));

  let fallbackHTML = `
    <div class="os-resume-fallback">
      <div class="os-resume-name">${esc(p.name)}</div>
      <div class="os-resume-title">${esc(p.title)}</div>
      <div class="os-resume-contact">${esc(p.email)} · ${esc(p.location)}${githubPath ? ' · ' + esc(githubPath) : ''}</div>`;

  // Experience section
  if (content.experience && content.experience.length > 0) {
    fallbackHTML += `<div class="os-resume-section">
      <div class="os-resume-section-head">Experience</div>
      <div class="os-resume-items">`;
    for (const exp of content.experience) {
      const company = companyName(exp.company);
      fallbackHTML += `<div class="os-resume-row">
        <div class="os-resume-item-left"><span class="os-resume-role">${esc(exp.position)}</span> · <span class="os-resume-company">${esc(company)}</span></div>
        <div class="os-resume-item-right">${esc(exp.duration)}</div>
      </div>`;
    }
    fallbackHTML += `</div></div>`;
  }

  // Education section
  if (content.education && content.education.length > 0) {
    fallbackHTML += `<div class="os-resume-section">
      <div class="os-resume-section-head">Education</div>
      <div class="os-resume-items">`;
    for (const edu of content.education) {
      fallbackHTML += `<div class="os-resume-row">
        <div class="os-resume-item-left"><span class="os-resume-degree">${esc(edu.degree)}</span> · <span class="os-resume-institution">${esc(edu.institution)}</span></div>
        <div class="os-resume-item-right">${esc(edu.duration)}</div>
      </div>`;
    }
    fallbackHTML += `</div></div>`;
  }

  // Core Skills section
  if (skillLine) {
    fallbackHTML += `<div class="os-resume-section">
      <div class="os-resume-section-head">Core Skills</div>
      <div class="os-resume-skills">${esc(skillLine)}</div>
    </div>`;
  }

  fallbackHTML += `</div>`;

  bodyEl.innerHTML = `
    <object class="os-resume-doc" data="${esc(href)}" type="application/pdf">
      ${fallbackHTML}
    </object>`;
}

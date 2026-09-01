// apps/resume.js — iframe of profile.resumeUrl + open/download buttons (§6.5).
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

export function renderResume(bodyEl, { content }) {
  const href = content.profile.resumeUrl;
  if (!href) return;

  bodyEl.innerHTML = `
    <div class="os-resume">
      <div class="os-resume-actions">
        <a class="os-btn" href="${esc(href)}" target="_blank" rel="noopener noreferrer">Open in new tab</a>
        <a class="os-btn" href="${esc(href)}" download>Download</a>
      </div>
      <iframe class="os-resume-frame" src="${esc(href)}" title="Resume" loading="lazy"></iframe>
    </div>`;
}

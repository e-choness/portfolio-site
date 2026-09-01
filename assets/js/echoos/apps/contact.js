// apps/contact.js — contact page (prototype parity).
// Eyebrow, blurb, email link, 2-col social grid (1-col on mobile).
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

export function renderContact(bodyEl, { content }) {
  const p = content.profile;

  bodyEl.innerHTML = `
    <div class="os-contact-eyebrow">say hello</div>
    <div class="os-contact-blurb">I'm always interested in new opportunities and exciting projects. Let's discuss how we can work together.</div>
    <a href="mailto:${esc(p.email)}" class="os-contact-email">${esc(p.email)}</a>
    <div class="os-contact-social"></div>`;

  const social = bodyEl.querySelector('.os-contact-social');
  for (const s of p.social || []) {
    if (s.url.startsWith('mailto:')) continue;
    const a = document.createElement('a');
    a.href = s.url;
    a.textContent = `${s.label} ↗`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'os-contact-social-link';
    social.appendChild(a);
  }
}

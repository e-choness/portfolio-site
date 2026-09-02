// apps/contact.js — contact page (prototype parity).
// Identity block, eyebrow, blurb, availability strip, 2-col social tiles (1-col on mobile).
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

export function renderContact(bodyEl, { content }) {
  const p = content.profile;

  bodyEl.innerHTML = `
    <div class="os-contact">
      <div class="os-contact-id">
        <div class="os-contact-id-header">
          <span class="os-contact-dot"></span>
          <span class="os-contact-name">${esc(p.name)}</span>
        </div>
        <div class="os-contact-title-label">${esc(p.title)}</div>
      </div>
      <div class="os-contact-eyebrow">say hello</div>
      <div class="os-contact-blurb">I'm always interested in new opportunities and exciting projects. Let's discuss how we can work together.</div>
      <div class="os-contact-strip">
        <span class="os-contact-strip-dot"></span>
        <span class="os-contact-strip-text">${esc(p.location)}</span>
      </div>
      <div class="os-contact-social"></div>
    </div>`;

  const social = bodyEl.querySelector('.os-contact-social');
  for (const s of p.social || []) {
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'os-contact-social-link';
    const host = s.url.startsWith('mailto:') ? s.url.slice(7) : new URL(s.url).host;
    a.innerHTML = `<span class="os-contact-social-label">${esc(s.label)} ↗</span><span class="os-contact-social-host">${esc(host)}</span>`;
    social.appendChild(a);
  }
}

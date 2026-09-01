// apps/contact.js — mailto primary + social list + copy-email (§6.5).
// No form — there is no backend.
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

export function renderContact(bodyEl, { content, toast }) {
  const p = content.profile;

  bodyEl.innerHTML = `
    <div class="os-contact">
      <a class="os-contact-primary" href="mailto:${esc(p.email)}">Email me</a>
      <button type="button" class="os-contact-copy">Copy email</button>
      <ul class="os-contact-social"></ul>
    </div>`;

  const social = bodyEl.querySelector('.os-contact-social');
  for (const s of p.social || []) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.textContent = s.label;
    if (!s.url.startsWith('mailto:')) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    li.appendChild(a);
    social.appendChild(li);
  }

  bodyEl.querySelector('.os-contact-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(p.email);
      if (toast) toast('Email copied to clipboard');
    } catch {
      if (toast) toast('Copy failed — select the address manually');
    }
  });
}

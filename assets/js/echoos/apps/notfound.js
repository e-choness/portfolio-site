// apps/notfound.js — the 404 window. GitHub Pages serves 404.html (the OS
// layout with data-notfound) for any unknown path; boot.js opens this window
// instead of About and passes the path that didn't resolve.
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

export function renderNotFound(bodyEl, { path, wm, openSpotlight }) {
  bodyEl.innerHTML = `
    <div class="os-nf">
      <div class="os-nf-code">404</div>
      <h2 class="os-nf-title">That window doesn't exist.</h2>
      <p class="os-nf-text">Nothing lives at <code>${esc(path || '/')}</code>. It may have moved when this site became EchoOS; everything is still here on the desktop.</p>
      <div class="os-nf-actions">
        <button type="button" class="os-nf-btn os-nf-primary" data-open="proj">Open Projects</button>
        <button type="button" class="os-nf-btn" data-open="blog">Open Blog</button>
        <button type="button" class="os-nf-btn" data-search>Search ⌘K</button>
      </div>
    </div>`;

  bodyEl.addEventListener('click', (e) => {
    const b = e.target.closest('.os-nf-btn');
    if (!b) return;
    if (b.dataset.search !== undefined) {
      openSpotlight();
      return;
    }
    wm.closeApp('notfound');
    wm.openApp(b.dataset.open);
  });
}

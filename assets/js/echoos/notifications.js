// notifications.js — toast + notification panel (§6.1).
export function initNotifications(root, { portrait = '', stats = [], onTour } = {}) {
  const toasts = document.createElement('div');
  toasts.className = 'os-toasts';
  toasts.setAttribute('aria-live', 'polite');
  root.appendChild(toasts);

  // Notification center — date header, stats grid, welcome card, tour button
  // (EchoOS.dc.html lines 527-551). No message list in the prototype.
  const panel = document.createElement('aside');
  panel.className = 'os-notif';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="os-notif-day"></div>
    <div class="os-notif-date"></div>
    <div class="os-notif-stats"></div>
    <div class="os-notif-welcome">
      <img class="os-notif-welcome-img" src="${portrait}" alt="">
      <div>
        <div class="os-notif-welcome-title">Welcome to EchoOS</div>
        <div class="os-notif-welcome-text">A different way to explore Echo Yin's professional profile.</div>
      </div>
    </div>
    <button type="button" class="os-notif-tour">Take the guided tour</button>`;
  root.appendChild(panel);

  function renderPanel() {
    const d = new Date();
    panel.querySelector('.os-notif-day').textContent = d.toLocaleDateString('en-US', { weekday: 'long' });
    panel.querySelector('.os-notif-date').textContent = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const statsEl = panel.querySelector('.os-notif-stats');
    statsEl.innerHTML = '';
    for (const st of stats) {
      const cell = document.createElement('div');
      cell.className = 'os-notif-stat';
      cell.innerHTML = `
        <div class="os-notif-stat-val">${st.value}</div>
        <div class="os-notif-stat-label">${st.label}</div>`;
      statsEl.appendChild(cell);
    }
  }
  panel.querySelector('.os-notif-tour').addEventListener('click', () => {
    panel.hidden = true;
    if (onTour) onTour();
  });

  function toast(msg, { kind = 'out' } = {}) {
    const el = document.createElement('div');
    el.className = 'os-toast os-toast-' + kind;
    el.textContent = msg;
    toasts.appendChild(el);
    setTimeout(() => {
      el.classList.add('os-toast-out');
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  let welcomeEl = null;

  // Post-boot welcome card (EchoOS.dc.html lines 553-567): portrait, blurb,
  // "Take the tour" opens the guide, auto-hides after 9s. Shown on every load.
  function welcome() {
    if (welcomeEl) return;
    const el = document.createElement('div');
    el.className = 'os-welcome';
    const portraitImg = portrait
      ? `<img class="os-welcome-portrait" src="${portrait}" alt="">`
      : '';
    el.innerHTML = `
      ${portraitImg}
      <div class="os-welcome-body">
        <div class="os-welcome-title">Welcome to EchoOS</div>
        <div class="os-welcome-text">Every app on this desktop is a section of Echo Yin's portfolio. The Arcade is real.</div>
        <div class="os-welcome-actions">
          <button type="button" class="os-welcome-tour">Take the tour</button>
          <button type="button" class="os-welcome-dismiss">Dismiss</button>
        </div>
      </div>`;
    el.querySelector('.os-welcome-tour').addEventListener('click', () => {
      el.remove();
      welcomeEl = null;
      if (onTour) onTour();
    });
    el.querySelector('.os-welcome-dismiss').addEventListener('click', () => {
      el.remove();
      welcomeEl = null;
    });
    root.appendChild(el);
    welcomeEl = el;
    setTimeout(() => {
      if (welcomeEl) {
        welcomeEl.remove();
        welcomeEl = null;
      }
    }, 9000);
  }

  function togglePanel() {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) renderPanel();
    // Prototype: opening the notification center dismisses the welcome toast.
    if (welcomeEl) {
      welcomeEl.remove();
      welcomeEl = null;
    }
  }

  function closePanel() {
    panel.hidden = true;
  }

  function isOpen() {
    return !panel.hidden;
  }

  // Clicking outside the panel closes it.
  document.addEventListener('pointerdown', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !e.target.closest('.os-mb-notif')) {
      closePanel();
    }
  });

  return { toast, welcome, togglePanel, closePanel, isOpen };
}

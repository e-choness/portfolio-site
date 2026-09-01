// notifications.js — toast + notification panel (§6.1).
export function initNotifications(root, { portrait = '', onTour } = {}) {
  const toasts = document.createElement('div');
  toasts.className = 'os-toasts';
  toasts.setAttribute('aria-live', 'polite');
  root.appendChild(toasts);

  const panel = document.createElement('aside');
  panel.className = 'os-notif';
  panel.hidden = true;
  panel.innerHTML = `
    <h3 class="os-notif-title">Notifications</h3>
    <ul class="os-notif-list"></ul>`;
  root.appendChild(panel);

  function toast(msg, { kind = 'out' } = {}) {
    const el = document.createElement('div');
    el.className = 'os-toast os-toast-' + kind;
    el.textContent = msg;
    toasts.appendChild(el);
    const li = document.createElement('li');
    li.textContent = msg;
    panel.querySelector('.os-notif-list').prepend(li);
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

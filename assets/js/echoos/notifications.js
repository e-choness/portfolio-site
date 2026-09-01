// notifications.js — toast + notification panel (§6.1).
export function initNotifications(root) {
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

  function togglePanel() {
    panel.hidden = !panel.hidden;
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

  return { toast, togglePanel, closePanel, isOpen };
}

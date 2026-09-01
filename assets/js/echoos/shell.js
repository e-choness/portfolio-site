// shell.js — menu bar, clock, dock, desktop icons, mobile home grid (§6.1).
import { store } from './store.js';

export function initShell(root, { apps, wm, notifications, onSpotlight }) {
  const MENU = document.createElement('header');
  MENU.className = 'os-menubar';
  MENU.innerHTML = `
    <div class="os-mb-left">
      <span class="os-mb-logo"></span>
      <span class="os-mb-brand">EchoOS</span>
      <span class="os-mb-app"></span>
    </div>
    <div class="os-mb-right">
      <button type="button" class="os-mb-btn os-mb-spotlight" aria-label="Spotlight">⌘K</button>
      <button type="button" class="os-mb-btn os-mb-sound" aria-label="Toggle sound">♪ on</button>
      <button type="button" class="os-mb-btn os-mb-theme" aria-label="Toggle theme"></button>
      <button type="button" class="os-mb-btn os-mb-notif" aria-label="Notifications">▤</button>
      <span class="os-mb-clock" aria-label="Clock"></span>
    </div>`;
  root.appendChild(MENU);

  const mbApp = MENU.querySelector('.os-mb-app');
  const mbTheme = MENU.querySelector('.os-mb-theme');
  const mbSound = MENU.querySelector('.os-mb-sound');
  const mbClock = MENU.querySelector('.os-mb-clock');

  function labelFor(id) {
    const app = apps.find((a) => a.id === id);
    return app ? app.title : '';
  }

  function setFocusedApp(id) {
    mbApp.textContent = id ? labelFor(id) : '';
  }

  MENU.querySelector('.os-mb-spotlight').addEventListener('click', () => onSpotlight && onSpotlight());
  MENU.querySelector('.os-mb-notif').addEventListener('click', () => notifications && notifications.togglePanel());

  // --- theme --------------------------------------------------------------
  function applyTheme(theme) {
    document.documentElement.dataset.echoTheme = theme;
    mbTheme.textContent = theme === 'dark' ? '☀' : '☾';
  }
  mbTheme.addEventListener('click', () => {
    store.set({ theme: store.get().theme === 'dark' ? 'light' : 'dark' });
  });

  // --- sound --------------------------------------------------------------
  function applySound(sound) {
    mbSound.textContent = sound === 'on' ? '♪ on' : '♪ off';
  }
  mbSound.addEventListener('click', () => {
    store.set({ sound: store.get().sound === 'on' ? 'off' : 'on' });
  });

  // --- clock --------------------------------------------------------------
  function tick() {
    const now = new Date();
    const day = now.toLocaleDateString([], { weekday: 'short' });
    const date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    mbClock.textContent = `${day}, ${date} · ${time}`;
  }
  tick();
  const clockTimer = setInterval(tick, 20000);

  // --- accent override ----------------------------------------------------
  function applyAccent(accent) {
    const r = document.documentElement;
    if (accent) r.style.setProperty('--accent', accent);
    else r.style.removeProperty('--accent');
  }

  const applyAll = (s) => {
    applyTheme(s.theme);
    applySound(s.sound);
    applyAccent(s.accent);
  };
  store.subscribe(applyAll);
  applyAll(store.get());

  // --- dock ---------------------------------------------------------------
  const dock = document.createElement('nav');
  dock.className = 'os-dock';
  dock.setAttribute('aria-label', 'Dock');
  for (const app of apps) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'os-dock-item';
    btn.dataset.app = app.id;
    btn.setAttribute('aria-label', `Open ${app.label}`);
    btn.innerHTML = `<span class="os-glyph">${app.glyph}</span><span class="os-dock-label">${app.label}</span>`;
    btn.addEventListener('click', () => wm && wm.toggleApp(app.id));
    dock.appendChild(btn);
  }
  root.appendChild(dock);

  // --- desktop icons ------------------------------------------------------
  const desktop = document.createElement('div');
  desktop.className = 'os-desktop';
  desktop.setAttribute('aria-label', 'Desktop');
  for (const app of apps) {
    if (!app.desktop_icon) continue;
    const icon = document.createElement('button');
    icon.type = 'button';
    icon.className = 'os-desk-icon';
    icon.dataset.app = app.id;
    icon.setAttribute('aria-label', `Open ${app.label}`);
    icon.innerHTML = `<span class="os-desk-icon-tile"><span class="os-glyph">${app.glyph}</span></span><span class="os-desk-icon-label">${app.label}</span>`;
    icon.addEventListener('click', () => wm && wm.openApp(app.id));
    desktop.appendChild(icon);
  }
  root.appendChild(desktop);

  // --- mobile tab bar (bottom 64px, apps flagged tab_bar in apps.yml) ------
  const tabbar = document.createElement('nav');
  tabbar.className = 'os-tabbar';
  tabbar.setAttribute('aria-label', 'Tab bar');
  for (const app of apps) {
    if (!app.tab_bar) continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'os-tabbar-item';
    btn.dataset.app = app.id;
    btn.setAttribute('aria-label', `Open ${app.label}`);
    btn.innerHTML = `<span class="os-glyph">${app.glyph}</span><span class="os-tabbar-label">${app.label}</span>`;
    btn.addEventListener('click', () => wm && wm.openApp(app.id));
    tabbar.appendChild(btn);
  }
  root.appendChild(tabbar);

  // --- mobile home grid ---------------------------------------------------
  const home = document.createElement('div');
  home.className = 'os-home';
  home.setAttribute('aria-label', 'Apps');
  for (const app of apps) {
    const icon = document.createElement('button');
    icon.type = 'button';
    icon.className = 'os-home-item';
    icon.dataset.app = app.id;
    icon.setAttribute('aria-label', `Open ${app.label}`);
    icon.innerHTML = `<span class="os-glyph">${app.glyph}</span><span class="os-home-label">${app.label}</span>`;
    icon.addEventListener('click', () => wm && wm.openApp(app.id));
    home.appendChild(icon);
  }
  root.appendChild(home);

  return {
    setFocusedApp,
    destroy() {
      clearInterval(clockTimer);
      MENU.remove();
      dock.remove();
      desktop.remove();
      tabbar.remove();
      home.remove();
    },
  };
}

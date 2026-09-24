// shell.js — menu bar, clock, dock, desktop icons, mobile home grid (§6.1).
import { store } from './store.js';

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

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
      <button type="button" class="os-mb-btn os-mb-sound" aria-label="Toggle sound">♪</button>
      <button type="button" class="os-mb-btn os-mb-theme" aria-label="Toggle theme"></button>
      <button type="button" class="os-mb-btn os-mb-notif" aria-label="Notifications">▤</button>
      <span class="os-mb-clock" aria-label="Clock"></span>
    </div>`;
  root.appendChild(MENU);

  // Under 760px the spotlight button shows ⌕ — ⌘K means nothing on a phone.
  const mbSpot = MENU.querySelector('.os-mb-spotlight');
  const MOBILE = window.matchMedia('(max-width: 760px)');
  const applySpotLabel = () => { mbSpot.textContent = MOBILE.matches ? '⌕' : '⌘K'; };
  applySpotLabel();
  MOBILE.addEventListener('change', applySpotLabel);

  const mbApp = MENU.querySelector('.os-mb-app');
  const mbTheme = MENU.querySelector('.os-mb-theme');
  const mbSound = MENU.querySelector('.os-mb-sound');
  const mbClock = MENU.querySelector('.os-mb-clock');

  // The window title bar already shows the full title; the menubar names the app.
  function labelFor(id) {
    const app = apps.find((a) => a.id === id);
    return app ? app.label : '';
  }

  function setFocusedApp(id) {
    mbApp.textContent = id ? labelFor(id) : '';
    for (const btn of tabbar.querySelectorAll('.os-tabbar-item[data-app]')) {
      btn.classList.toggle('is-active', btn.dataset.app === id);
    }
  }

  MENU.querySelector('.os-mb-spotlight').addEventListener('click', () => onSpotlight && onSpotlight());
  const mbNotif = MENU.querySelector('.os-mb-notif');
  mbNotif.setAttribute('aria-pressed', 'false');
  mbNotif.addEventListener('click', () => notifications && notifications.togglePanel());
  const offNotif = notifications && notifications.onChange
    ? notifications.onChange((open) => mbNotif.setAttribute('aria-pressed', String(open)))
    : null;

  // --- theme --------------------------------------------------------------
  function applyTheme(theme) {
    const changed = document.documentElement.dataset.echoTheme !== theme;
    document.documentElement.dataset.echoTheme = theme;
    mbTheme.textContent = theme === 'dark' ? '☀' : '☾';
    if (changed) refreshGlass();
  }

  // iOS Safari keeps painting backdrop-filter layers with the old theme until
  // the next touch. Dropping the blur for one frame forces those layers to be
  // rebuilt with the new colours.
  function refreshGlass() {
    const els = root.querySelectorAll('.os-menubar, .os-dock, .os-tabbar, .os-notif, .os-welcome, .os-toast, .os-win-bar');
    for (const el of els) {
      el.style.webkitBackdropFilter = 'none';
      el.style.backdropFilter = 'none';
    }
    void root.offsetHeight; // flush style so the removal is applied
    requestAnimationFrame(() => {
      for (const el of els) {
        el.style.webkitBackdropFilter = '';
        el.style.backdropFilter = '';
      }
    });
  }
  mbTheme.addEventListener('click', () => {
    store.set({ theme: store.get().theme === 'dark' ? 'light' : 'dark' });
  });

  // --- sound --------------------------------------------------------------
  function applySound(sound) {
    mbSound.setAttribute('aria-pressed', String(sound === 'on'));
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
    // Separate spans so the mobile bar can stack date over time instead of
    // letting one long line shove the buttons into the brand.
    mbClock.innerHTML = `<span class="os-mb-date">${day}, ${date}</span><span class="os-mb-sep"> · </span><span class="os-mb-time">${time}</span>`;
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

  // System apps (e.g. the 404 window) are opened by the OS itself, never from
  // a launcher, so the dock, desktop, tab bar and home grid skip them.
  const launchers = apps.filter((a) => !a.system);

  // --- dock ---------------------------------------------------------------
  const dock = document.createElement('nav');
  dock.className = 'os-dock';
  dock.setAttribute('aria-label', 'Dock');
  for (const app of launchers) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'os-dock-item';
    btn.dataset.app = app.id;
    btn.setAttribute('aria-label', `Open ${app.label}`);
    btn.innerHTML = `<span class="os-dock-tile"><span class="os-glyph">${app.glyph}</span></span><span class="os-dock-dot"></span><span class="os-dock-label" aria-hidden="true">${esc(app.label)}</span>`;
    btn.addEventListener('click', () => wm && wm.toggleApp(app.id));
    dock.appendChild(btn);
  }
  root.appendChild(dock);

  // --- desktop icons (sorted by desktop_icon_order) --------------------------
  const desktop = document.createElement('div');
  desktop.className = 'os-desktop';
  desktop.setAttribute('aria-label', 'Desktop');
  const desktopApps = launchers
    .filter((a) => a.desktop_icon)
    .sort((a, b) => (a.desktop_icon_order || 0) - (b.desktop_icon_order || 0));
  for (const app of desktopApps) {
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
  // Home: close every open sheet so it always lands on the grid.
  const homeBtn = document.createElement('button');
  homeBtn.type = 'button';
  homeBtn.className = 'os-tabbar-item os-tabbar-home';
  homeBtn.setAttribute('aria-label', 'Home');
  homeBtn.innerHTML = '<span class="os-tabbar-tile"><span class="os-glyph">⌂</span></span><span class="os-tabbar-label">Home</span>';
  homeBtn.addEventListener('click', () => {
    if (!wm) return;
    for (const app of apps) if (wm.isOpen(app.id)) wm.closeApp(app.id);
  });
  tabbar.appendChild(homeBtn);
  for (const app of launchers) {
    if (!app.tab_bar) continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'os-tabbar-item';
    btn.dataset.app = app.id;
    btn.setAttribute('aria-label', `Open ${app.label}`);
    btn.innerHTML = `<span class="os-tabbar-tile"><span class="os-glyph">${app.glyph}</span></span><span class="os-tabbar-label">${app.label}</span>`;
    btn.addEventListener('click', () => wm && wm.openApp(app.id));
    tabbar.appendChild(btn);
  }
  root.appendChild(tabbar);

  // --- mobile home grid ---------------------------------------------------
  const home = document.createElement('div');
  home.className = 'os-home';
  home.setAttribute('aria-label', 'Apps');
  for (const app of launchers) {
    const icon = document.createElement('button');
    icon.type = 'button';
    icon.className = 'os-home-item';
    icon.dataset.app = app.id;
    icon.setAttribute('aria-label', `Open ${app.label}`);
    icon.innerHTML = `<span class="os-home-tile"><span class="os-glyph">${app.glyph}</span></span><span class="os-home-label">${app.label}</span>`;
    icon.addEventListener('click', () => wm && wm.openApp(app.id));
    home.appendChild(icon);
  }
  root.appendChild(home);

  function setOpenApps(idsSet, minSet = new Set()) {
    for (const btn of dock.querySelectorAll('.os-dock-item')) {
      const appId = btn.dataset.app;
      btn.classList.toggle('is-open', idsSet.has(appId));
      btn.classList.toggle('is-min', minSet.has(appId));
    }
  }

  return {
    setFocusedApp,
    setOpenApps,
    destroy() {
      clearInterval(clockTimer);
      MOBILE.removeEventListener('change', applySpotLabel);
      if (offNotif) offNotif();
      MENU.remove();
      dock.remove();
      desktop.remove();
      tabbar.remove();
      home.remove();
    },
  };
}

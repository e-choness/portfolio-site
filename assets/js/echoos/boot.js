// boot.js — entry point for the OS route (§6.1).
// Loaded as <script type="module"> after games.js. Reads #echoos-root, plays
// the boot animation (shortened on repeat visits), loads content.json, then
// wires wallpaper, window manager, shell, spotlight and the app renderers.
import { store } from './store.js';
import { beep } from './sound.js';
import { initWallpaper } from './wallpaper.js';
import { initNotifications } from './notifications.js';
import { initSpotlight } from './spotlight.js';
import { createWM } from './wm.js';
import { initShell } from './shell.js';
import { createTerminal } from './terminal.js';
import { renderGuide } from './guide.js';
import { renderAbout } from './apps/about.js';
import { renderExperience } from './apps/experience.js';
import { renderProjects } from './apps/projects.js';
import { renderSkills } from './apps/skills.js';
import { renderStats } from './apps/stats.js';
import { initTicker } from './ticker.js';
import { renderBlog } from './apps/blog.js';
import { renderArcade } from './apps/arcade.js';
import { renderNotFound } from './apps/notfound.js';
import { readRoute, writeRoute, onItemChange } from './router.js';
import { trackView, trackEvent } from './analytics.js';

const root = document.getElementById('echoos-root');
if (!root) throw new Error('EchoOS: #echoos-root not found');

// Apply persisted appearance before first paint of the OS.
const initial = store.get();
if (initial.theme) document.documentElement.dataset.echoTheme = initial.theme;
if (initial.accent) document.documentElement.style.setProperty('--accent', initial.accent);

const firstVisit = !store.get().visited;
store.set({ visited: true });

const boot = document.createElement('div');
boot.className = 'os-boot';
boot.innerHTML = `
  <div class="os-boot-mark">
    <span class="os-boot-square"></span>
    <span class="os-boot-word">EchoOS</span>
    <span class="os-boot-caret"></span>
  </div>
  <div class="os-boot-track"><div class="os-boot-fill"></div></div>
  <div class="os-boot-text">booting portfolio environment — click to skip</div>`;
root.appendChild(boot);

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let bootResolved = false;

function finishBoot() {
  if (bootResolved) return;
  bootResolved = true;
  boot.classList.add('os-boot-done');
  setTimeout(() => boot.remove(), 300);
}

boot.addEventListener('click', finishBoot);

async function main() {
  // Kick off the content fetch in parallel with the boot animation.
  const contentPromise = fetch(root.dataset.content)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  const content = await contentPromise;

  // 404.html is this same layout with data-notfound: remember the path that
  // didn't resolve, then show the desktop's real address so deep links and
  // reloads from here work.
  let missing = null;
  if (root.dataset.notfound) {
    const base = root.dataset.base || '';
    missing = location.pathname.slice(base.length) + location.search;
    history.replaceState(null, '', `${base}/`);
  }

  // A deep link skips the splash entirely (Patch 81).
  const route = missing ? null : resolveRoute(readRoute(true), content);
  const bootDur = route || missing ? 0 : firstVisit ? 1150 : 350; // echoos-visited skips the long boot
  await Promise.all([contentPromise, delay(bootDur)]);

  finishBoot();

  initOS(content || {}, route, missing);
}

// A route counts only if it names a known app — and, for blog/proj, a known
// item. Anything else is ignored silently (normal boot). Arcade ids live in
// arcade.js (Liquid-inlined), not content.json: an unknown id leaves the grid.
function resolveRoute(r, content) {
  if (!r || !content) return null;
  // Old one-page anchors (#about, #experience, …) from links shared before EchoOS.
  const legacy = { home: null, experience: 'exp', projects: 'proj', education: 'about' };
  if (r.app in legacy) {
    if (!legacy[r.app]) return null;
    r = { app: legacy[r.app], item: r.app === 'education' ? 'education' : r.item };
  }
  // The Resume app became a tab of Experience; keep old #/resume links working.
  if (r.app === 'resume') r = { app: 'exp', item: 'resume' };
  // Contact became a section of About → Profile.
  if (r.app === 'contact') r = { app: 'about', item: 'contact' };
  if (!(content.apps || []).some((a) => a.id === r.app && !a.system)) return null;
  if (r.item) {
    if (r.app === 'blog' && !(content.posts || []).some((p) => p.slug === r.item)) return null;
    if (r.app === 'proj' && !(content.projects || []).some((p) => p.slug === r.item)) return null;
    if (r.app === 'exp' && r.item !== 'resume') return null;
    if (r.app === 'about' && r.item !== 'contact' && r.item !== 'education') return null;
  }
  return r;
}

const ITEM_EVENTS = {
  blog: (item) => ['echoos:open-post', { slug: item }],
  proj: (item) => ['echoos:open-project', { slug: item }],
  arcade: (item) => ['echoos:open-game', { id: item }],
  exp: (item) => ['echoos:set-exp-tab', { tab: item }],
  about: (item) => ['echoos:set-about-tab', item === 'education' ? { tab: 'education' } : { tab: 'profile', section: 'contact' }],
};

function initOS(content, route = null, missing = null) {
  const apps = content.apps || [];
  // System apps (the 404 window) never appear in Spotlight or the terminal.
  const launchable = apps.filter((a) => !a.system);

  // Visit counting (analytics.js): one view per load, then one per post or
  // project opened, one event per game started or resume shown.
  const openedApps = new Set();
  trackView(missing !== null ? '/404' : '/', missing !== null ? missing : 'Desktop');
  const titleOf = (list, slug) => ((list || []).find((x) => x.slug === slug) || {}).title;
  onItemChange((app, item) => {
    if (app === 'blog') trackView(`/blog/${item}`, titleOf(content.posts, item));
    else if (app === 'proj') trackView(`/projects/${item}`, titleOf(content.projects, item));
    else if (app === 'arcade') trackEvent(`game:${item}`);
    else if (app === 'exp' && item === 'resume') trackEvent('resume:view');
  });

  const notifications = initNotifications(root, {
    portrait: content.profile && content.profile.portrait,
    stats: (content.profile && content.profile.stats) || [],
    onTour: () => wm.openApp('guide'),
  });
  const shellRef = { current: null };
  let term = null;
  let spotlight = null;

  const wm = createWM(root, {
    apps,
    content,
    store,
    notifications,
    toast: (msg, opts) => notifications.toast(msg, opts),
    getSpotlight: () => spotlight,
    onFocus: (id) => {
      // System apps (the 404 window) get no address; the URL stays at the desktop.
      writeRoute(launchable.some((a) => a.id === id) ? id : null);
      if (shellRef.current) shellRef.current.setFocusedApp(id);
      if (id === 'term' && term) term.focusInput();
    },
    onWindowsChanged: (openIds, minIds) => {
      if (shellRef.current) shellRef.current.setOpenApps(openIds, minIds);
      // Count each window as it opens (not on focus changes or re-renders).
      for (const id of openIds) {
        if (!openedApps.has(id) && launchable.some((a) => a.id === id)) trackEvent(`app:${id}`);
      }
      openedApps.clear();
      for (const id of openIds) openedApps.add(id);
    },
    renderers: {
      about: renderAbout,
      exp: renderExperience,
      proj: renderProjects,
      skills: renderSkills,
      stats: renderStats,
      blog: renderBlog,
      arcade: renderArcade,
      guide: (bodyEl, ctx) => renderGuide(bodyEl, { wm, openSpotlight: () => spotlight.toggle(), content: ctx.content }),
      notfound: (bodyEl) => renderNotFound(bodyEl, { path: missing, wm, openSpotlight: () => spotlight.toggle() }),
      term: (bodyEl, ctx) => {
        if (!term) term = createTerminal(content, wm, { apps: launchable });
        term.mount(bodyEl);
      },
    },
  });

  // Wallpaper after wm: the reduced-motion static frame renders synchronously
  // and queries wm.isAnyOpen() for the calm factor — wm must exist first.
  const wallpaper = initWallpaper(root, { isAnyOpen: () => wm.isAnyOpen() });

  spotlight = initSpotlight(root, {
    apps: launchable,
    content,
    wm,
    store,
    onOpenResult: (it) => {
      if (it.kind === 'project') wm.openApp('proj');
      else if (it.kind === 'post') {
        wm.openApp('blog');
        // The blog window renders synchronously on openApp; tell it which
        // post to open via a document-level event (a CustomEvent fired on
        // `root` never reaches the window's body, which is a descendant).
        document.dispatchEvent(new CustomEvent('echoos:open-post', { detail: { slug: it.id } }));
      }
    },
  });

  const shell = initShell(root, {
    apps,
    wm,
    notifications,
    onSpotlight: () => spotlight.toggle(),
  });
  shellRef.current = shell;

  // Desktop telemetry panel under the desktop icons; opens the Stats app.
  initTicker(root, { content, onOpen: () => wm.openApp('stats') });

  function openRoute(r) {
    wm.openApp(r.app);
    const ev = r.item && ITEM_EVENTS[r.app] && ITEM_EVENTS[r.app](r.item);
    if (ev) document.dispatchEvent(new CustomEvent(ev[0], { detail: ev[1] }));
  }

  // Posts and projects still have their own URLs (/blog/…/slug/, /projects/slug/),
  // but those are only redirect stubs now. Links to them inside the OS (chapter
  // links in posts, project write-ups, the resume) open the item in its window
  // instead of loading the stub. Modified clicks (new tab etc.) are left alone.
  // The resume download counts however it's clicked (including new-tab clicks).
  const onResumeDownload = (e) => {
    if (e.target.closest('.os-resume-dl')) trackEvent('resume:download');
  };
  root.addEventListener('click', onResumeDownload);
  root.addEventListener('auxclick', onResumeDownload);

  const inApp = new Map();
  for (const p of content.posts || []) if (p.url) inApp.set(p.url, { app: 'blog', item: p.slug });
  for (const p of content.projects || []) if (p.url) inApp.set(p.url, { app: 'proj', item: p.slug });
  root.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a) return;
    let u;
    try { u = new URL(a.href, location.href); } catch { return; }
    if (u.origin !== location.origin) return;
    const path = u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`;
    const r = inApp.get(path);
    if (!r) return;
    e.preventDefault();
    openRoute(r);
  });

  // about opens on boot (§6.4) — unless a deep link names another window, or
  // this is the 404 page.
  if (missing !== null) wm.openApp('notfound');
  else if (route) openRoute(route);
  else wm.openApp('about');

  // Pasted links in an already-open tab.
  window.addEventListener('hashchange', () => {
    const r = resolveRoute(readRoute(), content);
    if (r) openRoute(r);
  });

  // Post-boot welcome toast (prototype finishBoot): two-tone chirp + 9s auto-hide.
  // Not on the 404 page, where it would cover the error window.
  if (missing !== null) return;
  beep(660, 0.08);
  setTimeout(() => beep(880, 0.1), 110);
  notifications.welcome();
}

main();

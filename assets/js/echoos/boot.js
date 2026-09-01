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
import { renderBlog } from './apps/blog.js';
import { renderContact } from './apps/contact.js';
import { renderResume } from './apps/resume.js';
import { renderArcade } from './apps/arcade.js';

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
boot.innerHTML = '<div class="os-boot-fill"></div><span class="os-boot-text">EchoOS</span>';
root.appendChild(boot);

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // Kick off the content fetch in parallel with the boot animation.
  const contentPromise = fetch(root.dataset.content)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  const content = await contentPromise;

  const bootDur = firstVisit ? 1150 : 350; // echoos-visited skips the long boot
  await Promise.all([contentPromise, delay(bootDur)]);

  boot.classList.add('os-boot-done');
  setTimeout(() => boot.remove(), 300);

  initOS(content || {});
}

function initOS(content) {
  const apps = content.apps || [];

  const wallpaper = initWallpaper(root);
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
    store,
    toast: (msg, opts) => notifications.toast(msg, opts),
    getSpotlight: () => spotlight,
    onFocus: (id) => {
      if (shellRef.current) shellRef.current.setFocusedApp(id);
      if (id === 'term' && term) term.focusInput();
    },
    renderers: {
      about: renderAbout,
      exp: renderExperience,
      proj: renderProjects,
      skills: renderSkills,
      blog: renderBlog,
      contact: renderContact,
      resume: renderResume,
      arcade: renderArcade,
      guide: (bodyEl, ctx) => renderGuide(bodyEl, { root, wm }),
      term: (bodyEl, ctx) => {
        if (!term) term = createTerminal(content, wm, { apps });
        term.mount(bodyEl);
      },
    },
  });

  spotlight = initSpotlight(root, {
    apps,
    content,
    wm,
    onOpenResult: (it) => {
      if (it.kind === 'project') wm.openApp('proj');
      else if (it.kind === 'post') wm.openApp('blog');
    },
  });

  const shell = initShell(root, {
    apps,
    wm,
    notifications,
    onSpotlight: () => spotlight.toggle(),
  });
  shellRef.current = shell;

  // about opens on boot (§6.4); first-time visitors get the guided tour.
  wm.openApp('about');
  if (!store.get().guideDone) wm.openApp('guide');

  // Post-boot welcome toast (prototype finishBoot): two-tone chirp + 9s auto-hide.
  beep(660, 0.08);
  setTimeout(() => beep(880, 0.1), 110);
  notifications.welcome();
}

main();

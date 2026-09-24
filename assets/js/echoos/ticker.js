// ticker.js — the desktop telemetry panel: a small glass readout under the
// desktop icons whose lines scroll upward on a loop. Visit numbers come from the
// nightly stats (stats-data.js), site facts from content.json, and two lines tick
// live (Calgary time, this session's length). Clicking it opens the Stats app.
//
// The scroll is one CSS transform over a list rendered twice, so the loop is
// seamless and runs on the compositor. Hover/focus pauses it; reduced motion
// gets a still list. Hidden on phones and short screens (os/_shell.scss).
import { loadStats, fmt, ago } from './stats-data.js';

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const pad = (n) => String(n).padStart(2, '0');

export function initTicker(root, { content, onOpen }) {
  const desktop = root.querySelector('.os-desktop');
  if (!desktop) return;

  const panel = document.createElement('section');
  panel.className = 'os-ticker';
  panel.setAttribute('aria-label', 'Site telemetry');
  panel.innerHTML = `
    <button type="button" class="os-ticker-head" aria-label="Open Stats">
      <span class="os-ticker-dot" aria-hidden="true"></span>
      <span>telemetry</span>
      <span class="os-ticker-live">live</span>
    </button>
    <div class="os-ticker-window"><div class="os-ticker-reel"></div></div>`;
  desktop.appendChild(panel);
  panel.addEventListener('click', onOpen);

  const reel = panel.querySelector('.os-ticker-reel');
  const started = Date.now();

  loadStats(content).then((stats) => {
    const site = content.site || {};
    const lines = [];
    const add = (label, value, key) => lines.push({ label, value, key });

    if (stats && stats.visits) {
      add('visits / 7d', fmt(stats.visits.last7));
      add('visits / 30d', fmt(stats.visits.last30));
      add('visits / all', fmt(stats.visits.allTime));
      const top = stats.top && stats.top.posts && stats.top.posts[0];
      if (top) {
        const post = (content.posts || []).find((p) => `/blog/${p.slug}` === top.path);
        add('top read', clip((post && post.title) || top.title || top.path, 26));
      }
      const app = stats.apps && stats.apps[0];
      if (app) {
        const a = (content.apps || []).find((x) => x.id === app.id);
        add('most opened', (a && a.label) || app.id);
      }
      const games = stats.games || [];
      if (games.length) {
        add('arcade runs', fmt(games.reduce((sum, g) => sum + g.count, 0)));
        add('top game', (content.gameNames || {})[games[0].id] || games[0].id);
      }
      const countries = (stats.countries || []).slice(0, 3).map((c) => c.name);
      if (countries.length) add('signals from', clip(countries.join(' · '), 26));
      if (stats.resume) add('resume ↓', fmt(stats.resume.downloads));
      add('uplink', ago(stats.generatedAt));
    } else {
      add('uplink', 'awaiting first sync');
    }
    add('posts', fmt(site.posts));
    add('projects', fmt(site.projects));
    add('words', fmt(site.words));
    add('diagrams', fmt(site.diagrams));
    if (site.commits) add('commits', fmt(site.commits));
    add('calgary', '--:--', 'clock');
    add('session', '00:00', 'session');

    const list = (hidden) => `
      <ul class="os-ticker-list"${hidden ? ' aria-hidden="true"' : ''}>
        ${lines.map((l) => `<li><span class="os-ticker-label">${esc(l.label)}</span><span class="os-ticker-value"${l.key ? ` data-key="${l.key}"` : ''}>${esc(l.value)}</span></li>`).join('')}
      </ul>`;
    // Two copies: the animation moves the reel up by exactly one copy, then loops.
    reel.innerHTML = list(false) + list(true);
    reel.style.setProperty('--ticker-duration', `${lines.length * 2.6}s`);
    panel.classList.add('is-ready');

    const tick = () => {
      const clock = new Date().toLocaleTimeString('en-CA', {
        timeZone: 'America/Edmonton', hour: '2-digit', minute: '2-digit', hour12: false,
      });
      const secs = Math.floor((Date.now() - started) / 1000);
      const session = secs >= 3600
        ? `${Math.floor(secs / 3600)}:${pad(Math.floor(secs / 60) % 60)}:${pad(secs % 60)}`
        : `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
      for (const el of reel.querySelectorAll('[data-key="clock"]')) el.textContent = clock;
      for (const el of reel.querySelectorAll('[data-key="session"]')) el.textContent = session;
    };
    tick();
    setInterval(tick, 1000);
  });
}

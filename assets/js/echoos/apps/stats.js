// apps/stats.js — "activity monitor": visit statistics plus facts about the
// site itself. Visits come from the nightly stats.json (stats-data.js) and the
// live all-time counter (analytics.js); site facts come from content.json and
// work even before any visits have been counted.
import { loadStats, fmt, ago } from '../stats-data.js';
import { liveCount } from '../analytics.js';

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

const dayLabel = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

// Horizontal bars (apps, games): label · bar · value. Bars are relative to the
// largest value; the value is always printed, so nothing depends on the bar alone.
function barRows(rows) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return `<ul class="os-stats-bars">${rows
    .map(
      (r) => `
      <li class="os-stats-bar" title="${esc(r.label)}: ${fmt(r.count)}">
        <span class="os-stats-bar-label">${esc(r.label)}</span>
        <span class="os-stats-bar-track"><span class="os-stats-bar-fill" style="width:${Math.max(2, Math.round((r.count / max) * 100))}%"></span></span>
        <span class="os-stats-bar-value">${fmt(r.count)}</span>
      </li>`
    )
    .join('')}</ul>`;
}

// Ranked list of posts or projects: title (opens in its window) · count.
function rankRows(rows) {
  return `<ol class="os-stats-rank">${rows
    .map(
      (r) => `
      <li>
        ${r.url ? `<a class="os-stats-rank-title" href="${esc(r.url)}">${esc(r.title)}</a>` : `<span class="os-stats-rank-title">${esc(r.title)}</span>`}
        <span class="os-stats-rank-count">${fmt(r.count)}</span>
      </li>`
    )
    .join('')}</ol>`;
}

// Daily visits, last 30 days: one column per day. Past days in a muted accent,
// the latest day in the full accent. Every column's full height is its hover
// target; the chart is also keyboard-navigable (←/→) and has a table view.
function dailyChart(daily) {
  const n = daily.length;
  const slot = 20;
  const barW = 16; // ≤24px, leaving a 4px surface gap between columns
  const H = 90;
  const max = Math.max(1, ...daily.map((d) => d.count));
  const cols = daily
    .map((d, i) => {
      const x = i * slot + (slot - barW) / 2;
      const h = d.count ? Math.max(3, Math.round((d.count / max) * (H - 4))) : 0;
      const y = H - h;
      const r = Math.min(4, h / 2, barW / 2);
      const bar = h
        ? `<path class="os-stats-col${i === n - 1 ? ' is-latest' : ''}" d="M${x},${H} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${H} Z"/>`
        : '';
      return `<g class="os-stats-colgroup" data-i="${i}">${bar}<rect class="os-stats-hit" x="${i * slot}" y="0" width="${slot}" height="${H}"/></g>`;
    })
    .join('');
  const peak = daily.reduce((a, b) => (b.count > a.count ? b : a), daily[0]);
  const table = daily
    .map((d) => `<tr><td>${esc(dayLabel(d.day))}</td><td>${fmt(d.count)}</td></tr>`)
    .join('');
  return `
    <div class="os-stats-chart" tabindex="0" role="img"
         aria-label="Visits per day, last ${n} days. Peak ${fmt(peak.count)} on ${esc(dayLabel(peak.day))}. Use the left and right arrow keys to read each day.">
      <svg viewBox="0 0 ${n * slot} ${H}" aria-hidden="true">
        <line class="os-stats-baseline" x1="0" y1="${H - 0.5}" x2="${n * slot}" y2="${H - 0.5}"/>
        ${cols}
      </svg>
      <div class="os-stats-tip" hidden></div>
      <div class="os-stats-axis"><span>${esc(dayLabel(daily[0].day))}</span><span>peak ${fmt(peak.count)} · ${esc(dayLabel(peak.day))}</span><span>${esc(dayLabel(daily[n - 1].day))}</span></div>
    </div>
    <details class="os-stats-table"><summary>show as table</summary>
      <table><thead><tr><th>Day</th><th>Visits</th></tr></thead><tbody>${table}</tbody></table>
    </details>`;
}

function wireChart(el, daily) {
  const chart = el.querySelector('.os-stats-chart');
  if (!chart) return;
  const tip = chart.querySelector('.os-stats-tip');
  const groups = [...chart.querySelectorAll('.os-stats-colgroup')];
  let active = -1;
  const show = (i) => {
    active = Math.max(0, Math.min(daily.length - 1, i));
    groups.forEach((g, j) => g.classList.toggle('is-active', j === active));
    const d = daily[active];
    tip.textContent = `${dayLabel(d.day)} · ${fmt(d.count)} visit${d.count === 1 ? '' : 's'}`;
    tip.hidden = false;
    const pct = ((active + 0.5) / daily.length) * 100;
    tip.style.left = `${Math.min(88, Math.max(12, pct))}%`;
  };
  const hide = () => {
    active = -1;
    tip.hidden = true;
    groups.forEach((g) => g.classList.remove('is-active'));
  };
  groups.forEach((g) => g.addEventListener('pointerenter', () => show(Number(g.dataset.i))));
  chart.addEventListener('pointerleave', hide);
  chart.addEventListener('focus', () => show(daily.length - 1));
  chart.addEventListener('blur', hide);
  chart.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      show((active < 0 ? daily.length - 1 : active) + (e.key === 'ArrowLeft' ? -1 : 1));
    }
  });
}

function section(title, body) {
  return `<section class="os-stats-section"><h4 class="os-stats-head">${esc(title)}</h4>${body}</section>`;
}

export function renderStats(bodyEl, { content }) {
  const site = content.site || {};
  bodyEl.innerHTML = '<div class="os-stats"><div class="os-stats-top">echo-stats — loading…</div></div>';

  Promise.all([loadStats(content), liveCount('TOTAL')]).then(([stats, liveTotal]) => {
    const wrap = document.createElement('div');
    wrap.className = 'os-stats';
    const parts = [];
    const v = (stats && stats.visits) || {};
    const allTime = liveTotal ?? v.allTime;

    parts.push(`<div class="os-stats-top">echo-stats — ${stats ? `updated ${esc(ago(stats.generatedAt))}` : 'visit data pending'} · approximate, privacy-friendly</div>`);

    parts.push(`<ul class="os-stats-tiles">
      <li><strong>${stats ? fmt(v.last7) : '—'}</strong><span>visits · 7 days</span></li>
      <li><strong>${stats ? fmt(v.last30) : '—'}</strong><span>visits · 30 days</span></li>
      <li><strong>${allTime != null ? fmt(allTime) : '—'}</strong><span>visits · all time</span></li>
    </ul>`);

    if (stats && Array.isArray(stats.daily) && stats.daily.length) {
      parts.push(section('Visits · last 30 days', dailyChart(stats.daily)));
    }

    if (stats) {
      const posts = (stats.top && stats.top.posts) || [];
      const projects = (stats.top && stats.top.projects) || [];
      const withUrl = (rows, list, prefix) =>
        rows.map((r) => {
          const slug = r.path.slice(prefix.length);
          const item = (list || []).find((x) => x.slug === slug);
          return { title: (item && item.title) || r.title || slug, url: item && item.url, count: r.count };
        });
      if (posts.length) parts.push(section('Most read · 30 days', rankRows(withUrl(posts, content.posts, '/blog/'))));
      if (projects.length) parts.push(section('Most viewed projects · 30 days', rankRows(withUrl(projects, content.projects, '/projects/'))));

      const appLabel = (id) => ((content.apps || []).find((a) => a.id === id) || {}).label || id;
      const apps = (stats.apps || []).map((a) => ({ label: appLabel(a.id), count: a.count }));
      if (apps.length) parts.push(section('Windows opened · 30 days', barRows(apps)));

      const names = content.gameNames || {};
      const games = (stats.games || []).map((g) => ({ label: names[g.id] || g.id, count: g.count }));
      if (games.length) parts.push(section('Arcade runs · 30 days', barRows(games)));

      const countries = (stats.countries || []).map((c) => ({ label: c.name, count: c.count }));
      if (countries.length) parts.push(section('Visitors from · 30 days', barRows(countries)));

      if (stats.resume) {
        parts.push(`<p class="os-stats-note">Resume: ${fmt(stats.resume.views)} views, ${fmt(stats.resume.downloads)} downloads in 30 days.</p>`);
      }
    } else {
      parts.push(`<p class="os-stats-note">Visit statistics appear here after the first nightly update.</p>`);
    }

    const built = site.lastCommit ? `last change ${esc(ago(site.lastCommit))}` : `built ${esc(ago(site.builtAt))}`;
    parts.push(section('This site', `<ul class="os-stats-facts">
      <li><strong>${fmt(site.posts)}</strong> posts</li>
      <li><strong>${fmt(site.projects)}</strong> projects</li>
      <li><strong>${fmt(site.words)}</strong> words written</li>
      <li><strong>${fmt(site.diagrams)}</strong> diagrams</li>
      ${site.commits ? `<li><strong>${fmt(site.commits)}</strong> commits</li>` : ''}
      <li>${built}</li>
    </ul>`));

    parts.push(`<p class="os-stats-foot">Counted with GoatCounter: no cookies, no personal data. Visitors with ad blockers or Do Not Track aren't counted, so real numbers are higher.</p>`);

    wrap.innerHTML = parts.join('');
    bodyEl.innerHTML = '';
    bodyEl.appendChild(wrap);
    wireChart(wrap, (stats && stats.daily) || []);
  });
}

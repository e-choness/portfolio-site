// terminal.js — echo-sh command interpreter (§6.6, patch 42).
// Command set exactly as per prototype spec: help, about, whoami, skills,
// projects, blog, experience, education, contact, resume, open, theme, sound,
// clear, date, ls, echo, neofetch, vim/vi, exit, hi/hello, sudo, games.
import { store } from './store.js';
import { sfx } from './sound.js';

export function createTerminal(content, wm, { apps }) {
  let outEl = null;
  let input = null;
  const history = [];
  let histIdx = -1;
  let bannerPrinted = false;

  function mount(bodyEl) {
    bodyEl.innerHTML = `
      <div class="os-term">
        <div class="os-term-out"></div>
        <form class="os-term-form">
          <span class="os-term-prompt">➜</span>
          <input class="os-term-input" autocomplete="off" spellcheck="false" aria-label="Terminal input" />
        </form>
      </div>`;
    outEl = bodyEl.querySelector('.os-term-out');
    input = bodyEl.querySelector('.os-term-input');

    // Print banner only once
    if (!bannerPrinted) {
      printRaw({ text: 'EchoOS terminal — type `help` to see commands.', kind: 'muted' });
      bannerPrinted = true;
    }

    input.addEventListener('keydown', onKey);
    bodyEl.querySelector('.os-term-form').addEventListener('submit', (e) => {
      e.preventDefault();
      run();
    });
  }

  function focusInput() {
    if (input) input.focus();
  }

  function printRaw({ text, kind = 'out' }) {
    const line = document.createElement('div');
    line.className = `os-term-line os-term-${kind}`;
    line.textContent = text;
    outEl.appendChild(line);
    outEl.scrollTop = outEl.scrollHeight;
  }

  function print({ text, kind = 'out' }) {
    printRaw({ text, kind });
  }

  function run() {
    const raw = input.value.trim();
    if (raw) {
      history.push(raw);
    }
    histIdx = history.length;
    printRaw({ text: `➜ ${raw}`, kind: 'in' });
    exec(raw);
    input.value = '';
  }

  function onKey(e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      nav(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nav(1);
    }
  }

  function nav(dir) {
    if (!history.length) return;
    histIdx = Math.min(Math.max(histIdx + dir, -1), history.length - 1);
    input.value = histIdx === -1 ? '' : history[histIdx];
  }

  function fuzzy(hay, needle) {
    return hay.toLowerCase().includes(needle.toLowerCase());
  }

  function deriveTopSkills() {
    const allSkills = [];
    for (const cat of content.skills || []) {
      for (const skill of cat.skills || []) {
        allSkills.push(skill);
      }
    }
    return allSkills
      .sort((a, b) => (b.level || 0) - (a.level || 0))
      .slice(0, 5)
      .map((s) => `${s.name} ${s.level}%`)
      .join(' · ');
  }

  function deriveProcessCount() {
    let count = 0;
    for (const cat of content.skills || []) {
      count += (cat.skills || []).length;
    }
    return count;
  }

  function deriveMaxYears() {
    let max = 0;
    for (const cat of content.skills || []) {
      for (const skill of cat.skills || []) {
        max = Math.max(max, skill.years || 0);
      }
    }
    return max;
  }

  function open(arg) {
    const lc = (arg || '').toLowerCase();

    // Try app by id or label prefix
    const app = apps.find((a) => a.id === lc || a.label.toLowerCase().startsWith(lc));
    if (app) {
      print({ text: `opening ${app.label}…`, kind: 'muted' });
      wm.openApp(app.id);
      return;
    }

    // Try project by title
    const proj = (content.projects || []).find((p) => fuzzy(p.title, arg));
    if (proj) {
      print({ text: `opening Projects…`, kind: 'muted' });
      wm.openApp('proj');
      return;
    }

    // Try post by title (and select it)
    const post = (content.posts || []).find((p) => fuzzy(p.title, arg));
    if (post) {
      print({ text: `opening Blog…`, kind: 'muted' });
      wm.openApp('blog');
      // Fire custom event to select the post
      window.dispatchEvent(new CustomEvent('echoos:open-post', { detail: { post } }));
      return;
    }

    print({ text: `no app called "${arg}"`, kind: 'err' });
  }

  function exec(cmd) {
    const lc = cmd.toLowerCase();
    const lcParts = lc.split(/\s+/);
    const head = lcParts[0] || '';

    // For arg and raw arg: split original cmd
    const origParts = cmd.split(/\s+/);
    const origArgs = origParts.slice(1);
    const arg = origArgs.join(' ');

    switch (head) {
      case 'help':
        print({ text: 'help · about · whoami · skills · projects · blog · contact', kind: 'muted' });
        print({ text: 'open <app> · theme · sound · neofetch · date · ls · clear · exit', kind: 'muted' });
        print({ text: 'games: tetris · snake · missile · pond · breakout · invaders', kind: 'muted' });
        break;

      case 'about':
        if (content.profile) {
          print({ text: `${content.profile.name} — ${content.profile.title} · ${content.profile.location}`, kind: 'out' });
          print({ text: content.profile.tagline, kind: 'muted' });
        }
        wm.openApp('about');
        break;

      case 'whoami':
        if (content.profile) {
          print({ text: `${content.profile.name} — ${content.profile.title} · ${content.profile.location}`, kind: 'out' });
          print({ text: content.profile.tagline, kind: 'muted' });
        }
        break;

      case 'skills': {
        const top = deriveTopSkills();
        print({ text: `top: ${top}`, kind: 'muted' });
        wm.openApp('skills');
        break;
      }

      case 'projects':
        for (const p of content.projects || []) {
          print({ text: `• ${p.title}`, kind: 'muted' });
        }
        wm.openApp('proj');
        break;

      case 'blog':
        for (const p of (content.posts || []).slice(0, 3)) {
          print({ text: `• ${p.title}`, kind: 'muted' });
        }
        wm.openApp('blog');
        break;

      case 'experience':
        for (const e of content.experience || []) {
          print({ text: `• ${e.position} — ${e.company}`, kind: 'muted' });
        }
        wm.openApp('exp');
        break;

      case 'education':
        for (const e of content.education || []) {
          print({ text: `• ${e.degree} — ${e.school}`, kind: 'muted' });
        }
        wm.openApp('about');
        // Fire event to select education tab
        window.dispatchEvent(new CustomEvent('echoos:set-about-tab', { detail: { tab: 'education' } }));
        break;

      case 'contact':
        if (content.profile) {
          print({ text: content.profile.email, kind: 'out' });
        }
        wm.openApp('contact');
        break;

      case 'resume':
        print({ text: 'opening resume.pdf…', kind: 'muted' });
        wm.openApp('resume');
        break;

      case 'clear':
        outEl.innerHTML = '';
        break;

      case 'date':
        print({ text: new Date().toString(), kind: 'muted' });
        break;

      case 'ls':
        print({ text: apps.map((a) => a.id).join(' '), kind: 'out' });
        break;

      case 'neofetch': {
        const procCount = deriveProcessCount();
        const uptime = deriveMaxYears();
        print({ text: 'EchoOS 1.0 — paper edition', kind: 'accent' });
        print({ text: 'host: github pages · jekyll static', kind: 'muted' });
        print({ text: 'shell: echo-sh · wm: paperwm', kind: 'muted' });
        print({ text: `uptime: ${uptime}+ years in AI · packages: ${(content.projects || []).length} projects, ${(content.posts || []).length} posts`, kind: 'muted' });
        break;
      }

      case 'open':
        open(arg);
        break;

      case 'theme': {
        const v = (lcParts[1] || '').toLowerCase();
        if (v === 'light' || v === 'dark') {
          store.set({ theme: v });
          print({ text: `theme → ${v}`, kind: 'muted' });
        } else {
          const current = store.get().theme || 'light';
          const next = current === 'light' ? 'dark' : 'light';
          store.set({ theme: next });
          print({ text: `theme → ${next}`, kind: 'muted' });
        }
        break;
      }

      case 'sound': {
        const v = (lcParts[1] || '').toLowerCase();
        if (v === 'on' || v === 'off') {
          store.set({ sound: v });
          print({ text: `sound → ${v}`, kind: 'muted' });
        } else {
          const current = store.get().sound || 'on';
          const next = current === 'on' ? 'off' : 'on';
          store.set({ sound: next });
          print({ text: `sound → ${next}`, kind: 'muted' });
        }
        break;
      }

      case 'echo':
        if (arg) {
          print({ text: arg, kind: 'out' });
        }
        break;

      case 'vim':
      case 'vi':
        print({ text: 'you are now stuck in vim. (type `open contact` to send help)', kind: 'muted' });
        break;

      case 'exit':
        print({ text: 'there is no escape — this is a portfolio.', kind: 'muted' });
        break;

      case 'hi':
      case 'hello':
        print({ text: 'hello! try `help`.', kind: 'muted' });
        break;

      case 'coffee':
        print({ text: 'brewing… done. (decaf — we ship on fridays)', kind: 'accent' });
        break;

      case 'sudo': {
        if (arg === 'make coffee') {
          print({ text: 'brewing… done. (decaf — we ship on fridays)', kind: 'accent' });
        } else if (cmd.toLowerCase().startsWith('sudo')) {
          print({ text: 'nice try. this incident will be reported to echo.', kind: 'err' });
        }
        break;
      }

      case 'rm': {
        const rmCmd = lc.trim();
        if (rmCmd === 'rm -rf /' || rmCmd === 'rm -rf /*') {
          print({ text: 'refusing: the portfolio is load-bearing.', kind: 'err' });
        } else {
          print({ text: `command not found: ${cmd} — try \`help\``, kind: 'err' });
          sfx.error();
        }
        break;
      }

      case 'tetris':
      case 'snake':
      case 'missile':
      case 'pond':
      case 'breakout':
      case 'invaders': {
        print({ text: `launching ${head}…`, kind: 'muted' });
        wm.openApp('arcade');
        setTimeout(() => {
          if (window.EchoGames) {
            const game = window.EchoGames.list.find((g) => g.id === head);
            if (game) {
              window.dispatchEvent(new CustomEvent('echoos:start-game', { detail: { game } }));
            }
          }
        }, 80);
        break;
      }

      case 'arcade':
      case 'games':
        print({ text: 'insert coin.', kind: 'muted' });
        wm.openApp('arcade');
        break;

      case '':
        break;

      default:
        print({ text: `command not found: ${cmd} — try \`help\``, kind: 'err' });
        sfx.error();
    }
  }

  return { mount, focusInput };
}

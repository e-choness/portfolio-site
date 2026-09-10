---
---
// terminal.js — echo-sh command interpreter (§6.6, patch 42).
const TERMINAL = {{ site.data.terminal | jsonify }};
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
          <input class="os-term-input" autocomplete="off" spellcheck="false" aria-label="Terminal input" placeholder="type help" />
        </form>
      </div>`;
    outEl = bodyEl.querySelector('.os-term-out');
    input = bodyEl.querySelector('.os-term-input');

    // Print banner only once
    if (!bannerPrinted) {
      printRaw({ text: TERMINAL.messages.banner, kind: 'muted' });
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
    if (outEl) outEl.scrollTop = outEl.scrollHeight;
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

  function fmt(t, v) {
    return t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
  }

  function fuzzy(hay, needle) {
    return hay.toLowerCase().includes(needle.toLowerCase());
  }

  function deriveTopSkills() {
    const allSkills = [];
    for (const cat of content.skills || []) {
      for (const skill of cat.items || []) {
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
      count += (cat.items || []).length;
    }
    return count;
  }

  function deriveMaxYears() {
    let max = 0;
    for (const cat of content.skills || []) {
      for (const skill of cat.items || []) {
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
      print({ text: fmt(TERMINAL.cmd_strings.opening_app, { label: app.label }), kind: 'muted' });
      wm.openApp(app.id);
      return;
    }

    // Try project by title
    const proj = (content.projects || []).find((p) => fuzzy(p.title, arg));
    if (proj) {
      print({ text: TERMINAL.cmd_strings.opening_projects, kind: 'muted' });
      wm.openApp('proj');
      return;
    }

    // Try post by title (and select it)
    const post = (content.posts || []).find((p) => fuzzy(p.title, arg));
    if (post) {
      print({ text: TERMINAL.cmd_strings.opening_blog, kind: 'muted' });
      wm.openApp('blog');
      // Fire custom event to select the post
      document.dispatchEvent(new CustomEvent('echoos:open-post', { detail: { slug: post.slug } }));
      return;
    }

    print({ text: fmt(TERMINAL.cmd_strings.no_app, { arg }), kind: 'err' });
  }

  function exec(cmd) {
    const lc = cmd.toLowerCase();
    const lcParts = lc.split(/\s+/);
    const head = lcParts[0] || '';

    // For arg and raw arg: split original cmd
    const origParts = cmd.split(/\s+/);
    const origArgs = origParts.slice(1);
    const arg = origArgs.join(' ');

    if (TERMINAL.games.includes(head)) {
      print({ text: fmt(TERMINAL.cmd_strings.launching, { name: head }), kind: 'muted' });
      wm.openApp('arcade');
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('echoos:start-game', { detail: { id: head } }));
      }, 80);
      return;
    }
    switch (head) {
      case 'help':
        for (const line of TERMINAL.help) print({ text: line, kind: 'muted' });
        break;

      case 'about':
        if (content.profile) {
          print({ text: fmt(TERMINAL.cmd_strings.profile_line, { name: content.profile.name, title: content.profile.title, location: content.profile.location }), kind: 'out' });
          print({ text: content.profile.tagline, kind: 'muted' });
        }
        wm.openApp('about');
        break;

      case 'whoami':
        if (content.profile) {
          print({ text: fmt(TERMINAL.cmd_strings.profile_line, { name: content.profile.name, title: content.profile.title, location: content.profile.location }), kind: 'out' });
          print({ text: content.profile.tagline, kind: 'muted' });
        }
        break;

      case 'skills': {
        const top = deriveTopSkills();
        print({ text: fmt(TERMINAL.cmd_strings.skills_top, { skills: top }), kind: 'muted' });
        wm.openApp('skills');
        break;
      }

      case 'projects':
        for (const p of content.projects || []) {
          print({ text: fmt(TERMINAL.cmd_strings.list_item, { value: p.title }), kind: 'muted' });
        }
        wm.openApp('proj');
        break;

      case 'blog':
        for (const p of (content.posts || []).slice(0, 3)) {
          print({ text: fmt(TERMINAL.cmd_strings.list_item, { value: p.title }), kind: 'muted' });
        }
        wm.openApp('blog');
        break;

      case 'experience':
        for (const e of content.experience || []) {
          print({ text: fmt(TERMINAL.cmd_strings.experience_item, { role: e.role, company: e.company }), kind: 'muted' });
        }
        wm.openApp('exp');
        break;

      case 'education':
        for (const e of content.education || []) {
          print({ text: fmt(TERMINAL.cmd_strings.education_item, { degree: e.degree, school: e.school }), kind: 'muted' });
        }
        wm.openApp('about');
        // Fire event to select education tab
        document.dispatchEvent(new CustomEvent('echoos:set-about-tab', { detail: { tab: 'education' } }));
        break;

      case 'contact':
        if (content.profile) {
          print({ text: content.profile.email, kind: 'out' });
        }
        wm.openApp('contact');
        break;

      case 'resume':
        print({ text: TERMINAL.messages.resume, kind: 'muted' });
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
        const uptime = deriveMaxYears();
        print({ text: TERMINAL.neofetch.os, kind: 'accent' });
        print({ text: fmt(TERMINAL.cmd_strings.neofetch_host, { host: TERMINAL.neofetch.host }), kind: 'muted' });
        print({ text: fmt(TERMINAL.cmd_strings.neofetch_shell, { shell: TERMINAL.neofetch.shell }), kind: 'muted' });
        print({ text: fmt(TERMINAL.cmd_strings.neofetch_uptime, { uptime, projects: (content.projects || []).length, posts: (content.posts || []).length }), kind: 'muted' });
        break;
      }

      case 'open':
        open(arg);
        break;

      case 'theme': {
        const v = (lcParts[1] || '').toLowerCase();
        if (v === 'light' || v === 'dark') {
          store.set({ theme: v });
          print({ text: fmt(TERMINAL.cmd_strings.theme_set, { value: v }), kind: 'muted' });
        } else {
          const current = store.get().theme || 'light';
          const next = current === 'light' ? 'dark' : 'light';
          store.set({ theme: next });
          print({ text: fmt(TERMINAL.cmd_strings.theme_set, { value: next }), kind: 'muted' });
        }
        break;
      }

      case 'sound': {
        const v = (lcParts[1] || '').toLowerCase();
        if (v === 'on' || v === 'off') {
          store.set({ sound: v });
          print({ text: fmt(TERMINAL.cmd_strings.sound_set, { value: v }), kind: 'muted' });
        } else {
          const current = store.get().sound || 'on';
          const next = current === 'on' ? 'off' : 'on';
          store.set({ sound: next });
          print({ text: fmt(TERMINAL.cmd_strings.sound_set, { value: next }), kind: 'muted' });
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
        print({ text: TERMINAL.messages.vim, kind: 'muted' });
        break;

      case 'exit':
        print({ text: TERMINAL.messages.exit, kind: 'muted' });
        break;

      case 'hi':
      case 'hello':
        print({ text: TERMINAL.messages.hello, kind: 'muted' });
        break;

      case 'coffee':
        print({ text: TERMINAL.messages.coffee, kind: 'accent' });
        break;

      case 'sudo': {
        if (arg === 'make coffee') {
          print({ text: TERMINAL.messages.coffee, kind: 'accent' });
        } else if (cmd.toLowerCase().startsWith('sudo')) {
          print({ text: TERMINAL.messages.sudo_denied, kind: 'err' });
        }
        break;
      }

      case 'rm': {
        const rmCmd = lc.trim();
        if (rmCmd === 'rm -rf /' || rmCmd === 'rm -rf /*') {
          print({ text: TERMINAL.messages.rm_refused, kind: 'err' });
        } else {
          print({ text: fmt(TERMINAL.cmd_strings.not_found, { cmd }), kind: 'err' });
          sfx.error();
        }
        break;
      }

      case 'arcade':
      case 'games':
        print({ text: TERMINAL.messages.arcade, kind: 'muted' });
        wm.openApp('arcade');
        break;

      case 'git': {
        const sub = lcParts[1] || '';
        if (sub === 'log') {
          for (const line of TERMINAL.easter_eggs.git_log) print({ text: line, kind: 'muted' });
        } else if (sub === 'status') {
          print({ text: TERMINAL.easter_eggs.git_status, kind: 'muted' });
        } else if (sub === 'push') {
          print({ text: TERMINAL.easter_eggs.git_push, kind: 'err' });
        } else {
          print({ text: fmt(TERMINAL.cmd_strings.git_unknown, { sub }), kind: 'err' });
        }
        break;
      }

      case 'ping':
        print({ text: TERMINAL.easter_eggs.ping, kind: 'muted' });
        break;

      case 'uname':
        print({ text: TERMINAL.easter_eggs.uname, kind: 'muted' });
        break;

      case 'man': {
        const topic = arg.toLowerCase();
        if (topic === 'life') {
          print({ text: TERMINAL.easter_eggs.man_life, kind: 'muted' });
        } else {
          print({ text: TERMINAL.easter_eggs.man_generic, kind: 'muted' });
        }
        break;
      }

      case 'ps':
        for (const line of TERMINAL.easter_eggs.ps) print({ text: line, kind: 'muted' });
        break;

      case 'fortune': {
        const pool = TERMINAL.easter_eggs.fortune;
        print({ text: pool[Math.floor(Math.random() * pool.length)], kind: 'accent' });
        break;
      }

      case 'cat': {
        if (!arg || arg === '.') {
          for (const line of TERMINAL.easter_eggs.cat.split('\n')) print({ text: line, kind: 'accent' });
        } else if (arg.includes('passwd')) {
          print({ text: TERMINAL.easter_eggs.cat_passwd, kind: 'muted' });
        } else {
          print({ text: fmt(TERMINAL.cmd_strings.cat_not_found, { arg }), kind: 'err' });
        }
        break;
      }

      case 'curl':
        print({ text: TERMINAL.easter_eggs.curl, kind: 'muted' });
        break;

      case 'matrix':
        print({ text: TERMINAL.easter_eggs.matrix, kind: 'accent' });
        break;

      case '':
        break;

      default:
        print({ text: fmt(TERMINAL.cmd_strings.not_found, { cmd }), kind: 'err' });
        sfx.error();
    }
  }

  return { mount, focusInput };
}

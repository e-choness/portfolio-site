// terminal.js — echo-sh command interpreter (§6.6).
// Command set (all implemented, exactly these): help, about, experience,
// projects, skills, education, blog, contact, resume, open <app|project|post>,
// theme [light|dark], sound [on|off], clear, whoami, date, ls, echo <text>,
// sudo make coffee. Unknown commands error; Up/Down walk history.
import { store } from './store.js';
import { sfx } from './sound.js';

export function createTerminal(content, wm, { apps }) {
  let outEl = null;
  let input = null;
  const history = [];
  let histIdx = -1;

  function mount(bodyEl) {
    bodyEl.innerHTML = `
      <div class="os-term">
        <div class="os-term-out"></div>
        <form class="os-term-form">
          <span class="os-term-prompt">echo-sh $</span>
          <input class="os-term-input" autocomplete="off" spellcheck="false" aria-label="Terminal input" />
        </form>
      </div>`;
    outEl = bodyEl.querySelector('.os-term-out');
    input = bodyEl.querySelector('.os-term-input');
    print({ text: 'EchoOS terminal — type `help` to see commands.', kind: 'muted' });
    input.addEventListener('keydown', onKey);
    bodyEl.querySelector('.os-term-form').addEventListener('submit', (e) => {
      e.preventDefault();
      run();
    });
  }

  function focusInput() {
    if (input) input.focus();
  }

  function print({ text, kind = 'out' }) {
    const line = document.createElement('div');
    line.className = `os-term-line os-term-${kind}`;
    line.textContent = text;
    outEl.appendChild(line);
    outEl.scrollTop = outEl.scrollHeight;
  }

  function run() {
    const cmd = input.value.trim();
    history.push(cmd);
    histIdx = history.length;
    print({ text: `echo-sh $ ${cmd}`, kind: 'muted' });
    exec(cmd);
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

  function open(arg) {
    if (!arg) {
      print({ text: 'open: missing argument (usage: open <app|project|post>)', kind: 'err' });
      return;
    }
    const app = apps.find((a) => a.id === arg.toLowerCase() || a.label.toLowerCase() === arg.toLowerCase());
    if (app) {
      wm.openApp(app.id);
      return;
    }
    const proj = (content.projects || []).find((p) => fuzzy(p.title, arg));
    if (proj) {
      wm.openApp('proj');
      return;
    }
    const post = (content.posts || []).find((p) => fuzzy(p.title, arg));
    if (post) {
      wm.openApp('blog');
      return;
    }
    print({ text: `open: ${arg}: not found`, kind: 'err' });
    sfx.error();
  }

  function exec(cmd) {
    const parts = cmd.split(/\s+/);
    const head = (parts[0] || '').toLowerCase();
    const args = parts.slice(1);
    const arg = args.join(' ');

    switch (head) {
      case 'help':
        print({
          text: 'Commands: help, about, experience, projects, skills, education, blog, contact, resume, open <app|project|post>, theme [light|dark], sound [on|off], clear, whoami, date, ls, echo <text>, sudo make coffee',
          kind: 'accent',
        });
        break;
      case 'about': wm.openApp('about'); break;
      case 'experience': wm.openApp('exp'); break;
      case 'projects': wm.openApp('proj'); break;
      case 'skills': wm.openApp('skills'); break;
      case 'education': wm.openApp('about'); break; // education tab lives in About
      case 'blog': wm.openApp('blog'); break;
      case 'contact': wm.openApp('contact'); break;
      case 'resume': wm.openApp('resume'); break;
      case 'open': open(arg); break;
      case 'theme': {
        const v = (args[0] || '').toLowerCase();
        if (v === 'light' || v === 'dark') {
          store.set({ theme: v });
          print({ text: `theme set to ${v}`, kind: 'out' });
        } else {
          print({ text: `theme: ${store.get().theme} (usage: theme [light|dark])`, kind: 'muted' });
        }
        break;
      }
      case 'sound': {
        const v = (args[0] || '').toLowerCase();
        if (v === 'on' || v === 'off') {
          store.set({ sound: v });
          print({ text: `sound ${v}`, kind: 'out' });
        } else {
          print({ text: `sound: ${store.get().sound} (usage: sound [on|off])`, kind: 'muted' });
        }
        break;
      }
      case 'clear':
        outEl.innerHTML = '';
        break;
      case 'whoami':
        print({ text: content.profile ? content.profile.name : 'echo', kind: 'out' });
        break;
      case 'date':
        print({ text: new Date().toString(), kind: 'out' });
        break;
      case 'ls':
        print({ text: apps.map((a) => a.id).join('  '), kind: 'out' });
        break;
      case 'echo':
        print({ text: arg || '', kind: 'out' });
        break;
      case 'sudo': {
        if (arg === 'make coffee') {
          print({ text: "I'm a static site. Brew your own.", kind: 'accent' });
        } else {
          print({ text: `echo-sh: sudo: ${arg}: command not found`, kind: 'err' });
        }
        break;
      }
      case '':
        break;
      default:
        print({ text: `echo-sh: ${head}: command not found`, kind: 'err' });
        sfx.error();
    }
  }

  return { mount, focusInput };
}

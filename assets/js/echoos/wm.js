// wm.js — window manager: open/close/focus/drag/resize/z-order/clamp (§6.4).
import { sfx } from './sound.js';

export function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

export function createWM(root, opts = {}) {
  // opts: { apps, renderers, getSpotlight, onFocus }
  const apps = opts.apps || [];
  const MOBILE = window.matchMedia('(max-width: 760px)');
  const byId = (id) => apps.find((a) => a.id === id);
  const winEls = new Map();  // id -> DOM element
  const wins = new Map();    // id -> {id, open, x, y, w, h, z, minimized}
  const vw = () => window.innerWidth;
  const vh = () => window.innerHeight;
  let ztop = 2; // `about` opens on boot with z = 2
  let focused = null;

  // --- geometry -----------------------------------------------------------

  // Usable rectangle between the menubar and the dock. Measured, not assumed:
  // the dock's height changes with the tooltip patch and the mobile sheet has
  // its own geometry (see .os-sheet), so hardcoded 84/140 offsets drift.
  function workArea() {
    const top = 46;                                   // menubar (--bar-h) + 6
    const dock = root.querySelector('.os-dock');
    const r = dock && dock.offsetParent ? dock.getBoundingClientRect() : null;
    const bottom = r ? r.top - 10 : vh() - 16;
    return { x: 6, y: top, w: vw() - 12, h: Math.max(240, bottom - top) };
  }

  // Initial sizes are work-area-derived, NOT the raw apps.yml numbers (§6.4).
  function initialSize(app) {
    const a = workArea();
    return { w: Math.min(app.w, a.w - 108), h: Math.min(app.h, a.h) };
  }

  function clampWin(win) {
    const a = workArea();
    win.w = Math.min(win.w, a.w);
    win.h = Math.min(win.h, a.h);
    win.x = clamp(win.x, a.x, a.x + a.w - win.w);
    win.y = clamp(win.y, a.y, a.y + a.h - win.h);
    return win;
  }

  function anchorApp(win, app) {
    if (app.anchor === 'bottom-right') {
      const a = workArea();
      win.x = vw() - win.w - 24;
      win.y = a.y + a.h - win.h - 8;
    }
    return win;
  }

  function apply(win) {
    const el = winEls.get(win.id);
    if (!el) return;
    if (MOBILE.matches) {
      el.classList.add('os-sheet');
    } else {
      el.classList.remove('os-sheet');
      el.style.left = `${win.x}px`;
      el.style.top = `${win.y}px`;
      el.style.width = `${win.w}px`;
      el.style.height = `${win.h}px`;
    }
    el.style.zIndex = String(win.z + 100);
  }

  // --- building windows ---------------------------------------------------

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function buildWin(app) {
    const el = document.createElement('section');
    // Guide gets a modifier so its window body can zero its padding and pin the
    // action footer flush to the window bottom (audit patch 18, bug 3).
    el.className = `os-win${app.id === 'guide' ? ' os-win-guide' : ''}`;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'false');
    el.setAttribute('aria-label', app.title || app.label);
    el.dataset.app = app.id;
    el.tabIndex = -1;
    el.innerHTML = `
      <header class="os-win-bar">
        <span class="os-win-dot" aria-hidden="true"></span>
        <span class="os-win-title"></span>
        <div class="os-win-actions"></div>
        <button type="button" class="os-win-close" aria-label="Close ${esc(app.label)}"></button>
      </header>
      <div class="os-win-body"></div>
      <div class="os-win-resize" aria-hidden="true"></div>`;
    el.querySelector('.os-win-title').textContent = app.title || app.label;

    const win = {
      id: app.id,
      open: false,
      x: app.x,
      y: app.y,
      w: 0,
      h: 0,
      z: 0,
      minimized: false,
      rendered: false,
      placed: false, // sized/placed against the live work area on first open
      teardown: null,
    };
    const s = initialSize(app);
    win.w = s.w;
    win.h = s.h;
    clampWin(win);

    // Clicking anywhere in a window focuses it.
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.os-win-close') || e.target.closest('.os-win-resize')) return;
      focus(win.id);
    });

    el.querySelector('.os-win-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeApp(win.id);
    });
    el.querySelector('.os-win-bar').addEventListener('pointerdown', (e) => startDrag(e, win));
    el.querySelector('.os-win-resize').addEventListener('pointerdown', (e) => startResize(e, win));

    el.style.display = 'none';
    root.appendChild(el);
    winEls.set(win.id, el);
    wins.set(win.id, win);
    return win;
  }

  // --- drag ---------------------------------------------------------------

  function startDrag(e, win) {
    if (MOBILE.matches) return;
    if (e.target.closest('button, a, input, select')) return;
    if (resizeActive) return;
    if (e.button !== 0) return;
    focus(win.id);
    const dx = e.clientX - win.x;
    const dy = e.clientY - win.y;
    const el = winEls.get(win.id);
    el.setPointerCapture(e.pointerId);
    el.classList.add('os-dragging');
    document.body.classList.add('os-dragging-cursor');

    const move = (ev) => {
      // Loose bounds: partly under the dock is fine, the title bar is not.
      const a = workArea();
      win.x = clamp(ev.clientX - dx, -win.w + 80, vw() - 60);
      win.y = clamp(ev.clientY - dy, 42, a.y + a.h - 40);
      apply(win);
    };
    const up = (ev) => {
      el.classList.remove('os-dragging');
      document.body.classList.remove('os-dragging-cursor');
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      try { el.releasePointerCapture(ev.pointerId); } catch {}
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  // --- resize -------------------------------------------------------------

  let resizeActive = false;

  function startResize(e, win) {
    if (MOBILE.matches) return;
    e.preventDefault();
    e.stopPropagation();
    resizeActive = true;
    focus(win.id);
    const sx = e.clientX;
    const sy = e.clientY;
    const sw = win.w;
    const sh = win.h;
    const el = winEls.get(win.id);
    el.setPointerCapture(e.pointerId);
    el.classList.add('os-resizing');

    const move = (ev) => {
      const a = workArea();
      win.w = clamp(sw + ev.clientX - sx, 320, vw() - win.x - 8);
      win.h = clamp(sh + ev.clientY - sy, 240, a.y + a.h - win.y);
      apply(win);
    };
    const up = (ev) => {
      resizeActive = false;
      el.classList.remove('os-resizing');
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      try { el.releasePointerCapture(ev.pointerId); } catch {}
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  // --- open / close / focus ----------------------------------------------

  function renderBody(win, app) {
    // Call previous teardown if registered
    if (win.teardown) {
      win.teardown();
      win.teardown = null;
    }

    const body = winEls.get(win.id).querySelector('.os-win-body');
    const titlebar = winEls.get(win.id).querySelector('.os-win-actions');
    body.innerHTML = '';
    if (titlebar) titlebar.innerHTML = '';
    const renderer = opts.renderers && opts.renderers[app.id];
    if (renderer) {
      const result = renderer(body, {
        app,
        content: opts.content || null,
        wm: api,
        store: opts.store,
        toast: opts.toast,
        sfx,
        titlebar,
      });
      // Store teardown function if renderer returned one
      if (typeof result === 'function') {
        win.teardown = result;
      }
    }
    win.rendered = true;
  }

  function openApp(id, { silent = false } = {}) {
    const app = byId(id);
    if (!app) return;
    if (opts.notifications) {
      opts.notifications.closePanel();
      opts.notifications.dismissWelcome();
    }
    let win = wins.get(id);
    if (!win) win = buildWin(app);
    // Windows are pre-built before the dock exists, so the build-time size
    // can't see it: size and clamp against the real work area on first open.
    if (!win.placed) {
      Object.assign(win, initialSize(app));
      clampWin(win);
      win.placed = true;
    }
    if (app.anchor === 'bottom-right') {
      anchorApp(win, app);
      clampWin(win);
    }
    win.open = true;
    win.minimized = false;
    win.z = ++ztop;
    const el = winEls.get(id);
    el.style.display = 'flex';
    el.hidden = false;
    apply(win);
    if (!win.rendered) {
      renderBody(win, app);
    }
    focus(id);
    if (!silent) sfx.open();
    notifyWindowsChanged();
  }

  function closeApp(id) {
    const win = wins.get(id);
    if (!win || !win.open) return;
    if (win.teardown) {
      win.teardown();
      win.teardown = null;
      win.rendered = false;
    }
    win.open = false;
    win.minimized = false;
    const el = winEls.get(id);
    el.style.display = 'none';
    el.hidden = true;
    if (focused === id) {
      focused = null;
      if (opts.onFocus) opts.onFocus(focused);
    }
    sfx.close();
    notifyWindowsChanged();
  }

  function minimizeApp(id) {
    const win = wins.get(id);
    if (!win) return;
    win.minimized = true;
    win.open = false;
    winEls.get(id).style.display = 'none';
    if (focused === id) {
      focused = null;
      if (opts.onFocus) opts.onFocus(focused);
    }
    notifyWindowsChanged();
  }

  function toggleApp(id) {
    const win = wins.get(id);
    if (win && win.open && !win.minimized) {
      minimizeApp(id);
    } else {
      openApp(id);
    }
  }

  function focus(id) {
    const win = wins.get(id);
    if (!win) return;
    if (focused !== id) {
      focused = id;
      win.z = ++ztop;
      apply(win);
    }
    const el = winEls.get(id);
    el.hidden = false;
    // No re-insert here: remove+reinsert restarts the `winin` CSS animation on
    // every pointerdown (blink + swallowed clicks). Stacking is handled by the
    // z-index set in apply().
    if (document.activeElement !== el) el.focus({ preventScroll: true });
    if (opts.onFocus) opts.onFocus(id);
  }

  function getFocused() {
    if (!focused) return null;
    const win = wins.get(focused);
    return win && win.open ? win : null;
  }

  // --- viewport resize: re-clamp every open window ------------------------

  function reclampAll() {
    for (const win of wins.values()) {
      if (!win.open) continue;
      if (byId(win.id) && byId(win.id).anchor === 'bottom-right') anchorApp(win, byId(win.id));
      clampWin(win);
      apply(win);
    }
  }
  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(reclampAll, 100);
  }
  window.addEventListener('resize', onResize);

  // --- keyboard -----------------------------------------------------------

  function onKey(e) {
    const spot = opts.getSpotlight ? opts.getSpotlight() : null;

    if (e.key === 'Escape') {
      if (opts.notifications && opts.notifications.isOpen()) {
        opts.notifications.closePanel();
        e.preventDefault();
        return;
      }
      if (spot && spot.isOpen()) {
        spot.close();
        e.preventDefault();
        return;
      }
      const f = getFocused();
      if (f) closeApp(f.id);
      return;
    }

    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (spot) spot.toggle();
      return;
    }

    if (e.key === 'Tab') {
      const f = getFocused();
      if (!f) return;
      const el = winEls.get(f.id);
      if (!el.contains(document.activeElement)) return;
      const focusables = Array.from(
        el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((n) => !n.disabled && n.offsetParent !== null);
      if (!focusables.length) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }
  window.addEventListener('keydown', onKey);

  // --- notify dock of window changes ------

  function notifyWindowsChanged() {
    const openIds = new Set();
    for (const win of wins.values()) {
      if (win.open && !win.minimized) {
        openIds.add(win.id);
      }
    }
    if (opts.onWindowsChanged) {
      opts.onWindowsChanged(openIds);
    }
  }

  // --- api ----------------------------------------------------------------

  const api = {
    openApp,
    closeApp,
    minimizeApp,
    toggleApp,
    focusApp: focus,
    isOpen: (id) => {
      const win = wins.get(id);
      return !!(win && win.open && !win.minimized);
    },
    isAnyOpen: () => {
      for (const win of wins.values()) {
        if (win.open && !win.minimized) return true;
      }
      return false;
    },
    getFocused,
    getTitlebar(id) {
      const el = winEls.get(id);
      return el ? el.querySelector('.os-win-actions') : null;
    },
    setContent(content) {
      opts.content = content;
      // Force re-render on all windows
      for (const win of wins.values()) {
        win.rendered = false;
        if (win.open) renderBody(win, byId(win.id));
      }
    },
    destroy() {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      for (const el of winEls.values()) el.remove();
      winEls.clear();
      wins.clear();
    },
  };

  // Pre-build every window so the map exists up front (sizes clamped at build).
  for (const app of apps) buildWin(app);

  return api;
}

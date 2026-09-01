// wallpaper.js — canvas particle nebula (§6.8).
// 110 particles by default (range 0–240), toggleable off, honours
// prefers-reduced-motion (single static frame), pauses when the tab is hidden.
function hexToRgba(hex, a) {
  if (typeof hex !== 'string') return `rgba(122, 79, 184, ${a})`;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return `rgba(122, 79, 184, ${a})`;
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function initWallpaper(root, { count = 110 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'os-wallpaper';
  canvas.setAttribute('aria-hidden', 'true');
  root.insertBefore(canvas, root.firstChild);

  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n = Math.max(0, Math.min(240, count | 0));
  const particles = [];
  let running = false;
  let raf = 0;
  let w = 0;
  let h = 0;

  const css = () => getComputedStyle(document.documentElement);
  const colorA = () => css().getPropertyValue('--accent').trim() || '#7a4fb8';
  const colorB = () => css().getPropertyValue('--muted').trim() || '#6f6a78';

  function resize() {
    w = root.clientWidth || window.innerWidth;
    h = root.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  for (let i = 0; i < n; i++) {
    particles.push({
      x: Math.random() * Math.max(w, 1),
      y: Math.random() * Math.max(h, 1),
      r: 24 + Math.random() * 70,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.1,
      a: 0.03 + Math.random() * 0.06,
      tone: i % 2 === 0,
    });
  }

  function render() {
    ctx.clearRect(0, 0, w, h);
    const accent = colorA();
    const muted = colorB();
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -p.r) p.x = w + p.r; else if (p.x > w + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = h + p.r; else if (p.y > h + p.r) p.y = -p.r;
      ctx.beginPath();
      ctx.fillStyle = hexToRgba(p.tone ? accent : muted, p.a);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    if (!running) return;
    render();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    if (reduced) { render(); return; } // static frame only
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  const onVisibility = () => {
    if (document.hidden) stop();
    else if (!reduced) start();
  };
  document.addEventListener('visibilitychange', onVisibility);

  window.addEventListener('resize', resize);

  resize();
  start();

  return {
    setEnabled(on) {
      canvas.style.display = on ? '' : 'none';
      if (on) start();
      else stop();
    },
    destroy() {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.remove();
    },
  };
}

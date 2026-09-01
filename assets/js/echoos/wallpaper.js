// wallpaper.js — canvas nebula (§6.8), faithful to the prototype render
// (EchoOS.dc.html lines 756-797): starfield dots (r .8–2.3, hue 246–294),
// connecting lines within 90px, 3 drifting radial-gradient blobs. The `calm`
// factor eases the whole scene to 0.22 whenever any window is open (0.22 slow
// drift behind the desktop) and back to 1 when the desktop is clear. Default
// particle count 110 (0–240), honours prefers-reduced-motion (single static
// frame), pauses the RAF loop when the tab is hidden.
export function initWallpaper(root, { count = 110, isAnyOpen } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'os-wallpaper';
  canvas.setAttribute('aria-hidden', 'true');
  root.insertBefore(canvas, root.firstChild);

  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n = Math.max(0, Math.min(240, count | 0));
  let running = false;
  let raf = 0;
  let w = 0;
  let h = 0;
  let calm = 1;
  let last = 0;

  const isDark = () => document.documentElement.dataset.echoTheme === 'dark';

  function resize() {
    w = root.clientWidth || window.innerWidth;
    h = root.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Prototype particle: slow drift (vx/vy * dt * calm), dot r .8–2.3, hue 246–294.
  const particles = Array.from({ length: n }, () => ({
    x: Math.random() * Math.max(w, 1),
    y: Math.random() * Math.max(h, 1),
    vx: (Math.random() - 0.5) * 14,
    vy: (Math.random() - 0.5) * 14,
    r: 0.8 + Math.random() * 1.5,
    h: 246 + Math.random() * 48,
  }));
  // 3 drifting blobs, radius 180/270/360, each with its own orbit phase/speed.
  const blobs = Array.from({ length: 3 }, (_, i) => ({
    x: Math.random() * Math.max(w, 1),
    y: Math.random() * Math.max(h, 1),
    r: 180 + i * 90,
    a: Math.random() * 6.28,
    sp: 0.02 + Math.random() * 0.02,
  }));

  function render(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    const dark = isDark();
    const target = isAnyOpen && isAnyOpen() ? 0.22 : 1;
    calm += (target - calm) * dt * 2;

    ctx.clearRect(0, 0, w, h);

    // Blobs: orbit slightly while expanding a radial gradient, scaled by calm.
    for (const b of blobs) {
      b.a += b.sp * dt * calm * 8;
      const bx = b.x + Math.cos(b.a) * 40;
      const by = b.y + Math.sin(b.a * 0.7) * 30;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
      g.addColorStop(0, dark ? 'rgba(150,110,220,.10)' : 'rgba(122,79,184,.07)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(bx - b.r, by - b.r, b.r * 2, b.r * 2);
    }

    // Drift + wrap around the edges (prototype wraps at 0/W rather than by r).
    for (const p of particles) {
      p.x += p.vx * dt * calm;
      p.y += p.vy * dt * calm;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
    }

    // Connecting lines within 90px (d² < 8100), alpha fades with distance.
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 8100) {
          const al = (1 - d2 / 8100) * (dark ? 0.12 : 0.09);
          ctx.strokeStyle = `hsla(${(a.h + b.h) / 2},42%,${dark ? 70 : 38}%,${al})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Starfield dots.
    for (const p of particles) {
      ctx.fillStyle = `hsla(${p.h},46%,${dark ? 76 : 36}%,${dark ? 0.55 : 0.4})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fill();
    }
  }

  function loop(t) {
    if (!running) return;
    render(t);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    if (reduced) { render(0); return; } // static frame only
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

// base.js — build-time base path (IMPLEMENTATION-PLAN §6.1).
// Every URL in JS must go through url() so the site works under /portfolio-site/.
const el = document.getElementById('echoos-root');
export const base = el.dataset.base || '';
export const url = (p) => base + (p.startsWith('/') ? p : '/' + p);

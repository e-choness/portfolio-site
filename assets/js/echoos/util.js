// util.js — small helpers shared by the OS modules.

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Escape a value for HTML text or a quoted attribute; null/undefined → ''.
export function esc(s) {
  return s == null ? '' : String(s).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

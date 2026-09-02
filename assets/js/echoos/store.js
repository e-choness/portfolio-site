// store.js — tiny observable state + localStorage persistence (§6.3).
// Persisted keys are namespaced `echoos-*`. `echoos-hiscores` is owned by
// games.js and is deliberately never written here.

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, String(v)); } catch {} },
};

export function createStore(initial = {}) {
  let state = { ...initial };
  const subs = new Set();
  return {
    get: () => state,
    set(patch) {
      state = Object.assign({}, state, patch);
      subs.forEach((fn) => fn(state));
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export function persist(key, value) {
  ls.set('echoos-' + key, value);
  return value;
}

// OS-wide store. `aboutTab` is ephemeral UI state (not persisted); everything
// else below maps 1:1 to a localStorage key and is written on change.
export const store = createStore({
  theme: ls.get('echoos-theme') || 'light',
  sound: ls.get('echoos-sound') === 'off' ? 'off' : 'on',
  accent: ls.get('echoos-accent') || null,
  aboutTab: 'profile',
  visited: ls.get('echoos-visited') === '1',
  guideDone: ls.get('echoos-guide-done') === '1',
});

store.subscribe((s) => {
  persist('theme', s.theme);
  persist('sound', s.sound);
  persist('accent', s.accent || '');
  persist('visited', s.visited ? 1 : 0);
  persist('guide-done', s.guideDone ? 1 : 0);
});

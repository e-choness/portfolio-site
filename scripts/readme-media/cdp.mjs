// Minimal Chrome DevTools Protocol client for the README media scripts.
// Needs Node 20 with --experimental-websocket (the WebSocket global).

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export { sleep };

export async function connect(port = 9222) {
  let targets = [];
  for (let i = 0; i < 50 && !targets.length; i++) {
    try {
      targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).filter((t) => t.type === 'page');
    } catch { /* Chromium still starting */ }
    if (!targets.length) await sleep(200);
  }
  if (!targets.length) throw new Error('no Chromium page target');
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });

  let seq = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) rej(new Error(`${m.error.message} ${m.error.data || ''}`));
      else res(m.result);
    } else if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      errors.push(d.exception?.description || d.text);
    }
  });

  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });

  // Evaluate an expression in the page and return its (JSON) value.
  const js = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };

  // Poll until the expression is truthy; returns its value or throws.
  const until = async (expression, timeout = 15000) => {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const v = await js(expression).catch(() => null);
      if (v) return v;
      await sleep(100);
    }
    throw new Error(`timed out waiting for ${expression}`);
  };

  const key = async (key, { code, keyCode, text, modifiers = 0 } = {}) => {
    const base = { key, code: code || key, windowsVirtualKeyCode: keyCode || 0, modifiers };
    await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', text, ...base });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
  };

  // Types like a person: one key at a time.
  const type = async (text, delay = 85) => {
    for (const ch of text) {
      await key(ch, { text: ch });
      await sleep(delay);
    }
  };

  const mouse = async (x, y, type = 'mouseMoved') => {
    const press = type !== 'mouseMoved';
    await send('Input.dispatchMouseEvent', { type, x, y, button: press ? 'left' : 'none', buttons: type === 'mousePressed' ? 1 : 0, clickCount: press ? 1 : 0 });
  };

  // Centre of the first element matching the selector, in viewport pixels.
  const center = (selector) => until(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width && r.height ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null;
  })()`);

  return { ws, send, js, until, key, type, mouse, center, errors, close: () => ws.close() };
}

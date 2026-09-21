// games/common.js — the handful of helpers every game in this folder shares.

export const R = Math.random;

export function clear(ctx, W, H, T) {
  ctx.fillStyle = T.bg;
  ctx.fillRect(0, 0, W, H);
}

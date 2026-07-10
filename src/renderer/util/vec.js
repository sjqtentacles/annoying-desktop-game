export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (v, s) => ({ x: v.x * s, y: v.y * s })
export const len = (v) => Math.hypot(v.x, v.y)
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))
export const lerp = (a, b, t) => a + (b - a) * t

export function norm(v) {
  const l = len(v)
  return l === 0 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l }
}

export function limit(v, max) {
  const l = len(v)
  return l > max ? scale(v, max / l) : v
}

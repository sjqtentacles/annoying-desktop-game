// mulberry32 — tiny seedable PRNG, good enough for gremlin mischief
export function makeRng(seed) {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const range = (rng, min, max) => min + rng() * (max - min)
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)]
export const chance = (rng, p) => p > 0 && rng() < p

// entries: { kind: weight, ... } — returns a key, zero weights never picked
export function weightedPick(rng, entries) {
  const keys = Object.keys(entries)
  const total = keys.reduce((s, k) => s + entries[k], 0)
  let roll = rng() * total
  for (const k of keys) {
    roll -= entries[k]
    if (roll < 0 && entries[k] > 0) return k
  }
  return keys.findLast((k) => entries[k] > 0)
}

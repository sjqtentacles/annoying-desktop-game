// Decoy cursors: when a gremlin sits on the real cursor, a few fake cursors
// drift away from it. Not hittable — pure gaslighting.
import { range } from '../util/rng.js'

export const DECOY_CSS = `
.decoy-cursor {
  position: absolute;
  pointer-events: none;
  animation: decoy-drift var(--dur) ease-out forwards;
}
@keyframes decoy-drift {
  0% { opacity: 1; translate: 0 0; }
  80% { opacity: 1; }
  100% { opacity: 0; translate: var(--dx) var(--dy); }
}
`

// the classic arrow, white with black outline
const CURSOR_SVG = `
<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 2 L5 19 L9.5 15 L12.5 21.5 L15 20.5 L12 14 L18 14 Z"
        fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/>
</svg>`

export function spawnDecoys({ stage, rng, at }) {
  const n = 2 + Math.floor(range(rng, 0, 2))
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div')
    el.className = 'decoy-cursor'
    el.innerHTML = CURSOR_SVG
    el.style.left = `${at.x}px`
    el.style.top = `${at.y}px`
    const angle = range(rng, 0, Math.PI * 2)
    const d = range(rng, 120, 380)
    el.style.setProperty('--dx', `${Math.cos(angle) * d}px`)
    el.style.setProperty('--dy', `${Math.sin(angle) * d}px`)
    const dur = range(rng, 2.5, 5)
    el.style.setProperty('--dur', `${dur}s`)
    stage.appendChild(el)
    setTimeout(() => el.remove(), dur * 1000 + 100)
  }
}

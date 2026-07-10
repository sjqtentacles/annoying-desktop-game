// Score toast: pops where the gremlin died, floats up, fades. The only HUD —
// there is no menu, no health bar, no mercy.
export const HUD_CSS = `
.hud-toast {
  position: absolute;
  pointer-events: none;
  font: 700 18px system-ui, sans-serif;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,.7);
  animation: toast-rise 1.2s ease-out forwards;
  white-space: nowrap;
}
@keyframes toast-rise {
  0% { opacity: 0; translate: 0 0; scale: .6; }
  20% { opacity: 1; scale: 1.1; }
  100% { opacity: 0; translate: 0 -60px; scale: 1; }
}
`

export function createHud(stage) {
  return {
    toast(at, text) {
      const el = document.createElement('div')
      el.className = 'hud-toast'
      el.textContent = text
      el.style.left = `${at.x - 20}px`
      el.style.top = `${at.y - 30}px`
      stage.appendChild(el)
      setTimeout(() => el.remove(), 1300)
    },
  }
}

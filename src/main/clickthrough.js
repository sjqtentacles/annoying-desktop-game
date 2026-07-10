// Main-process owner of the window's ignore-mouse-events state. The renderer
// only reports sprite rects and hover hints; every actual flip happens here,
// driven by decide() against the polled cursor. The 100 ms poll is the safety
// net: if a gremlin dodges out from under a stationary cursor, the window
// must never stay click-blocking.
import { screen } from 'electron'
import { decide } from '../shared/clickthrough.js'

export function createClickthrough(win, { pollMs = 100 } = {}) {
  let rects = []
  let interactive = false
  let cursorOverride = null // test hook

  function evaluate() {
    if (win.isDestroyed()) return
    const cursor = cursorOverride ?? screen.getCursorScreenPoint()
    const b = win.getBounds()
    const local = { x: cursor.x - b.x, y: cursor.y - b.y }
    const d = decide(local, rects, interactive)
    if (!d.changed) return
    interactive = d.interactive
    if (interactive) {
      win.setIgnoreMouseEvents(false)
    } else {
      // forward is consumed per-call: must be re-passed on every re-enable
      win.setIgnoreMouseEvents(true, { forward: true })
    }
  }

  const timer = setInterval(evaluate, pollMs)
  win.on('closed', () => clearInterval(timer))

  return {
    setRects(next) {
      rects = Array.isArray(next) ? next : []
      evaluate()
    },
    hint: evaluate, // renderer saw a hover transition; re-decide immediately
    isInteractive: () => interactive,
    getRects: () => rects,
    setCursorOverride(pt) {
      cursorOverride = pt
      evaluate()
    },
  }
}

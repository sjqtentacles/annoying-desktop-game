// Fake in-overlay error dialogs: hittable, draggable, and closing one is
// giggled at — and sometimes punished with a fresh gremlin behind it.
import { makePopupSpec } from './popup-content.js'

const MAX_POPUPS = 3

export const POPUP_CSS = `
.popup {
  width: 340px;
  background: #ececec;
  border: 1px solid #999;
  border-radius: 8px;
  box-shadow: 0 12px 30px rgba(0,0,0,.4);
  font: 13px system-ui, sans-serif;
  color: #222;
  overflow: hidden;
}
.popup-title {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 10px;
  background: linear-gradient(#fafafa, #d9d9d9);
  border-bottom: 1px solid #bbb;
  font-weight: 600;
  cursor: grab;
}
.popup-x {
  border: none; background: #e0443e; color: #fff;
  width: 18px; height: 18px; border-radius: 50%;
  font-size: 11px; line-height: 1; cursor: pointer;
}
.popup-body { padding: 14px 12px; }
.popup-actions { padding: 0 12px 12px; text-align: right; }
.popup-actions button {
  font: inherit; padding: 4px 14px;
  border: 1px solid #888; border-radius: 5px;
  background: linear-gradient(#fff, #ddd); cursor: pointer;
}
`

export function createPopups({ stage, rng, bounds, emit, onSpawnGremlin }) {
  let count = 0

  function spawn() {
    if (count >= MAX_POPUPS) return
    count++
    const spec = makePopupSpec(rng, bounds())

    const el = document.createElement('div')
    el.className = 'popup hittable'
    el.style.left = `${spec.pos.x}px`
    el.style.top = `${spec.pos.y}px`

    const title = document.createElement('div')
    title.className = 'popup-title'
    const titleText = document.createElement('span')
    titleText.textContent = spec.title
    const x = document.createElement('button')
    x.className = 'popup-x'
    x.textContent = '✕'
    title.append(titleText, x)

    const body = document.createElement('div')
    body.className = 'popup-body'
    body.textContent = spec.body

    const actions = document.createElement('div')
    actions.className = 'popup-actions'
    const ok = document.createElement('button')
    ok.textContent = spec.buttonLabel
    actions.appendChild(ok)

    el.append(title, body, actions)
    stage.appendChild(el)

    function close() {
      count--
      const at = { x: el.offsetLeft + 170, y: el.offsetTop + 75 }
      el.remove()
      emit('popup') // giggle at the user for believing the close button
      if (spec.spawnGremlinOnClose) onSpawnGremlin(at)
    }
    x.addEventListener('click', close)
    ok.addEventListener('click', close)

    // draggable by title bar — it IS a window, after all
    title.addEventListener('mousedown', (e) => {
      if (e.target === x) return
      const grab = { x: e.clientX - el.offsetLeft, y: e.clientY - el.offsetTop }
      const move = (ev) => {
        el.style.left = `${ev.clientX - grab.x}px`
        el.style.top = `${ev.clientY - grab.y}px`
      }
      const up = () => {
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
      }
      document.addEventListener('mousemove', move)
      document.addEventListener('mouseup', up)
    })
  }

  return { spawn }
}

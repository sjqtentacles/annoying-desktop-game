import { startHitReporting } from './systems/hittest.js'
import { createDirector } from './systems/director.js'
import { createSpawner } from './systems/spawner.js'
import { createGremlinModel } from './gremlin/behaviors.js'
import { createSprite, SPRITE_CSS } from './gremlin/sprite.js'
import { makeRng, pick, range } from './util/rng.js'

const stage = document.getElementById('stage')
const style = document.createElement('style')
style.textContent = SPRITE_CSS
document.head.appendChild(style)

const rng = makeRng((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0)
const director = createDirector({ rng })

// last cursor position, delivered even while click-through via forward: true
let cursor = null
document.addEventListener('mousemove', (e) => {
  cursor = { x: e.clientX, y: e.clientY }
})

// event bus: behaviors emit, adapters (sound, score, spawning) subscribe
const listeners = new Set()
export const on = (fn) => listeners.add(fn)
const emit = (type, g) => listeners.forEach((fn) => fn(type, g))

const env = {
  cursor: () => cursor,
  bounds: () => ({ w: window.innerWidth, h: window.innerHeight }),
  params: () => director.params(),
  rng,
  emit,
}

const spawner = createSpawner({
  cap: () => director.params().maxGremlins,
  create: (opts) => {
    const model = createGremlinModel(env, opts)
    const sprite = createSprite(model, { onCatchAttempt: () => model.catchAttempt() })
    stage.appendChild(sprite.el)
    return { model, sprite }
  },
  destroy: (g) => g.sprite.el.remove(),
})

on((type, model) => {
  if (type === 'caught') director.recordCatch()
  if (type === 'multiply') {
    spawner.spawn({ at: { x: model.pos.x + range(rng, -40, 40), y: model.pos.y + range(rng, -40, 40) } })
  }
})

function randomGremlin() {
  const all = []
  spawner.forEach((g) => all.push(g))
  return all.length ? pick(rng, all) : null
}

function handleMischief(kind) {
  if (kind === 'popup') return // arrives with the popups module
  if (kind === 'multiply') return randomGremlin()?.model.command('multiply')
  randomGremlin()?.model.command(kind) // taunt | chase | screech
}

// --- control (tray) ---
let paused = false
window.gremlinNative.onControl((msg) => {
  if (msg.type === 'pause') {
    paused = msg.value
    director.setPaused(paused)
    document.body.classList.toggle('paused', paused)
  }
  if (msg.type === 'reset') {
    director.reset()
    spawner.clear()
  }
})

// --- game loop ---
let last = performance.now()
let respawnIn = 0
let statusIn = 0

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1) // clamp: sleep/lag must not warp physics
  last = now

  if (!paused) {
    for (const event of director.update(dt)) handleMischief(event.kind)

    const dead = []
    spawner.forEach((g) => {
      g.model.update(dt)
      if (g.model.dead) dead.push(g)
    })
    dead.forEach((g) => spawner.remove(g))

    // there is never zero gremlins for long — that would be merciful
    if (spawner.count() === 0) {
      respawnIn -= dt
      if (respawnIn <= 0) spawner.spawn()
    } else {
      respawnIn = range(rng, 1, 3)
    }
  }

  spawner.forEach((g) => g.sprite.sync())

  statusIn -= dt
  if (statusIn <= 0) {
    statusIn = 1
    window.gremlinNative.reportStatus?.({ level: director.level(), score: director.score() })
  }

  requestAnimationFrame(frame)
}

spawner.spawn()
startHitReporting()
requestAnimationFrame(frame)

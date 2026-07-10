import { startHitReporting } from './systems/hittest.js'
import { createDirector } from './systems/director.js'
import { createSpawner } from './systems/spawner.js'
import { createGremlinModel } from './gremlin/behaviors.js'
import { createSprite, SPRITE_CSS } from './gremlin/sprite.js'
import { createSound } from './systems/sound.js'
import { createPopups, POPUP_CSS } from './systems/popups.js'
import { spawnDecoys, DECOY_CSS } from './systems/decoys.js'
import { createHud, HUD_CSS } from './systems/hud.js'
import { makeRng, pick, range } from './util/rng.js'

const stage = document.getElementById('stage')
const style = document.createElement('style')
style.textContent = SPRITE_CSS + POPUP_CSS + DECOY_CSS + HUD_CSS
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
  // floor: a backgrounded/occluded page can briefly report a 0-sized
  // viewport, which would turn the clamp math inside out
  bounds: () => ({ w: Math.max(window.innerWidth, 320), h: Math.max(window.innerHeight, 240) }),
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

const sound = createSound(rng)
on((type) => sound.playForEvent(type))

const hud = createHud(stage)
const popups = createPopups({
  stage,
  rng,
  bounds: env.bounds,
  emit,
  onSpawnGremlin: (at) => spawner.spawn({ at }),
})

on((type, model) => {
  if (type === 'caught') {
    director.recordCatch()
    hud.toast(model.pos, `+1  (level ${director.level()})`)
  }
  if (type === 'multiply') {
    spawner.spawn({ at: { x: model.pos.x + range(rng, -40, 40), y: model.pos.y + range(rng, -40, 40) } })
  }
  if (type === 'sit') spawnDecoys({ stage, rng, at: model.pos })
})

function randomGremlin() {
  const all = []
  spawner.forEach((g) => all.push(g))
  return all.length ? pick(rng, all) : null
}

function handleMischief(kind) {
  if (kind === 'popup') return popups.spawn()
  randomGremlin()?.model.command(kind) // taunt | chase | screech | multiply
}

// --- control (tray) ---
let paused = false
window.gremlinNative.onControl((msg) => {
  if (msg.type === 'pause') {
    paused = msg.value
    director.setPaused(paused)
    document.body.classList.toggle('paused', paused)
  }
  if (msg.type === 'mute') sound.setMuted(msg.value)
  if (msg.type === 'reset') {
    director.reset()
    spawner.clear()
  }
})

// --- game loop ---
let last = performance.now()
let respawnIn = 0
let statusIn = 0

let usingFallbackClock = false

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

  if (!usingFallbackClock) requestAnimationFrame(frame)
}

// if rAF is ever throttled to death (occluded window, odd compositors),
// keep the gremlins alive on a plain timer instead
setInterval(() => {
  if (!usingFallbackClock && performance.now() - last > 1500) {
    usingFallbackClock = true
    last = performance.now()
    setInterval(() => frame(performance.now()), 33)
  }
}, 1000)

// first gremlin spawns from inside the loop (respawnIn starts at 0), which
// guarantees layout has real bounds by the time a spawn point is picked
startHitReporting()
requestAnimationFrame(frame)

// dev/demo console handle: __gremlinDebug.mischief('screech' | 'taunt' |
// 'chase' | 'multiply' | 'popup')
window.__gremlinDebug = {
  mischief: (kind) => handleMischief(kind),
  status: () => ({ level: director.level(), score: director.score(), gremlins: spawner.count() }),
}

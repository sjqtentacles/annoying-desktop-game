// Gremlin brain: a pure model (no DOM) driven by the generic FSM.
// env supplies everything effectful: cursor(), bounds(), params() (the
// director's current tuning row), rng, and emit(type, gremlin) for
// sounds/score/spawning. The sprite adapter mirrors pos/state to the DOM.
import { createFsm } from './fsm.js'
import { add, sub, scale, norm, dist, clamp } from '../util/vec.js'
import { range, chance } from '../util/rng.js'

const EDGE_MARGIN = 30 // half a sprite: keeps feet on screen

function moveToward(g, target, speed, dt) {
  g.vel = scale(norm(sub(target, g.pos)), speed)
  integrate(g, dt)
}

function moveAwayFrom(g, target, speed, dt) {
  const away = norm(sub(g.pos, target))
  g.vel = scale(away.x === 0 && away.y === 0 ? { x: 1, y: 0 } : away, speed)
  integrate(g, dt)
}

function integrate(g, dt) {
  const b = g.env.bounds()
  g.pos = add(g.pos, scale(g.vel, dt))
  // bounce off edges
  if (g.pos.x < EDGE_MARGIN || g.pos.x > b.w - EDGE_MARGIN) g.vel.x *= -1
  if (g.pos.y < EDGE_MARGIN || g.pos.y > b.h - EDGE_MARGIN) g.vel.y *= -1
  g.pos.x = clamp(g.pos.x, EDGE_MARGIN, b.w - EDGE_MARGIN)
  g.pos.y = clamp(g.pos.y, EDGE_MARGIN, b.h - EDGE_MARGIN)
  if (Math.abs(g.vel.x) > 1) g.facing = Math.sign(g.vel.x)
}

function cursorNearby(g) {
  const c = g.env.cursor()
  return c && dist(g.pos, c) < g.env.params().fleeRadius ? c : null
}

export function createGremlinModel(env, opts = {}) {
  const { rng } = env
  const b = env.bounds()

  const g = {
    env,
    pos: opts.at ? { ...opts.at } : edgeSpawnPoint(rng, b),
    vel: { x: 0, y: 0 },
    facing: 1,
    dead: false,
    fsm: null,
    update: (dt) => g.fsm.update(dt),
    catchAttempt() {
      if (g.dead || g.fsm.state === 'CAUGHT' || g.fsm.state === 'SPAWN') return
      g.fsm.transition(chance(rng, env.params().dodgeChance) ? 'DODGE' : 'CAUGHT')
    },
    command(kind) {
      if (g.dead || g.fsm.state === 'CAUGHT') return
      const map = { chase: 'CHASE_CURSOR', screech: 'SCREECH', taunt: 'TAUNT', multiply: 'MULTIPLY' }
      if (map[kind]) g.fsm.transition(map[kind])
    },
  }

  let until = 0 // per-state randomized duration
  const states = {
    SPAWN: {
      enter: () => env.emit('spawn', g),
      update: (_c, _dt, fsm) => (fsm.timeInState > 0.6 ? 'WANDER' : undefined),
    },
    IDLE: {
      enter: () => {
        g.vel = { x: 0, y: 0 }
        until = range(rng, 1, 3)
      },
      update: (_c, _dt, fsm) => {
        if (cursorNearby(g)) return 'FLEE'
        if (fsm.timeInState > until) return 'WANDER'
      },
    },
    WANDER: {
      enter: () => {
        until = range(rng, 2, 6)
        const angle = range(rng, 0, Math.PI * 2)
        const speed = env.params().speed * 0.4
        g.vel = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
      },
      update: (_c, dt, fsm) => {
        integrate(g, dt)
        if (cursorNearby(g)) return 'FLEE'
        if (fsm.timeInState > until) return 'IDLE'
      },
    },
    TAUNT: {
      enter: () => {
        g.vel = { x: 0, y: 0 }
        const c = env.cursor()
        if (c) g.facing = Math.sign(c.x - g.pos.x) || 1
        env.emit('taunt', g)
      },
      update: (_c, _dt, fsm) => (fsm.timeInState > 1.2 ? 'WANDER' : undefined),
    },
    CHASE_CURSOR: {
      update: (_c, dt, fsm) => {
        const c = env.cursor()
        if (!c || fsm.timeInState > 8) return 'WANDER'
        if (dist(g.pos, c) < 10) return 'SIT_ON_CURSOR'
        moveToward(g, c, env.params().speed, dt)
      },
    },
    SIT_ON_CURSOR: {
      enter: () => {
        g.vel = { x: 0, y: 0 }
        until = range(rng, 3, 8)
        env.emit('sit', g)
      },
      update: (_c, dt, fsm) => {
        const c = env.cursor()
        if (c) g.pos = { ...c } // glued to the cursor — you can't work like this
        if (fsm.timeInState > until) return 'FLEE'
      },
    },
    FLEE: {
      enter: () => {
        until = range(rng, 1.5, 4)
      },
      update: (_c, dt, fsm) => {
        const c = env.cursor()
        if (!c || fsm.timeInState > until) return 'WANDER'
        if (dist(g.pos, c) > g.env.params().fleeRadius * 2) return 'WANDER'
        moveAwayFrom(g, c, env.params().speed, dt)
      },
    },
    DODGE: {
      enter: () => {
        // teleport-hop out from under the click; near an edge a random angle
        // can clamp to a uselessly short hop, so fall back to hopping inward
        const b2 = env.bounds()
        const hop = range(rng, 80, 150)
        let target
        for (let tries = 0; tries < 4; tries++) {
          const angle = range(rng, 0, Math.PI * 2)
          target = {
            x: clamp(g.pos.x + Math.cos(angle) * hop, EDGE_MARGIN, b2.w - EDGE_MARGIN),
            y: clamp(g.pos.y + Math.sin(angle) * hop, EDGE_MARGIN, b2.h - EDGE_MARGIN),
          }
          if (dist(target, g.pos) >= 60) break
          target = null
        }
        if (!target) {
          const inward = norm(sub({ x: b2.w / 2, y: b2.h / 2 }, g.pos))
          target = add(g.pos, scale(inward, hop))
        }
        g.pos = target
        env.emit('dodge', g)
      },
      update: (_c, _dt, fsm) => (fsm.timeInState > 0.15 ? 'FLEE' : undefined),
    },
    SCREECH: {
      enter: () => {
        g.vel = { x: 0, y: 0 }
        env.emit('screech', g)
      },
      update: (_c, _dt, fsm) => (fsm.timeInState > 1.5 ? 'FLEE' : undefined),
    },
    MULTIPLY: {
      enter: () => {
        env.emit('multiply', g)
      },
      update: (_c, _dt, fsm) => (fsm.timeInState > 0.8 ? 'WANDER' : undefined),
    },
    CAUGHT: {
      enter: () => {
        g.vel = { x: 0, y: 0 }
        env.emit('caught', g)
      },
      update: (_c, _dt, fsm) => {
        if (fsm.timeInState > 0.5) g.dead = true
      },
    },
  }

  g.fsm = createFsm(states, 'SPAWN', g)
  return g
}

function edgeSpawnPoint(rng, b) {
  const side = Math.floor(range(rng, 0, 4))
  const x = range(rng, EDGE_MARGIN, b.w - EDGE_MARGIN)
  const y = range(rng, EDGE_MARGIN, b.h - EDGE_MARGIN)
  return [
    { x, y: EDGE_MARGIN }, // top
    { x, y: b.h - EDGE_MARGIN }, // bottom
    { x: EDGE_MARGIN, y }, // left
    { x: b.w - EDGE_MARGIN, y }, // right
  ][side]
}

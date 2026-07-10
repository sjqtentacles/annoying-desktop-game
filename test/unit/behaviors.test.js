import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGremlinModel } from '../../src/renderer/gremlin/behaviors.js'
import { makeRng } from '../../src/renderer/util/rng.js'
import { dist } from '../../src/renderer/util/vec.js'

const BOUNDS = { w: 1000, h: 800 }

function makeEnv(over = {}) {
  const emitted = []
  const params = {
    speed: 200,
    dodgeChance: 0,
    fleeRadius: 100,
    maxGremlins: 8,
    ...over.params,
  }
  return {
    emitted,
    cursor: over.cursor ?? (() => null),
    bounds: () => BOUNDS,
    params: () => params,
    rng: over.rng ?? makeRng(7),
    emit: (type, g) => emitted.push(type),
  }
}

function step(g, dt, total) {
  for (let t = 0; t < total; t += dt) g.update(dt)
}

test('spawns at a screen edge, then wanders', () => {
  const env = makeEnv()
  const g = createGremlinModel(env)
  assert.equal(g.fsm.state, 'SPAWN')
  const onEdge =
    g.pos.x < 60 || g.pos.x > BOUNDS.w - 60 || g.pos.y < 60 || g.pos.y > BOUNDS.h - 60
  assert.ok(onEdge, `spawn position ${JSON.stringify(g.pos)} should hug an edge`)
  step(g, 1 / 60, 1)
  assert.equal(g.fsm.state, 'WANDER')
})

test('wandering stays in bounds over a long walk', () => {
  const env = makeEnv()
  const g = createGremlinModel(env)
  step(g, 1 / 60, 30)
  assert.ok(g.pos.x >= 0 && g.pos.x <= BOUNDS.w, `x=${g.pos.x}`)
  assert.ok(g.pos.y >= 0 && g.pos.y <= BOUNDS.h, `y=${g.pos.y}`)
})

test('cursor closing within fleeRadius triggers FLEE, and fleeing increases distance', () => {
  const env = makeEnv()
  const g = createGremlinModel(env)
  step(g, 1 / 60, 1) // reach WANDER
  const cursor = { x: g.pos.x + 40, y: g.pos.y }
  env.cursor = () => cursor
  g.update(1 / 60)
  assert.equal(g.fsm.state, 'FLEE')
  const before = dist(g.pos, cursor)
  step(g, 1 / 60, 0.5)
  assert.ok(dist(g.pos, cursor) > before, 'should be running away')
})

test('catch attempt with dodgeChance=0 -> CAUGHT, emits, dies after squish', () => {
  const env = makeEnv()
  const g = createGremlinModel(env)
  step(g, 1 / 60, 1)
  g.catchAttempt()
  assert.equal(g.fsm.state, 'CAUGHT')
  assert.ok(env.emitted.includes('caught'))
  assert.equal(g.dead, false)
  step(g, 1 / 60, 0.6)
  assert.equal(g.dead, true)
})

test('catch attempt with dodgeChance=1 -> DODGE teleport-hop, then FLEE', () => {
  const env = makeEnv({ params: { dodgeChance: 1 } })
  const g = createGremlinModel(env)
  step(g, 1 / 60, 1)
  const before = { ...g.pos }
  env.cursor = () => before // a catch attempt means the cursor is on the gremlin
  g.catchAttempt()
  assert.equal(g.fsm.state, 'DODGE')
  assert.ok(env.emitted.includes('dodge'))
  const hop = dist(before, g.pos)
  assert.ok(hop >= 60, `dodge should teleport a real distance, got ${hop}`)
  step(g, 1 / 60, 0.3)
  assert.equal(g.fsm.state, 'FLEE')
})

test('caught gremlins ignore further catch attempts', () => {
  const env = makeEnv()
  const g = createGremlinModel(env)
  step(g, 1 / 60, 1)
  g.catchAttempt()
  const emittedOnce = env.emitted.filter((t) => t === 'caught').length
  g.catchAttempt()
  assert.equal(env.emitted.filter((t) => t === 'caught').length, emittedOnce)
})

test('command(chase) seeks the cursor, reaches it, sits on it', () => {
  const cursor = { x: 500, y: 400 }
  const env = makeEnv({ cursor: () => cursor })
  const g = createGremlinModel(env)
  step(g, 1 / 60, 1)
  g.command('chase')
  assert.equal(g.fsm.state, 'CHASE_CURSOR')
  const before = dist(g.pos, cursor)
  step(g, 1 / 60, 0.5)
  assert.ok(dist(g.pos, cursor) < before, 'should be closing in')
  // run until it reaches the cursor and sits (sit duration is randomized,
  // so assert the moment it happens rather than at a fixed time)
  let sat = false
  for (let t = 0; t < 10 && !sat; t += 1 / 60) {
    g.update(1 / 60)
    sat = g.fsm.state === 'SIT_ON_CURSOR'
  }
  assert.ok(sat, 'should reach the cursor and sit on it')
  assert.ok(dist(g.pos, cursor) < 30, 'sits on the cursor')
  assert.ok(env.emitted.includes('sit'))
})

test('sitting gremlin eventually gets bored and flees', () => {
  const cursor = { x: 500, y: 400 }
  const env = makeEnv({ cursor: () => cursor })
  const g = createGremlinModel(env)
  step(g, 1 / 60, 1)
  g.command('chase')
  step(g, 1 / 60, 20) // reach + max sit duration
  assert.notEqual(g.fsm.state, 'SIT_ON_CURSOR')
})

test('command(screech) emits screech and returns to normal life', () => {
  const env = makeEnv()
  const g = createGremlinModel(env)
  step(g, 1 / 60, 1)
  g.command('screech')
  assert.equal(g.fsm.state, 'SCREECH')
  assert.ok(env.emitted.includes('screech'))
  step(g, 1 / 60, 3)
  assert.notEqual(g.fsm.state, 'SCREECH')
})

test('command(taunt) faces the cursor and emits taunt', () => {
  const env = makeEnv({ cursor: () => ({ x: 0, y: 0 }) })
  const g = createGremlinModel(env)
  step(g, 1 / 60, 1)
  g.command('taunt')
  assert.equal(g.fsm.state, 'TAUNT')
  assert.ok(env.emitted.includes('taunt'))
})

test('command(multiply) emits multiply exactly once per command', () => {
  const env = makeEnv()
  const g = createGremlinModel(env)
  step(g, 1 / 60, 1)
  g.command('multiply')
  step(g, 1 / 60, 2)
  assert.equal(env.emitted.filter((t) => t === 'multiply').length, 1)
})

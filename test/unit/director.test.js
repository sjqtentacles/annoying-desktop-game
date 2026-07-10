import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDirector, LEVELS } from '../../src/renderer/systems/director.js'

// rng stub: always returns a fixed value (0.5 -> no jitter surprises)
const flatRng = () => 0.5

test('starts at level 1 with level-1 params', () => {
  const d = createDirector({ rng: flatRng })
  assert.equal(d.level(), 1)
  assert.equal(d.params().maxGremlins, LEVELS[0].maxGremlins)
})

test('escalates by elapsed time crossing thresholds', () => {
  const d = createDirector({ rng: flatRng })
  // LEVELS[1].at is in escalation points; 1 point per elapsed minute
  d.update(LEVELS[1].at * 60 + 1)
  assert.ok(d.level() >= 2, `expected >=2, got ${d.level()}`)
})

test('catches feed escalation (0.5 points each)', () => {
  const d = createDirector({ rng: flatRng })
  const need = Math.ceil(LEVELS[1].at / 0.5)
  for (let i = 0; i < need; i++) d.recordCatch()
  assert.ok(d.level() >= 2)
})

test('params ramp with level: speed and cap increase, dodge appears', () => {
  const d = createDirector({ rng: flatRng })
  const before = d.params()
  d.update(LEVELS[4].at * 60 + 1) // jump to max level
  const after = d.params()
  assert.equal(d.level(), 5)
  assert.ok(after.speed > before.speed)
  assert.ok(after.maxGremlins > before.maxGremlins)
  assert.ok(after.dodgeChance > before.dodgeChance)
})

test('mischief fires after the interval and returns an event', () => {
  const d = createDirector({ rng: flatRng })
  const interval = d.params().mischiefInterval
  const events = []
  // step in 1s ticks until just past the interval (flat rng -> jitter factor 1.0)
  for (let t = 0; t < interval + 2; t++) events.push(...d.update(1))
  const mischief = events.filter((e) => e.type === 'mischief')
  assert.equal(mischief.length, 1)
  assert.ok(typeof mischief[0].kind === 'string')
})

test('recordCatch grants a calm window: no mischief during it', () => {
  const d = createDirector({ rng: flatRng })
  const interval = d.params().mischiefInterval
  // ripen the ticker to just below firing, then catch
  d.update(interval - 0.5)
  d.recordCatch()
  const events = d.update(1) // inside calm window; would have fired otherwise
  assert.deepEqual(events.filter((e) => e.type === 'mischief'), [])
})

test('pause freezes escalation and mischief', () => {
  const d = createDirector({ rng: flatRng })
  d.setPaused(true)
  const events = d.update(LEVELS[4].at * 60 + 999)
  assert.deepEqual(events, [])
  assert.equal(d.level(), 1)
  d.setPaused(false)
})

test('reset returns to level 1, zero score', () => {
  const d = createDirector({ rng: flatRng })
  d.update(LEVELS[4].at * 60 + 1)
  d.recordCatch()
  d.reset()
  assert.equal(d.level(), 1)
  assert.equal(d.score(), 0)
})

test('score counts catches', () => {
  const d = createDirector({ rng: flatRng })
  d.recordCatch()
  d.recordCatch()
  assert.equal(d.score(), 2)
})

test('mischief kind respects weights: zero-weight kinds never fire', () => {
  // rng that cycles through many values to exercise weightedPick
  let i = 0
  const seq = () => (i = (i + 0.137) % 1)
  const d = createDirector({ rng: seq, weights: { taunt: 0, chase: 0, screech: 1, multiply: 0, popup: 0 } })
  const kinds = new Set()
  for (let round = 0; round < 20; round++) {
    for (let t = 0; t < 200; t++) {
      for (const e of d.update(1)) if (e.type === 'mischief') kinds.add(e.kind)
    }
  }
  assert.deepEqual([...kinds], ['screech'])
})

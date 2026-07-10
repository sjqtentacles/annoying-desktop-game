import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makePopupSpec, TITLES, BODIES } from '../../src/renderer/systems/popup-content.js'
import { makeRng } from '../../src/renderer/util/rng.js'

const BOUNDS = { w: 1200, h: 800 }

test('spec has non-empty content drawn from the pools', () => {
  const rng = makeRng(11)
  for (let i = 0; i < 50; i++) {
    const s = makePopupSpec(rng, BOUNDS)
    assert.ok(TITLES.includes(s.title))
    assert.ok(BODIES.includes(s.body))
    assert.ok(s.buttonLabel.length > 0)
    assert.equal(typeof s.spawnGremlinOnClose, 'boolean')
  }
})

test('popup lands fully on screen', () => {
  const rng = makeRng(12)
  for (let i = 0; i < 200; i++) {
    const s = makePopupSpec(rng, BOUNDS)
    assert.ok(s.pos.x >= 0 && s.pos.x + s.size.w <= BOUNDS.w, `x=${s.pos.x}`)
    assert.ok(s.pos.y >= 0 && s.pos.y + s.size.h <= BOUNDS.h, `y=${s.pos.y}`)
  }
})

test('close button sometimes spawns a gremlin, but not always', () => {
  const rng = makeRng(13)
  const results = new Set()
  for (let i = 0; i < 100; i++) results.add(makePopupSpec(rng, BOUNDS).spawnGremlinOnClose)
  assert.deepEqual([...results].sort(), [false, true])
})

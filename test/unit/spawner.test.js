import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSpawner } from '../../src/renderer/systems/spawner.js'

function stubFactory() {
  const made = []
  const destroyed = []
  return {
    made,
    destroyed,
    create: (opts) => {
      const g = { id: made.length, opts }
      made.push(g)
      return g
    },
    destroy: (g) => destroyed.push(g),
  }
}

test('spawn creates entities up to the cap and no further', () => {
  const f = stubFactory()
  const s = createSpawner({ create: f.create, destroy: f.destroy, cap: () => 3 })
  assert.ok(s.spawn())
  assert.ok(s.spawn())
  assert.ok(s.spawn())
  assert.equal(s.spawn(), null) // cap hit
  assert.equal(s.count(), 3)
  assert.equal(f.made.length, 3)
})

test('cap is dynamic (function), rises with escalation', () => {
  const f = stubFactory()
  let cap = 1
  const s = createSpawner({ create: f.create, destroy: f.destroy, cap: () => cap })
  assert.ok(s.spawn())
  assert.equal(s.spawn(), null)
  cap = 2
  assert.ok(s.spawn())
  assert.equal(s.count(), 2)
})

test('remove destroys and frees a slot', () => {
  const f = stubFactory()
  const s = createSpawner({ create: f.create, destroy: f.destroy, cap: () => 1 })
  const g = s.spawn()
  s.remove(g)
  assert.deepEqual(f.destroyed, [g])
  assert.equal(s.count(), 0)
  assert.ok(s.spawn()) // slot freed
})

test('spawn passes options through to the factory', () => {
  const f = stubFactory()
  const s = createSpawner({ create: f.create, destroy: f.destroy, cap: () => 5 })
  s.spawn({ near: { x: 5, y: 6 } })
  assert.deepEqual(f.made[0].opts, { near: { x: 5, y: 6 } })
})

test('forEach iterates live entities only', () => {
  const f = stubFactory()
  const s = createSpawner({ create: f.create, destroy: f.destroy, cap: () => 5 })
  const a = s.spawn()
  const b = s.spawn()
  s.remove(a)
  const seen = []
  s.forEach((g) => seen.push(g))
  assert.deepEqual(seen, [b])
})

test('clear removes everything', () => {
  const f = stubFactory()
  const s = createSpawner({ create: f.create, destroy: f.destroy, cap: () => 5 })
  s.spawn(); s.spawn()
  s.clear()
  assert.equal(s.count(), 0)
  assert.equal(f.destroyed.length, 2)
})

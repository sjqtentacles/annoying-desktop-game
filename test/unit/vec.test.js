import { test } from 'node:test'
import assert from 'node:assert/strict'
import { add, sub, scale, len, norm, dist, clamp, lerp, limit } from '../../src/renderer/util/vec.js'

test('add/sub/scale are componentwise', () => {
  assert.deepEqual(add({ x: 1, y: 2 }, { x: 3, y: -1 }), { x: 4, y: 1 })
  assert.deepEqual(sub({ x: 1, y: 2 }, { x: 3, y: -1 }), { x: -2, y: 3 })
  assert.deepEqual(scale({ x: 2, y: -3 }, 2), { x: 4, y: -6 })
})

test('len and dist', () => {
  assert.equal(len({ x: 3, y: 4 }), 5)
  assert.equal(dist({ x: 1, y: 1 }, { x: 4, y: 5 }), 5)
})

test('norm returns unit vector, zero vector stays zero', () => {
  const n = norm({ x: 10, y: 0 })
  assert.deepEqual(n, { x: 1, y: 0 })
  assert.deepEqual(norm({ x: 0, y: 0 }), { x: 0, y: 0 })
})

test('clamp and lerp', () => {
  assert.equal(clamp(5, 0, 3), 3)
  assert.equal(clamp(-1, 0, 3), 0)
  assert.equal(clamp(2, 0, 3), 2)
  assert.equal(lerp(0, 10, 0.25), 2.5)
})

test('limit caps vector magnitude, leaves short vectors alone', () => {
  const v = limit({ x: 30, y: 40 }, 5)
  assert.ok(Math.abs(len(v) - 5) < 1e-9)
  assert.deepEqual(limit({ x: 1, y: 0 }, 5), { x: 1, y: 0 })
})

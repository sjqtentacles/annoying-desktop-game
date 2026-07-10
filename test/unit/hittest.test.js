import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pointInRect, anyRectContains } from '../../src/shared/hittest.js'

test('pointInRect basic containment and edges', () => {
  const r = { x: 10, y: 10, w: 20, h: 20 }
  assert.equal(pointInRect({ x: 15, y: 15 }, r), true)
  assert.equal(pointInRect({ x: 10, y: 10 }, r), true) // top-left edge inclusive
  assert.equal(pointInRect({ x: 30, y: 30 }, r), true) // bottom-right edge inclusive
  assert.equal(pointInRect({ x: 31, y: 15 }, r), false)
  assert.equal(pointInRect({ x: 9, y: 15 }, r), false)
})

test('pointInRect with padding expands the rect', () => {
  const r = { x: 10, y: 10, w: 10, h: 10 }
  assert.equal(pointInRect({ x: 8, y: 8 }, r, 3), true)
  assert.equal(pointInRect({ x: 5, y: 5 }, r, 3), false)
})

test('anyRectContains over a list, empty list never contains', () => {
  const rects = [
    { x: 0, y: 0, w: 5, h: 5 },
    { x: 100, y: 100, w: 5, h: 5 },
  ]
  assert.equal(anyRectContains(rects, { x: 102, y: 103 }), true)
  assert.equal(anyRectContains(rects, { x: 50, y: 50 }), false)
  assert.equal(anyRectContains([], { x: 0, y: 0 }), false)
})

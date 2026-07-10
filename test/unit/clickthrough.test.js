import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decide } from '../../src/shared/clickthrough.js'

const rect = { x: 100, y: 100, w: 50, h: 50 }

test('cursor over a sprite -> interactive', () => {
  const d = decide({ x: 120, y: 120 }, [rect], false)
  assert.equal(d.interactive, true)
})

test('cursor outside all sprites -> click-through', () => {
  const d = decide({ x: 10, y: 10 }, [rect], true)
  assert.equal(d.interactive, false)
})

test('safety net: sprite teleports away while cursor stationary -> forced back to click-through', () => {
  // window is currently interactive, but the rect list no longer contains the cursor
  const d = decide({ x: 120, y: 120 }, [{ x: 500, y: 500, w: 50, h: 50 }], true)
  assert.equal(d.interactive, false)
})

test('empty rect list is always click-through', () => {
  assert.equal(decide({ x: 0, y: 0 }, [], true).interactive, false)
  assert.equal(decide({ x: 0, y: 0 }, [], false).interactive, false)
})

test('missing/null cursor (e.g. before first poll) stays click-through', () => {
  assert.equal(decide(null, [rect], true).interactive, false)
})

test('changed reports whether a flip is needed', () => {
  assert.equal(decide({ x: 120, y: 120 }, [rect], true).changed, false)
  assert.equal(decide({ x: 120, y: 120 }, [rect], false).changed, true)
  assert.equal(decide({ x: 0, y: 0 }, [rect], false).changed, false)
})

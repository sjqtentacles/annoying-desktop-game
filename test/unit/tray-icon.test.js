import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIconBitmaps, ART } from '../../src/main/tray-icon.js'

test('art map is a well-formed 16x16 grid', () => {
  assert.equal(ART.length, 16)
  for (const row of ART) assert.equal(row.length, 16)
})

test('bitmaps come in 1x (16px) and 2x (32px), BGRA-sized', () => {
  const [one, two] = buildIconBitmaps()
  assert.equal(one.width, 16)
  assert.equal(one.buffer.length, 16 * 16 * 4)
  assert.equal(two.width, 32)
  assert.equal(two.buffer.length, 32 * 32 * 4)
})

test('icon has both opaque and transparent pixels, opaque ones are pure black (mac template rule)', () => {
  const [{ buffer }] = buildIconBitmaps()
  let opaque = 0
  let transparent = 0
  for (let i = 0; i < buffer.length; i += 4) {
    const [b, g, r, a] = [buffer[i], buffer[i + 1], buffer[i + 2], buffer[i + 3]]
    if (a === 255) {
      opaque++
      assert.deepEqual([b, g, r], [0, 0, 0], 'template images must be black + alpha only')
    } else {
      transparent++
      assert.equal(a, 0)
    }
  }
  assert.ok(opaque > 20, 'gremlin face should be visible')
  assert.ok(transparent > 20, 'icon should not be a solid block')
})

test('2x bitmap is an exact pixel-doubling of 1x', () => {
  const [one, two] = buildIconBitmaps()
  const px = (buf, w, x, y) => buf[(y * w + x) * 4 + 3] // alpha channel
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      assert.equal(px(two.buffer, 32, x * 2, y * 2), px(one.buffer, 16, x, y))
      assert.equal(px(two.buffer, 32, x * 2 + 1, y * 2 + 1), px(one.buffer, 16, x, y))
    }
  }
})

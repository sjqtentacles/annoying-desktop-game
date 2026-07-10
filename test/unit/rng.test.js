import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRng, range, pick, chance, weightedPick } from '../../src/renderer/util/rng.js'

test('same seed gives same sequence, different seed differs', () => {
  const a = makeRng(42)
  const b = makeRng(42)
  const c = makeRng(43)
  const seqA = [a(), a(), a()]
  const seqB = [b(), b(), b()]
  assert.deepEqual(seqA, seqB)
  assert.notDeepEqual(seqA, [c(), c(), c()])
})

test('rng output stays in [0, 1)', () => {
  const r = makeRng(7)
  for (let i = 0; i < 1000; i++) {
    const v = r()
    assert.ok(v >= 0 && v < 1)
  }
})

test('range maps into [min, max)', () => {
  const r = makeRng(1)
  for (let i = 0; i < 100; i++) {
    const v = range(r, 10, 20)
    assert.ok(v >= 10 && v < 20)
  }
})

test('pick returns an element of the array', () => {
  const r = makeRng(1)
  const arr = ['a', 'b', 'c']
  for (let i = 0; i < 50; i++) assert.ok(arr.includes(pick(r, arr)))
})

test('chance respects extremes', () => {
  const r = makeRng(1)
  assert.equal(chance(r, 1), true)
  assert.equal(chance(r, 0), false)
})

test('weightedPick honors weights (zero weight never picked)', () => {
  const r = makeRng(5)
  const entries = { never: 0, always: 10 }
  for (let i = 0; i < 100; i++) assert.equal(weightedPick(r, entries), 'always')
})

test('weightedPick distributes roughly by weight', () => {
  const r = makeRng(9)
  const counts = { a: 0, b: 0 }
  for (let i = 0; i < 2000; i++) counts[weightedPick(r, { a: 3, b: 1 })]++
  assert.ok(counts.a > counts.b * 2, `expected a >> b, got ${counts.a}:${counts.b}`)
})

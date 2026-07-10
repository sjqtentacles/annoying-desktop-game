import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RECIPES, SOUND_FOR_EVENT, MASTER_GAIN } from '../../src/renderer/systems/sound-recipes.js'
import { makeRng } from '../../src/renderer/util/rng.js'

test('every gremlin event that makes noise maps to an existing recipe', () => {
  for (const [event, recipe] of Object.entries(SOUND_FOR_EVENT)) {
    assert.ok(RECIPES[recipe], `event "${event}" maps to missing recipe "${recipe}"`)
  }
  // the loud ones must be covered
  for (const event of ['screech', 'caught', 'dodge', 'taunt', 'spawn', 'multiply', 'sit']) {
    assert.ok(SOUND_FOR_EVENT[event], `no sound for "${event}"`)
  }
})

test('recipes produce sane, headphone-safe voices', () => {
  const rng = makeRng(3)
  for (const [name, build] of Object.entries(RECIPES)) {
    for (let i = 0; i < 20; i++) {
      const { voices } = build(rng)
      assert.ok(voices.length > 0, `${name} produced no voices`)
      for (const v of voices) {
        assert.ok(v.dur > 0 && v.dur <= 2, `${name}: dur ${v.dur}`)
        assert.ok(v.gain > 0 && v.gain <= 0.5, `${name}: voice gain ${v.gain} too hot`)
        assert.ok((v.delay ?? 0) >= 0, `${name}: negative delay`)
        if (v.type === 'osc') {
          for (const f of [v.freqStart, v.freqEnd]) {
            assert.ok(f >= 30 && f <= 9000, `${name}: freq ${f} outside sane range`)
          }
          assert.ok(['sine', 'square', 'sawtooth', 'triangle'].includes(v.wave))
        } else {
          assert.equal(v.type, 'noise')
        }
      }
    }
  }
})

test('master gain is capped for prank ethics', () => {
  assert.ok(MASTER_GAIN <= 0.4)
})

test('recipes vary run-to-run (rng is actually used)', () => {
  const rng = makeRng(3)
  const a = JSON.stringify(RECIPES.giggle(rng))
  const b = JSON.stringify(RECIPES.giggle(rng))
  assert.notEqual(a, b, 'giggle should never be the same twice')
})

// The director is the mean one — gremlins are dumb. It tracks escalation
// (1 point per elapsed minute + 0.5 per catch), maps it to a tuning row,
// and fires mischief events on a jittered ticker. Pure: rng injected,
// advanced only by update(dt).
import { range, weightedPick } from '../util/rng.js'

// at = escalation points needed to reach this level
export const LEVELS = [
  { at: 0,  maxGremlins: 1, speed: 120, dodgeChance: 0.00, fleeRadius: 60,  mischiefInterval: 45 },
  { at: 2,  maxGremlins: 2, speed: 180, dodgeChance: 0.15, fleeRadius: 100, mischiefInterval: 32 },
  { at: 5,  maxGremlins: 4, speed: 250, dodgeChance: 0.30, fleeRadius: 140, mischiefInterval: 22 },
  { at: 9,  maxGremlins: 6, speed: 330, dodgeChance: 0.45, fleeRadius: 180, mischiefInterval: 15 },
  { at: 14, maxGremlins: 8, speed: 420, dodgeChance: 0.55, fleeRadius: 220, mischiefInterval: 10 },
]

const DEFAULT_WEIGHTS = { taunt: 3, chase: 3, screech: 2, multiply: 2, popup: 2 }
const CALM_AFTER_CATCH = 2 // seconds of mercy per catch — savor it

export function createDirector({ rng, weights = DEFAULT_WEIGHTS }) {
  let elapsed = 0 // seconds
  let catches = 0
  let paused = false
  let mischiefClock = 0
  let nextMischiefAt = jitteredInterval(levelRow())
  let calmUntil = -1

  function points() {
    return elapsed / 60 + catches * 0.5
  }
  function levelIndex() {
    const p = points()
    let i = 0
    for (let l = 0; l < LEVELS.length; l++) if (p >= LEVELS[l].at) i = l
    return i
  }
  function levelRow() {
    return LEVELS[levelIndex()]
  }
  function jitteredInterval(row) {
    return row.mischiefInterval * range(rng, 0.6, 1.4)
  }

  return {
    level: () => levelIndex() + 1,
    params: () => levelRow(),
    score: () => catches,
    setPaused(p) {
      paused = p
    },
    recordCatch() {
      catches++
      calmUntil = elapsed + CALM_AFTER_CATCH
    },
    reset() {
      elapsed = 0
      catches = 0
      mischiefClock = 0
      calmUntil = -1
      nextMischiefAt = jitteredInterval(levelRow())
    },
    update(dt) {
      if (paused) return []
      elapsed += dt
      mischiefClock += dt
      const events = []
      if (mischiefClock >= nextMischiefAt && elapsed >= calmUntil) {
        mischiefClock = 0
        nextMischiefAt = jitteredInterval(levelRow())
        events.push({ type: 'mischief', kind: weightedPick(rng, weights) })
      }
      return events
    },
  }
}

// Sound design as data: each recipe builds a list of voices from the rng so
// no two screeches are alike. Pure — the WebAudio adapter (sound.js)
// interprets voices; tests keep every number headphone-safe.
import { range } from '../util/rng.js'

export const MASTER_GAIN = 0.35

export const SOUND_FOR_EVENT = {
  spawn: 'pop',
  caught: 'squish',
  dodge: 'giggle',
  taunt: 'raspberry',
  screech: 'screech',
  sit: 'giggle',
  multiply: 'bubble',
  popup: 'bubble',
}

export const RECIPES = {
  // the signature horror: sawtooth with a random-walk pitch wobble
  screech(rng) {
    const base = range(rng, 900, 1600)
    const voices = []
    let f = base
    const segs = 6
    for (let i = 0; i < segs; i++) {
      const next = f * range(rng, 0.75, 1.35)
      voices.push({
        type: 'osc',
        wave: 'sawtooth',
        freqStart: Math.min(f, 8000),
        freqEnd: Math.min(next, 8000),
        delay: i * 0.09,
        dur: 0.11,
        gain: 0.3,
      })
      f = next
    }
    voices.push({ type: 'noise', filter: { type: 'highpass', freq: 2500 }, dur: segs * 0.09, gain: 0.12 })
    return { voices }
  },

  // rapid sine chirps with exponential pitch decay
  giggle(rng) {
    const n = 3 + Math.floor(range(rng, 0, 3))
    const voices = []
    for (let i = 0; i < n; i++) {
      const f = range(rng, 700, 1200) * (1 + i * 0.12)
      voices.push({
        type: 'osc',
        wave: 'sine',
        freqStart: f * 1.4,
        freqEnd: f * 0.8,
        delay: i * range(rng, 0.07, 0.11),
        dur: 0.08,
        gain: 0.25,
      })
    }
    return { voices }
  },

  // filtered noise burst + pitch-dropping sine: something soft hit the floor
  squish(rng) {
    return {
      voices: [
        { type: 'noise', filter: { type: 'lowpass', freq: range(rng, 500, 900) }, dur: 0.18, gain: 0.35 },
        { type: 'osc', wave: 'sine', freqStart: range(rng, 300, 420), freqEnd: 60, dur: 0.3, gain: 0.35 },
      ],
    }
  },

  pop(rng) {
    return {
      voices: [
        { type: 'osc', wave: 'sine', freqStart: range(rng, 250, 350), freqEnd: range(rng, 700, 900), dur: 0.12, gain: 0.3 },
      ],
    }
  },

  bubble(rng) {
    const voices = []
    for (let i = 0; i < 3; i++) {
      voices.push({
        type: 'osc',
        wave: 'triangle',
        freqStart: range(rng, 200, 300) * (i + 1),
        freqEnd: range(rng, 500, 700) * (i + 1) * 0.8,
        delay: i * 0.06,
        dur: 0.09,
        gain: 0.22,
      })
    }
    return { voices }
  },

  // low square wobble under a noise burst — deeply disrespectful
  raspberry(rng) {
    const f = range(rng, 70, 110)
    return {
      voices: [
        { type: 'osc', wave: 'square', freqStart: f, freqEnd: f * range(rng, 0.8, 0.95), dur: 0.45, gain: 0.22 },
        { type: 'noise', filter: { type: 'bandpass', freq: range(rng, 300, 500) }, dur: 0.45, gain: 0.18 },
      ],
    }
  },
}

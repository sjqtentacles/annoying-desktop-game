// Fake error-dialog copy. Pure: rng + bounds in, spec out.
import { pick, range, chance } from '../util/rng.js'

export const TITLES = [
  'System Alert',
  'Gremlin.exe is not responding',
  'Critical Gremlin Update',
  'Warning: Gremlin Detected',
  'Totally Real Error',
  'Windows Defender (real)',
  'Achievement Unlocked?',
]

export const BODIES = [
  'A gremlin has accessed your files. It was not impressed.',
  'Your mouse has been assigned to someone more deserving.',
  'This dialog is important and definitely not a distraction.',
  'Gremlin has rated your productivity: ★☆☆☆☆',
  'An update is required to continue being annoyed.',
  'Error 0x6R3ML1N: too much work detected, deploying countermeasures.',
  'Closing this window will accomplish nothing.',
]

const BUTTONS = ['OK', 'Accept Fate', 'Dismiss (lol)', 'Make it stop', 'Fine.']

const SIZE = { w: 340, h: 150 }

export function makePopupSpec(rng, bounds) {
  return {
    title: pick(rng, TITLES),
    body: pick(rng, BODIES),
    buttonLabel: pick(rng, BUTTONS),
    spawnGremlinOnClose: chance(rng, 0.35),
    size: { ...SIZE },
    pos: {
      x: Math.floor(range(rng, 0, Math.max(1, bounds.w - SIZE.w))),
      y: Math.floor(range(rng, 0, Math.max(1, bounds.h - SIZE.h))),
    },
  }
}

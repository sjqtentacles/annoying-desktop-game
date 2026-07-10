// Walking-skeleton e2e: launches the real Electron app (headed) and verifies
// the load-bearing overlay mechanics via main-process test hooks
// (globalThis.__gremlinTest, only installed with --test-hooks).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { _electron as electron } from 'playwright-core'
import electronPath from 'electron'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

async function until(fn, what, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  let last
  while (Date.now() < deadline) {
    last = await fn()
    if (last) return last
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error(`timed out waiting for ${what}; last=${JSON.stringify(last)}`)
}

test('overlay window mechanics: transparency, click-through flip, safety net, panic', async () => {
  const app = await electron.launch({
    executablePath: electronPath,
    args: ['.', '--test-hooks'],
    cwd: root,
  })

  try {
    const state = () => app.evaluate(() => globalThis.__gremlinTest.state())

    // window exists with the overlay-critical flags
    const s0 = await until(state, 'test hooks')
    assert.equal(s0.transparent, true, 'window must be transparent')
    assert.equal(s0.alwaysOnTop, true, 'window must be always on top')
    assert.equal(s0.frame, false, 'window must be frameless')
    assert.equal(s0.interactive, false, 'starts click-through')
    assert.ok(s0.bounds.width > 100 && s0.bounds.height > 100, 'covers the display')

    // renderer -> IPC -> main rect pipeline delivers the skeleton's hittable rect
    const s1 = await until(
      async () => ((await state()).rects.length > 0 ? state() : null),
      'renderer-reported hit rects'
    )
    const r = s1.rects[0]

    // cursor over the sprite -> window becomes interactive
    await app.evaluate(
      ({}, pt) => globalThis.__gremlinTest.setCursorOverride(pt),
      { x: s1.bounds.x + r.x + r.w / 2, y: s1.bounds.y + r.y + r.h / 2 }
    )
    await until(async () => (await state()).interactive, 'interactive flip on hover')

    // cursor leaves (sprite "teleported away") -> safety net restores click-through
    await app.evaluate(({}, pt) => globalThis.__gremlinTest.setCursorOverride(pt), {
      x: s1.bounds.x + r.x + r.w + 500,
      y: s1.bounds.y + r.y + r.h + 500,
    })
    await until(async () => !(await state()).interactive, 'click-through restored by safety net')

    // panic hard-exits the app
    const closed = new Promise((resolve) => app.on('close', resolve))
    await app
      .evaluate(() => setTimeout(() => globalThis.__gremlinTest.panic(), 20))
      .catch(() => {}) // the app may die before the evaluate round-trips
    await closed
  } finally {
    await app.close().catch(() => {}) // no-op if already dead
  }
})

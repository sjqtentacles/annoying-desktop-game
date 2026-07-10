// Captures docs/screenshot.png for the README: launches the real app,
// stages some mischief, and screenshots the overlay window's content
// (with a fake desktop background injected, since the real one is transparent).
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { _electron as electron } from 'playwright-core'
import electronPath from 'electron'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const app = await electron.launch({ executablePath: electronPath, args: ['.'], cwd: root })
const page = await app.firstWindow()
await page.waitForTimeout(2500) // let the first gremlin spawn and start wandering

await page.evaluate(() => {
  // stand-in desktop so the transparent overlay reads as a screenshot
  document.body.style.background = 'linear-gradient(160deg, #2f5f96 0%, #1d3c61 100%)'
  window.__gremlinDebug.mischief('popup')
  window.__gremlinDebug.mischief('popup')
  window.__gremlinDebug.mischief('screech')
})
await page.waitForTimeout(700) // mid-screech, popups settled

await page.screenshot({ path: path.join(root, 'docs/screenshot.png') })
await app.close()
console.log('wrote docs/screenshot.png')

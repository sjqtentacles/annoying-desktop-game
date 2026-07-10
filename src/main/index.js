import { app, screen } from 'electron'
import { createOverlay } from './overlay-window.js'
import { createClickthrough } from './clickthrough.js'
import { createTray } from './tray.js'
import { registerPanicKey } from './hotkeys.js'
import { wireIpc } from './ipc.js'

const debug = process.argv.includes('--debug')
const testHooks = process.argv.includes('--test-hooks')

// A click-through window may never receive a "user gesture", which would
// leave WebAudio suspended forever
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
// escape hatch for machines whose drivers render transparency as black
if (process.argv.includes('--no-gpu')) app.disableHardwareAcceleration()

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock.hide()

  // safety valves first — before anything annoying exists
  registerPanicKey()
  let win = null
  const trayCtl = createTray({
    onControl: (msg) => win?.webContents.send('control', msg),
  })

  win = createOverlay(screen.getPrimaryDisplay(), { debug })
  const clickthrough = createClickthrough(win)
  wireIpc(clickthrough, { onStatus: (s) => trayCtl.updateStatus(s) })

  if (testHooks) {
    globalThis.__gremlinTest = {
      state: () => ({
        transparent: win.overlayFlags.transparent,
        alwaysOnTop: win.isAlwaysOnTop(),
        frame: win.overlayFlags.frame,
        bounds: win.getBounds(),
        interactive: clickthrough.isInteractive(),
        rects: clickthrough.getRects(),
      }),
      setCursorOverride: (pt) => clickthrough.setCursorOverride(pt),
      panic: () => app.exit(0),
    }
  }
})

// the overlay closing means the app is done (the tray dies with the app)
app.on('window-all-closed', () => app.quit())

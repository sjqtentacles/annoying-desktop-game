import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BrowserWindow } from 'electron'

const dir = path.dirname(fileURLToPath(import.meta.url))
const isWin = process.platform === 'win32'

// One overlay per display; v1 only ever passes the primary display.
export function createOverlay(display, { debug = false } = {}) {
  const { bounds } = display
  const options = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    // +1 on Windows: an exactly screen-sized transparent window can be treated
    // as fullscreen by Chromium and lose transparency
    height: bounds.height + (isWin ? 1 : 0),
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: !isWin, // never steal focus on Windows; mac needs focusable for reliable clicks
    show: false,
    webPreferences: {
      preload: path.join(dir, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // overlay is always "background"; keep rAF + audio alive
    },
  }
  const win = new BrowserWindow(options)
  // no getter exists for these; expose creation config for the e2e assertions
  win.overlayFlags = { transparent: options.transparent, frame: options.frame }

  win.setAlwaysOnTop(true, 'screen-saver')
  if (process.platform === 'darwin') {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }
  win.setIgnoreMouseEvents(true, { forward: true })

  win.loadFile(path.join(dir, '../renderer/index.html'))
  win.once('ready-to-show', () => {
    win.showInactive()
    // attached devtools kills both transparency and mousemove forwarding
    if (debug) win.webContents.openDevTools({ mode: 'detach' })
  })

  return win
}

import { app, Tray, Menu, nativeImage } from 'electron'
import { buildIconBitmaps } from './tray-icon.js'

export const PANIC_ACCELERATOR = 'CommandOrControl+Shift+X'
const panicLabel = process.platform === 'darwin' ? '⌘⇧X' : 'Ctrl+Shift+X'

// The tray is the app's only visible chrome (no dock icon, no taskbar entry)
// and the guaranteed way out — created before anything annoying exists.
export function createTray({ onControl }) {
  const [one, two] = buildIconBitmaps()
  const icon = nativeImage.createFromBitmap(Buffer.from(one.buffer), {
    width: one.width,
    height: one.height,
  })
  icon.addRepresentation({
    scaleFactor: 2,
    buffer: Buffer.from(two.buffer),
    width: two.width,
    height: two.height,
  })
  if (process.platform === 'darwin') icon.setTemplateImage(true)

  const tray = new Tray(icon)
  tray.setToolTip(`Gremlin — panic key: ${panicLabel}`)

  const state = { paused: false, muted: false, level: 1, score: 0 }

  function rebuild() {
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: `Level ${state.level} · ${state.score} caught`, enabled: false },
        { type: 'separator' },
        {
          label: 'Pause gremlins',
          type: 'checkbox',
          checked: state.paused,
          click: (item) => {
            state.paused = item.checked
            onControl({ type: 'pause', value: state.paused })
            rebuild()
          },
        },
        {
          label: 'Mute',
          type: 'checkbox',
          checked: state.muted,
          click: (item) => {
            state.muted = item.checked
            onControl({ type: 'mute', value: state.muted })
            rebuild()
          },
        },
        {
          label: 'Reset game',
          click: () => onControl({ type: 'reset' }),
        },
        { type: 'separator' },
        { label: `Quit Gremlin (${panicLabel})`, click: () => app.quit() },
      ])
    )
  }
  rebuild()

  return {
    tray,
    updateStatus({ level, score }) {
      if (level === state.level && score === state.score) return
      state.level = level
      state.score = score
      rebuild()
    },
  }
}

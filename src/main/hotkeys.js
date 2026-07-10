import { app, globalShortcut } from 'electron'
import { PANIC_ACCELERATOR } from './tray.js'

// Panic must be unconditional and instant: hard exit, no close handlers.
export function registerPanicKey() {
  const ok = globalShortcut.register(PANIC_ACCELERATOR, () => app.exit(0))
  app.on('will-quit', () => globalShortcut.unregisterAll())
  return ok
}

import { app, ipcMain } from 'electron'

export function wireIpc(clickthrough) {
  ipcMain.on('hit-rects', (_e, rects) => clickthrough.setRects(rects))
  ipcMain.on('hover-hint', () => clickthrough.hint())
  ipcMain.on('panic', () => app.exit(0))
}

import { app, ipcMain } from 'electron'

export function wireIpc(clickthrough, { onStatus }) {
  ipcMain.on('hit-rects', (_e, rects) => clickthrough.setRects(rects))
  ipcMain.on('hover-hint', () => clickthrough.hint())
  ipcMain.on('status', (_e, status) => onStatus(status))
  ipcMain.on('panic', () => app.exit(0))
}

// Sandboxed preload (must stay CJS). The entire native surface of the game.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('gremlinNative', {
  reportHitRects: (rects) => ipcRenderer.send('hit-rects', rects),
  hoverHint: () => ipcRenderer.send('hover-hint'),
  reportStatus: (status) => ipcRenderer.send('status', status),
  panic: () => ipcRenderer.send('panic'),
  onControl: (cb) => ipcRenderer.on('control', (_e, msg) => cb(msg)),
})

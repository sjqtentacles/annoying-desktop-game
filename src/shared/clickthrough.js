// The load-bearing decision of the whole app: should the overlay window be
// interactive (cursor over a gremlin) or click-through (everywhere else)?
// Pure — main/clickthrough wiring feeds it the polled cursor and mirrored
// sprite rects. Coordinate space: window-relative DIPs on both sides
// (Electron screen coords and window bounds are DIPs; renderer CSS px equal
// DIPs at zoomFactor 1), so no DPI conversion happens here.
import { anyRectContains } from './hittest.js'

export function decide(cursor, spriteRects, currentlyInteractive) {
  const interactive = !!cursor && anyRectContains(spriteRects, cursor)
  return { interactive, changed: interactive !== currentlyInteractive }
}

// Shared between main (safety-net poll) and renderer. Rects are {x, y, w, h}
// in window-relative CSS px (== DIPs at zoomFactor 1 — see clickthrough.js).
export function pointInRect(pt, rect, pad = 0) {
  return (
    pt.x >= rect.x - pad &&
    pt.x <= rect.x + rect.w + pad &&
    pt.y >= rect.y - pad &&
    pt.y <= rect.y + rect.h + pad
  )
}

export function anyRectContains(rects, pt, pad = 0) {
  return rects.some((r) => pointInRect(pt, r, pad))
}

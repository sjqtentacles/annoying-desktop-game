// Renderer side of click-through: collect sprite AABBs, mirror them to main
// (which owns the ignore-state), and nudge main immediately on hover
// transitions so entering a gremlin feels instant rather than poll-delayed.
export function startHitReporting({ intervalMs = 33 } = {}) {
  let lastJson = ''
  let hovering = false

  function collect() {
    const rects = []
    for (const el of document.querySelectorAll('.hittable')) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) rects.push({ x: r.x, y: r.y, w: r.width, h: r.height })
    }
    return rects
  }

  function push() {
    const rects = collect()
    const json = JSON.stringify(rects)
    if (json === lastJson) return
    lastJson = json
    window.gremlinNative.reportHitRects(rects)
  }

  const timer = setInterval(push, intervalMs)

  // mousemove arrives even while click-through thanks to forward: true
  document.addEventListener('mousemove', (e) => {
    const hit = !!document.elementFromPoint(e.clientX, e.clientY)?.closest('.hittable')
    if (hit !== hovering) {
      hovering = hit
      push()
      window.gremlinNative.hoverHint()
    }
  })

  return { stop: () => clearInterval(timer), forcePush: push }
}

// Entity pool with an escalation-driven population cap. The factory
// (create/destroy) is injected: DOM sprites in the app, stubs in tests.
export function createSpawner({ create, destroy, cap }) {
  const live = new Set()

  return {
    spawn(opts) {
      if (live.size >= cap()) return null
      const g = create(opts)
      live.add(g)
      return g
    },
    remove(g) {
      if (!live.delete(g)) return
      destroy(g)
    },
    clear() {
      for (const g of [...live]) {
        live.delete(g)
        destroy(g)
      }
    },
    count: () => live.size,
    forEach: (fn) => [...live].forEach(fn),
  }
}

// Generic finite state machine. States: { [name]: { enter?, update?, exit? } }.
// update(ctx, dt, fsm) may return a state name to transition.
export function createFsm(states, initial, ctx) {
  let current = null
  let timeInState = 0

  const fsm = {
    get state() {
      return current
    },
    get timeInState() {
      return timeInState
    },
    transition(name) {
      if (!states[name]) throw new Error(`unknown state: ${name}`)
      states[current]?.exit?.(ctx, fsm)
      current = name
      timeInState = 0
      states[name].enter?.(ctx, fsm)
    },
    update(dt) {
      timeInState += dt
      const next = states[current]?.update?.(ctx, dt, fsm)
      if (typeof next === 'string' && next !== current) fsm.transition(next)
    },
  }

  if (!states[initial]) throw new Error(`unknown state: ${initial}`)
  current = initial
  states[initial].enter?.(ctx, fsm)
  return fsm
}

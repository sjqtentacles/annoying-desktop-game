import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createFsm } from '../../src/renderer/gremlin/fsm.js'

function trackedStates(log) {
  return {
    idle: {
      enter: () => log.push('enter:idle'),
      update: () => {},
      exit: () => log.push('exit:idle'),
    },
    run: {
      enter: () => log.push('enter:run'),
      update: () => {},
      exit: () => log.push('exit:run'),
    },
  }
}

test('initial state is entered on creation', () => {
  const log = []
  const fsm = createFsm(trackedStates(log), 'idle', {})
  assert.equal(fsm.state, 'idle')
  assert.deepEqual(log, ['enter:idle'])
})

test('update accumulates timeInState', () => {
  const fsm = createFsm({ idle: {} }, 'idle', {})
  fsm.update(0.5)
  fsm.update(0.25)
  assert.equal(fsm.timeInState, 0.75)
})

test('update returning a state name transitions (exit before enter)', () => {
  const log = []
  const states = trackedStates(log)
  states.idle.update = () => 'run'
  const fsm = createFsm(states, 'idle', {})
  fsm.update(0.1)
  assert.equal(fsm.state, 'run')
  assert.deepEqual(log, ['enter:idle', 'exit:idle', 'enter:run'])
})

test('transition resets timeInState', () => {
  const fsm = createFsm({ idle: {}, run: {} }, 'idle', {})
  fsm.update(1)
  fsm.transition('run')
  assert.equal(fsm.timeInState, 0)
  assert.equal(fsm.state, 'run')
})

test('ctx and dt are passed to update', () => {
  let got = null
  const ctx = { name: 'g' }
  const fsm = createFsm({ idle: { update: (c, dt) => { got = [c, dt] } } }, 'idle', ctx)
  fsm.update(0.016)
  assert.equal(got[0], ctx)
  assert.equal(got[1], 0.016)
})

test('transition to unknown state throws', () => {
  const fsm = createFsm({ idle: {} }, 'idle', {})
  assert.throws(() => fsm.transition('nope'), /unknown state/i)
})

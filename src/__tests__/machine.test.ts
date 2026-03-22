import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createMachine } from '../../dist/index.js';

describe('createMachine', () => {
  function trafficLight() {
    return createMachine({
      initial: 'idle',
      context: { count: 0 },
      states: {
        idle: {
          on: { START: 'loading' },
        },
        loading: {
          on: { SUCCESS: 'done', FAIL: 'error' },
        },
        done: {},
        error: {
          on: { RETRY: 'loading' },
        },
      },
    });
  }

  it('should start in the initial state', () => {
    const machine = trafficLight();
    assert.equal(machine.state, 'idle');
  });

  it('should transition on valid event', () => {
    const machine = trafficLight();
    machine.send('START');
    assert.equal(machine.state, 'loading');
  });

  it('should transition through multiple states', () => {
    const machine = trafficLight();
    machine.send('START');
    machine.send('SUCCESS');
    assert.equal(machine.state, 'done');
  });

  it('should ignore invalid events (no-op)', () => {
    const machine = trafficLight();
    machine.send('SUCCESS'); // not valid from idle
    assert.equal(machine.state, 'idle');
  });

  it('should block transition when guard returns false', () => {
    const machine = createMachine({
      initial: 'locked',
      context: { authorized: false },
      states: {
        locked: {
          on: {
            UNLOCK: {
              target: 'unlocked',
              guard: (ctx) => (ctx as { authorized: boolean }).authorized,
            },
          },
        },
        unlocked: {},
      },
    });

    machine.send('UNLOCK');
    assert.equal(machine.state, 'locked');
  });

  it('should allow transition when guard returns true', () => {
    const machine = createMachine({
      initial: 'locked',
      context: { authorized: true },
      states: {
        locked: {
          on: {
            UNLOCK: {
              target: 'unlocked',
              guard: (ctx) => (ctx as { authorized: boolean }).authorized,
            },
          },
        },
        unlocked: {},
      },
    });

    machine.send('UNLOCK');
    assert.equal(machine.state, 'unlocked');
  });

  it('should call onEnter and onExit', () => {
    const calls: string[] = [];

    const machine = createMachine({
      initial: 'a',
      states: {
        a: {
          on: { GO: 'b' },
          onExit: () => calls.push('exit-a'),
        },
        b: {
          onEnter: () => calls.push('enter-b'),
        },
      },
    });

    machine.send('GO');
    assert.deepEqual(calls, ['exit-a', 'enter-b']);
  });

  it('should notify subscribers on transition', () => {
    const machine = trafficLight();
    const states: string[] = [];

    machine.subscribe((state) => {
      states.push(state);
    });

    machine.send('START');
    machine.send('SUCCESS');

    assert.deepEqual(states, ['loading', 'done']);
  });

  it('should stop notifying after unsubscribe', () => {
    const machine = trafficLight();
    const states: string[] = [];

    const unsub = machine.subscribe((state) => {
      states.push(state);
    });

    machine.send('START');
    unsub();
    machine.send('SUCCESS');

    assert.deepEqual(states, ['loading']);
  });

  it('should return true from matches() for current state', () => {
    const machine = trafficLight();
    assert.equal(machine.matches('idle'), true);
    assert.equal(machine.matches('loading'), false);

    machine.send('START');
    assert.equal(machine.matches('loading'), true);
    assert.equal(machine.matches('idle'), false);
  });

  it('should return correct value from can()', () => {
    const machine = trafficLight();
    assert.equal(machine.can('START'), true);
    assert.equal(machine.can('SUCCESS'), false);

    machine.send('START');
    assert.equal(machine.can('SUCCESS'), true);
    assert.equal(machine.can('START'), false);
  });

  it('should make context accessible', () => {
    const machine = createMachine({
      initial: 'idle',
      context: { value: 42 },
      states: {
        idle: {},
      },
    });

    assert.deepEqual(machine.context, { value: 42 });
  });

  it('should throw on invalid initial state', () => {
    assert.throws(() => {
      createMachine({
        initial: 'nonexistent',
        states: {
          idle: {},
        },
      });
    }, /Invalid initial state/);
  });

  it('should throw on transition to undefined state', () => {
    const machine = createMachine({
      initial: 'a',
      states: {
        a: {
          on: { GO: 'nonexistent' },
        },
      },
    });

    assert.throws(() => {
      machine.send('GO');
    }, /not a defined state/);
  });
});

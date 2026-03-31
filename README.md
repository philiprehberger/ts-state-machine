# @philiprehberger/state-machine

[![CI](https://github.com/philiprehberger/ts-state-machine/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-state-machine/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/state-machine.svg)](https://www.npmjs.com/package/@philiprehberger/state-machine)
[![Last updated](https://img.shields.io/github/last-commit/philiprehberger/ts-state-machine)](https://github.com/philiprehberger/ts-state-machine/commits/main)

Typed finite state machine with transition guards, effects, and subscriptions.

## Installation

```bash
npm install @philiprehberger/state-machine
```

## Usage

```ts
import { createMachine } from '@philiprehberger/state-machine';

const machine = createMachine({
  initial: 'idle',
  context: { retries: 0 },
  states: {
    idle: {
      on: { FETCH: 'loading' },
    },
    loading: {
      on: {
        SUCCESS: 'done',
        FAIL: 'error',
      },
      onEnter: () => console.log('Loading started'),
    },
    done: {},
    error: {
      on: { RETRY: 'loading' },
    },
  },
});

machine.send('FETCH');
console.log(machine.state); // 'loading'
```

### Transition Guards

```ts
import { createMachine } from '@philiprehberger/state-machine';

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

machine.send('UNLOCK'); // blocked — guard returns false
console.log(machine.state); // 'locked'
```

### Subscribing to Changes

```ts
import { createMachine } from '@philiprehberger/state-machine';

const machine = createMachine({
  initial: 'off',
  states: {
    off: { on: { TOGGLE: 'on' } },
    on: { on: { TOGGLE: 'off' } },
  },
});

const unsubscribe = machine.subscribe((state) => {
  console.log('State changed to:', state);
});

machine.send('TOGGLE'); // logs: State changed to: on
unsubscribe();
```

## API

| Function | Description |
|----------|-------------|
| `createMachine(config)` | Create a new state machine instance |
| `machine.send(event)` | Send an event to trigger a transition |
| `machine.matches(state)` | Check if the machine is in a given state |
| `machine.can(event)` | Check if an event can trigger a transition |
| `machine.subscribe(listener)` | Subscribe to state changes; returns unsubscribe function |
| `machine.state` | Current state (readonly) |
| `machine.context` | Current context (readonly) |

## Development

```bash
npm install
npm run build
npm test
npm run typecheck
```

## Support

If you find this project useful:

⭐ [Star the repo](https://github.com/philiprehberger/ts-state-machine)

🐛 [Report issues](https://github.com/philiprehberger/ts-state-machine/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

💡 [Suggest features](https://github.com/philiprehberger/ts-state-machine/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

❤️ [Sponsor development](https://github.com/sponsors/philiprehberger)

🌐 [All Open Source Projects](https://philiprehberger.com/open-source-packages)

💻 [GitHub Profile](https://github.com/philiprehberger)

🔗 [LinkedIn Profile](https://www.linkedin.com/in/philiprehberger)

## License

[MIT](LICENSE)

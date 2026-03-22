import type { MachineConfig, MachineInstance, TransitionTarget } from './types';

export function createMachine(config: MachineConfig): MachineInstance {
  const { states, initial } = config;

  if (!(initial in states)) {
    throw new Error(`Invalid initial state: "${initial}"`);
  }

  let currentState = initial;
  let context = config.context;
  const listeners = new Set<(state: string, ctx: unknown) => void>();

  function resolveTransition(
    event: string,
  ): { target: string; guard?: (ctx: unknown) => boolean } | undefined {
    const stateConfig = states[currentState];
    if (!stateConfig?.on || !(event in stateConfig.on)) {
      return undefined;
    }

    const transition = stateConfig.on[event];
    if (typeof transition === 'string') {
      return { target: transition };
    }

    return transition;
  }

  const instance: MachineInstance = {
    get state() {
      return currentState;
    },

    get context() {
      return context;
    },

    send(event: string): void {
      const transition = resolveTransition(event);
      if (!transition) {
        return;
      }

      if (transition.guard && !transition.guard(context)) {
        return;
      }

      const targetState = transition.target;

      if (!(targetState in states)) {
        throw new Error(
          `Transition target "${targetState}" is not a defined state`,
        );
      }

      const exitConfig = states[currentState];
      if (exitConfig?.onExit) {
        exitConfig.onExit(context);
      }

      currentState = targetState;

      const enterConfig = states[currentState];
      if (enterConfig?.onEnter) {
        enterConfig.onEnter(context);
      }

      for (const listener of listeners) {
        listener(currentState, context);
      }
    },

    matches(state: string): boolean {
      return currentState === state;
    },

    subscribe(listener: (state: string, ctx: unknown) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    can(event: string): boolean {
      const transition = resolveTransition(event);
      if (!transition) {
        return false;
      }
      if (transition.guard && !transition.guard(context)) {
        return false;
      }
      return true;
    },
  };

  return instance;
}

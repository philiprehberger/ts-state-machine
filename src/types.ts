export interface TransitionTarget {
  target: string;
  guard?: (ctx: unknown) => boolean;
}

export interface StateConfig {
  on?: Record<string, string | TransitionTarget>;
  onEnter?: (ctx: unknown) => void;
  onExit?: (ctx: unknown) => void;
}

export interface MachineConfig {
  initial: string;
  context?: unknown;
  states: Record<string, StateConfig>;
}

export interface MachineInstance {
  readonly state: string;
  readonly context: unknown;
  send(event: string): void;
  matches(state: string): boolean;
  subscribe(listener: (state: string, ctx: unknown) => void): () => void;
  can(event: string): boolean;
}

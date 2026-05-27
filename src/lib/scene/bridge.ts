type EventMap = Record<string, unknown>;
type EventListener<Payload> = (payload: Payload) => void;
type StateListener<State> = (state: State) => void;

export type SceneBridge<State, Events extends EventMap = Record<string, never>> = {
  emit: <Type extends keyof Events & string>(type: Type, payload: Events[Type]) => void;
  getSnapshot: () => State;
  on: <Type extends keyof Events & string>(
    type: Type,
    listener: EventListener<Events[Type]>
  ) => () => void;
  subscribe: (listener: StateListener<State>) => () => void;
  updateState: (nextState: State | ((currentState: State) => State)) => State;
  destroy: () => void;
};

export function setupSceneBridge<State, Events extends EventMap = Record<string, never>>(
  initialState: State
): SceneBridge<State, Events> {
  let state = initialState;
  const stateListeners = new Set<StateListener<State>>();
  const eventListeners = new Map<keyof Events & string, Set<EventListener<Events[keyof Events & string]>>>();

  function subscribe(listener: StateListener<State>) {
    stateListeners.add(listener);
    listener(state);
    return () => {
      stateListeners.delete(listener);
    };
  }

  function updateState(nextState: State | ((currentState: State) => State)) {
    state = typeof nextState === 'function' ? (nextState as (currentState: State) => State)(state) : nextState;
    stateListeners.forEach((listener) => listener(state));
    return state;
  }

  function on<Type extends keyof Events & string>(
    type: Type,
    listener: EventListener<Events[Type]>
  ) {
    const listeners =
      eventListeners.get(type) ??
      new Set<EventListener<Events[keyof Events & string]>>();
    listeners.add(listener as EventListener<Events[keyof Events & string]>);
    eventListeners.set(type, listeners);

    return () => {
      listeners.delete(listener as EventListener<Events[keyof Events & string]>);
      if (!listeners.size) eventListeners.delete(type);
    };
  }

  function emit<Type extends keyof Events & string>(type: Type, payload: Events[Type]) {
    eventListeners.get(type)?.forEach((listener) => listener(payload));
  }

  function destroy() {
    stateListeners.clear();
    eventListeners.clear();
  }

  return {
    emit,
    getSnapshot: () => state,
    on,
    subscribe,
    updateState,
    destroy
  };
}

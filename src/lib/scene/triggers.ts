export type TriggerMode = 'once' | 'repeat';

export type SceneTrigger<Context> = {
  id: string;
  mode?: TriggerMode;
  isActive: (context: Context) => boolean;
  onEnter?: (context: Context) => void;
  onExit?: (context: Context) => void;
  onUpdate?: (context: Context) => void;
};

type TriggerState = {
  active: boolean;
  hasFired: boolean;
};

export function createTriggerRegistry<Context>() {
  const triggers = new Map<string, SceneTrigger<Context>>();
  const states = new Map<string, TriggerState>();

  function registerTrigger(trigger: SceneTrigger<Context>) {
    triggers.set(trigger.id, trigger);
    states.set(trigger.id, { active: false, hasFired: false });

    return () => {
      triggers.delete(trigger.id);
      states.delete(trigger.id);
    };
  }

  function evaluate(context: Context) {
    triggers.forEach((trigger) => {
      const state = states.get(trigger.id) ?? { active: false, hasFired: false };
      const active = trigger.isActive(context);
      const mode = trigger.mode ?? 'repeat';
      const canEnter = mode !== 'once' || !state.hasFired;

      if (active && !state.active) {
        state.active = true;
        if (canEnter) {
          state.hasFired = true;
          trigger.onEnter?.(context);
        }
      } else if (!active && state.active) {
        state.active = false;
        trigger.onExit?.(context);
      }

      if (active) trigger.onUpdate?.(context);
      states.set(trigger.id, state);
    });
  }

  function getState(id: string) {
    return states.get(id) ?? { active: false, hasFired: false };
  }

  function clear() {
    triggers.clear();
    states.clear();
  }

  return {
    clear,
    evaluate,
    getState,
    registerTrigger
  };
}

export function registerTrigger<Context>(
  registry: ReturnType<typeof createTriggerRegistry<Context>>,
  trigger: SceneTrigger<Context>
) {
  return registry.registerTrigger(trigger);
}

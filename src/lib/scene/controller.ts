import { setupSceneBridge, type SceneBridge } from './bridge';
import { createSceneResourceScope } from './resources';
import { createTriggerRegistry } from './triggers';

type EventMap = Record<string, unknown>;

export function createSceneController<
  State,
  Events extends EventMap = Record<string, never>,
  TriggerContext = never
>(initialState: State) {
  const bridge = setupSceneBridge<State, Events>(initialState);
  const resources = createSceneResourceScope();
  const triggers = createTriggerRegistry<TriggerContext>();

  function destroy() {
    resources.destroy();
    triggers.clear();
    bridge.destroy();
  }

  return {
    bridge,
    destroy,
    resources,
    triggers
  };
}

export type SceneController<
  State,
  Events extends EventMap = Record<string, never>,
  TriggerContext = never
> = {
  bridge: SceneBridge<State, Events>;
  destroy: () => void;
  resources: ReturnType<typeof createSceneResourceScope>;
  triggers: ReturnType<typeof createTriggerRegistry<TriggerContext>>;
};

import Phaser from 'phaser';
import {
  kitchenSceneConfig,
  type KitchenChefId,
  type KitchenSceneConfig
} from '$lib/kitchen/kitchen-scene.config';
import { setupSceneBridge, type SceneBridge } from '$lib/scene/bridge';
import { createTriggerRegistry } from '$lib/scene/triggers';
import {
  createSceneTracker,
  getVisibleRatio,
  type HorizontalSceneMetrics,
  type Viewport
} from '$lib/scene/viewport';
import { mountHeadlessPhaserScene } from './headless-scene';

export type KitchenControllerState = {
  cameraX: number;
  targetCameraX: number;
  progress: number;
  activeChefId: KitchenChefId | undefined;
};

export type KitchenControllerEvents = {
  'chef:enter': { id: KitchenChefId };
  'chef:exit': { id: KitchenChefId };
};

export type KitchenControllerBridge = SceneBridge<KitchenControllerState, KitchenControllerEvents>;

type KitchenControllerOptions = {
  bridge?: KitchenControllerBridge;
  config?: KitchenSceneConfig;
  getViewport: () => Viewport;
  onUpdate?: (state: KitchenControllerState) => void;
};

type KitchenTriggerContext = {
  cameraX: number;
  config: KitchenSceneConfig;
  metrics: HorizontalSceneMetrics;
};

export const initialKitchenControllerState: KitchenControllerState = {
  cameraX: 0,
  targetCameraX: 0,
  progress: 0,
  activeChefId: undefined
};

class KitchenControllerScene extends Phaser.Scene {
  private activeChefId: KitchenChefId | undefined;
  private readonly bridge: KitchenControllerBridge;
  private readonly config: KitchenSceneConfig;
  private readonly tracker: ReturnType<typeof createSceneTracker>;
  private readonly triggers = createTriggerRegistry<KitchenTriggerContext>();

  constructor(private readonly options: Required<KitchenControllerOptions>) {
    super('KitchenControllerScene');
    this.config = options.config;
    this.bridge = options.bridge;
    this.tracker = createSceneTracker({
      sceneWidth: this.config.sceneWidth,
      sceneHeight: this.config.sceneHeight,
      getViewport: options.getViewport
    });
    this.registerSceneTriggers();
  }

  scrollBy(delta: number) {
    this.tracker.scrollBy(delta);
  }

  beginDrag(clientX: number) {
    this.tracker.beginDrag(clientX);
  }

  dragTo(clientX: number) {
    this.tracker.dragTo(clientX);
  }

  endDrag() {
    this.tracker.endDrag();
  }

  resize() {
    this.tracker.resize();
  }

  update(_time: number, delta: number) {
    const trackerState = this.tracker.step(delta);
    this.triggers.evaluate({
      cameraX: trackerState.cameraX,
      config: this.config,
      metrics: trackerState.metrics
    });

    const state: KitchenControllerState = {
      cameraX: trackerState.cameraX,
      targetCameraX: trackerState.targetCameraX,
      progress: trackerState.progress,
      activeChefId: this.activeChefId
    };

    this.bridge.updateState(state);
    this.options.onUpdate?.(state);
  }

  destroyController() {
    this.triggers.clear();
  }

  private registerSceneTriggers() {
    this.triggers.registerTrigger({
      id: `${this.config.chef.id}:visible`,
      mode: 'repeat',
      isActive: ({ cameraX, config, metrics }) =>
        getVisibleRatio({
          cameraX,
          layerSpeed: config.layerSpeed.chef,
          objectX: config.chef.x,
          objectWidth: config.chef.width,
          sceneScale: metrics.sceneScale,
          viewWidth: metrics.viewWidth
        }) > config.chef.visibleThreshold,
      onEnter: ({ config }) => {
        this.activeChefId = config.chef.id;
        this.bridge.emit('chef:enter', { id: config.chef.id });
      },
      onExit: ({ config }) => {
        if (this.activeChefId === config.chef.id) this.activeChefId = undefined;
        this.bridge.emit('chef:exit', { id: config.chef.id });
      }
    });
  }
}

export function mountKitchenController(options: KitchenControllerOptions) {
  const bridge = options.bridge ?? setupSceneBridge<KitchenControllerState, KitchenControllerEvents>(
    initialKitchenControllerState
  );
  const scene = new KitchenControllerScene({
    bridge,
    config: options.config ?? kitchenSceneConfig,
    getViewport: options.getViewport,
    onUpdate: options.onUpdate ?? (() => {})
  });
  const runtime = mountHeadlessPhaserScene(scene);

  return {
    beginDrag: (clientX: number) => scene.beginDrag(clientX),
    bridge,
    destroy: () => {
      scene.destroyController();
      runtime.destroy();
    },
    dragTo: (clientX: number) => scene.dragTo(clientX),
    endDrag: () => scene.endDrag(),
    resize: () => scene.resize(),
    scrollBy: (delta: number) => scene.scrollBy(delta)
  };
}

import { clamp } from './math';
import type { Cleanup } from './resources';

export type Viewport = {
  width: number;
  height: number;
};

export type HorizontalSceneMetrics = {
  viewWidth: number;
  viewHeight: number;
  sceneScale: number;
  worldWidth: number;
  maxScrollX: number;
};

export type SceneTrackerState = {
  cameraX: number;
  targetCameraX: number;
  progress: number;
  metrics: HorizontalSceneMetrics;
};

type SceneTrackerOptions = {
  sceneWidth: number;
  sceneHeight: number;
  getViewport: () => Viewport;
  dragMultiplier?: number;
  easing?: {
    idle: number;
    dragging: number;
    frameDuration: number;
    maxFrameScale: number;
    snapDistance: number;
  };
};

const defaultEasing = {
  idle: 0.13,
  dragging: 0.26,
  frameDuration: 16.667,
  maxFrameScale: 2.4,
  snapDistance: 0.08
};

export function getHorizontalSceneMetrics(
  viewport: Viewport,
  sceneWidth: number,
  sceneHeight: number
): HorizontalSceneMetrics {
  const viewWidth = Math.max(viewport.width, 1);
  const viewHeight = Math.max(viewport.height, 1);
  const sceneScale = viewHeight / sceneHeight;
  const worldWidth = Math.max(viewWidth, sceneWidth * sceneScale);
  const maxScrollX = Math.max(0, worldWidth - viewWidth);

  return { viewWidth, viewHeight, sceneScale, worldWidth, maxScrollX };
}

export function getVisibleRatio(options: {
  cameraX: number;
  layerSpeed?: number;
  objectX: number;
  objectWidth: number;
  sceneScale: number;
  viewWidth: number;
}) {
  const layerSpeed = options.layerSpeed ?? 1;
  const left = options.objectX * options.sceneScale - options.cameraX * layerSpeed;
  const right = left + options.objectWidth * options.sceneScale;
  const visibleWidth = Math.min(right, options.viewWidth) - Math.max(left, 0);

  return visibleWidth / Math.max(options.objectWidth * options.sceneScale, 1);
}

export function createSceneTracker(options: SceneTrackerOptions) {
  const easing = { ...defaultEasing, ...options.easing };
  const dragMultiplier = options.dragMultiplier ?? 1.95;
  let cameraX = 0;
  let targetCameraX = 0;
  let dragStartX = 0;
  let dragCameraX = 0;
  let dragging = false;

  function getMetrics() {
    return getHorizontalSceneMetrics(options.getViewport(), options.sceneWidth, options.sceneHeight);
  }

  function clampCamera(value: number) {
    return clamp(value, 0, getMetrics().maxScrollX);
  }

  function setTargetCameraX(value: number) {
    targetCameraX = clampCamera(value);
  }

  function getState(): SceneTrackerState {
    const metrics = getMetrics();
    return {
      cameraX,
      targetCameraX,
      progress: metrics.maxScrollX > 0 ? clamp(cameraX / metrics.maxScrollX, 0, 1) : 0,
      metrics
    };
  }

  function step(delta: number) {
    const distance = targetCameraX - cameraX;
    const frameScale = Math.min(delta / easing.frameDuration, easing.maxFrameScale);
    const amount = dragging ? easing.dragging : easing.idle;
    const stepAmount = 1 - Math.pow(1 - amount, frameScale);

    if (Math.abs(distance) < easing.snapDistance) {
      cameraX = targetCameraX;
    } else {
      cameraX += distance * stepAmount;
    }

    return getState();
  }

  return {
    beginDrag(clientX: number) {
      dragging = true;
      dragStartX = clientX;
      dragCameraX = targetCameraX;
    },
    dragTo(clientX: number) {
      if (!dragging) return;
      setTargetCameraX(dragCameraX + (dragStartX - clientX) * dragMultiplier);
    },
    endDrag() {
      dragging = false;
    },
    getState,
    resize() {
      targetCameraX = clampCamera(targetCameraX);
      cameraX = clampCamera(cameraX);
    },
    scrollBy(delta: number) {
      setTargetCameraX(targetCameraX + delta);
    },
    step
  };
}

export function createViewportObserver(
  element: Element,
  onResize: () => void
): Cleanup {
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(element);
  onResize();

  return () => resizeObserver.disconnect();
}

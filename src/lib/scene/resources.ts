export type Cleanup = () => void;

export type SceneResourceScope = ReturnType<typeof createSceneResourceScope>;

export function createSceneResourceScope() {
  const cleanups = new Set<Cleanup>();
  let destroyed = false;

  function add(cleanup: Cleanup | undefined) {
    if (!cleanup) return () => {};

    if (destroyed) {
      cleanup();
      return () => {};
    }

    cleanups.add(cleanup);
    return () => {
      if (!cleanups.delete(cleanup)) return;
      cleanup();
    };
  }

  function addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    target.addEventListener(type, listener, options);
    return add(() => target.removeEventListener(type, listener, options));
  }

  function addTimeout(callback: () => void, delay: number) {
    const timeoutId = window.setTimeout(callback, delay);
    return add(() => window.clearTimeout(timeoutId));
  }

  function addFrame(callback: FrameRequestCallback) {
    const frameId = window.requestAnimationFrame(callback);
    return add(() => window.cancelAnimationFrame(frameId));
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;

    for (const cleanup of Array.from(cleanups).reverse()) {
      cleanup();
    }
    cleanups.clear();
  }

  return {
    add,
    addEventListener,
    addFrame,
    addTimeout,
    destroy,
    get destroyed() {
      return destroyed;
    }
  };
}

export function destroySceneResources(scope: SceneResourceScope | undefined) {
  scope?.destroy();
}

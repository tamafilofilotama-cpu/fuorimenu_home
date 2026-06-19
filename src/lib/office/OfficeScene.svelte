<script lang="ts">
  import { onMount } from 'svelte';
  import { officeAssets, officeSceneConfig } from './office-scene.config';
  import { clamp, px } from '$lib/scene/math';
  import type { SceneAsset } from '$lib/scene/scene-asset.types';
  import { getSceneAssetStyle } from '$lib/scene/scene-utils';
  import { createViewportObserver } from '$lib/scene/viewport';

  let { isAudioMuted = false } = $props<{ isAudioMuted?: boolean }>();

  const { assetVersion, layerSpeed, sceneHeight, sceneWidth } = officeSceneConfig;
  const asset = (name: string) => `/assets/office-figma/${name}?v=${assetVersion}`;
  const officeFloor = { x: -226, y: 859, width: 37330, height: 123 };

  let stageEl: HTMLElement;
  let viewportWidth = $state(0);
  let viewportHeight = $state(0);
  let cameraX = $state(0);
  let targetCameraX = 0;
  let isDragging = $state(false);
  let isSceneLoaded = $state(true);
  let prefersReducedMotion = $state(false);
  let dragStartX = 0;
  let dragCameraX = 0;
  let rafId = 0;
  let lastFrameTime = 0;

  const resolvedLayerSpeed = $derived({
    background: prefersReducedMotion ? 1 : layerSpeed.background,
    middle: prefersReducedMotion ? 1 : layerSpeed.middle,
    title: prefersReducedMotion ? 1 : layerSpeed.title,
    floor: prefersReducedMotion ? 1 : layerSpeed.floor,
    foreground: prefersReducedMotion ? 1 : layerSpeed.foreground
  });
  const sceneVerticalInset = $derived(Math.max(18, Math.min(42, viewportHeight * 0.035)));
  const sceneScale = $derived(
    viewportHeight ? Math.max(1, viewportHeight - sceneVerticalInset * 2) / sceneHeight : 1
  );
  const worldWidth = $derived(Math.max(viewportWidth, sceneWidth * sceneScale));
  const maxScrollX = $derived(Math.max(0, worldWidth - viewportWidth));
  const progress = $derived(maxScrollX > 0 ? clamp(cameraX / maxScrollX, 0, 1) : 0);
  const scenePx = (value: number) => px(value, 2);
  const scrollSpaceStyle = $derived(
    `width: ${scenePx(worldWidth)}; height: ${scenePx(viewportHeight)}`
  );
  const worldStyle = $derived(
    `width: ${scenePx(viewportWidth)}; height: ${scenePx(viewportHeight)}`
  );

  function setTargetCameraX(value: number) {
    targetCameraX = clamp(value, 0, maxScrollX);
  }

  function syncViewport() {
    if (!stageEl) return;
    viewportWidth = stageEl.clientWidth;
    viewportHeight = stageEl.clientHeight;
    stageEl.scrollLeft = clamp(stageEl.scrollLeft, 0, maxScrollX);
    targetCameraX = clamp(targetCameraX, 0, maxScrollX);
    cameraX = stageEl.scrollLeft;
  }

  function scrollBy(delta: number) {
    if (!stageEl) return;
    setTargetCameraX(stageEl.scrollLeft + delta);
    stageEl.scrollLeft = targetCameraX;
  }

  function syncCameraFromScroll() {
    if (!stageEl) return;
    cameraX = clamp(stageEl.scrollLeft, 0, maxScrollX);
    targetCameraX = cameraX;
  }

  function step(now: number) {
    const delta = lastFrameTime ? Math.min((now - lastFrameTime) / 16.667, 2.4) : 1;
    lastFrameTime = now;
    const distance = targetCameraX - cameraX;
    const amount = isDragging ? 0.28 : 0.13;
    const stepAmount = 1 - Math.pow(1 - amount, delta);

    cameraX = Math.abs(distance) < 0.08 ? targetCameraX : cameraX + distance * stepAmount;
    if (stageEl && Math.abs(stageEl.scrollLeft - cameraX) > 0.5) {
      stageEl.scrollLeft = cameraX;
    }
    rafId = requestAnimationFrame(step);
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault();
    const axisDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    scrollBy(axisDelta * 1.35);
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    isDragging = true;
    dragStartX = event.clientX;
    dragCameraX = targetCameraX;
    stageEl.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (!isDragging) return;
    setTargetCameraX(dragCameraX + (dragStartX - event.clientX) * 2.1);
    if (stageEl) {
      stageEl.scrollLeft = targetCameraX;
    }
  }

  function endDrag(event?: PointerEvent) {
    if (!isDragging) return;
    isDragging = false;
    if (event && stageEl.hasPointerCapture(event.pointerId)) {
      stageEl.releasePointerCapture(event.pointerId);
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollBy(viewportWidth * 0.42);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollBy(-viewportWidth * 0.42);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setTargetCameraX(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setTargetCameraX(maxScrollX);
    }
  }

  function getAssetClass(item: SceneAsset) {
    return [
      'office-asset',
      'reveal-layer',
      `${item.layer}-layer`,
      `layer-${item.layer}`,
      item.isTail ? 'tail-layer' : ''
    ]
      .filter(Boolean)
      .join(' ');
  }

  function getAssetStyle(item: SceneAsset) {
    return getSceneAssetStyle(item, cameraX, sceneHeight, sceneScale, resolvedLayerSpeed);
  }

  function getOfficeFloorStyle() {
    const translateX = officeFloor.x * sceneScale - cameraX * resolvedLayerSpeed.floor;
    const bottom = (sceneHeight - officeFloor.y - officeFloor.height) * sceneScale + sceneVerticalInset;

    return [
      `width: ${scenePx(officeFloor.width * sceneScale)}`,
      `height: ${scenePx(officeFloor.height * sceneScale)}`,
      `bottom: ${scenePx(bottom)}`,
      `transform: translate3d(${scenePx(translateX)}, 0, 0)`
    ].join(';');
  }

  function getTitleStyle() {
    const titleFontSize = Math.min(
      150 * sceneScale,
      Math.max(56, (viewportWidth - 48) / 4.55)
    );
    const titleX = viewportWidth < 640 ? 24 : 93 * sceneScale;
    const translateX = titleX - cameraX * resolvedLayerSpeed.title;

    return [
      `translate: ${scenePx(translateX)} ${scenePx(sceneVerticalInset + 285 * sceneScale)}`,
      `font-size: ${scenePx(titleFontSize)}`
    ].join(';');
  }

  onMount(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncReducedMotion = () => {
      prefersReducedMotion = reducedMotionQuery.matches;
    };
    const stopResize = createViewportObserver(stageEl, syncViewport);

    syncReducedMotion();
    reducedMotionQuery.addEventListener('change', syncReducedMotion);
    window.addEventListener('keydown', onKeydown);
    stageEl.addEventListener('scroll', syncCameraFromScroll, { passive: true });
    rafId = requestAnimationFrame(step);
    isSceneLoaded = true;

    return () => {
      reducedMotionQuery.removeEventListener('change', syncReducedMotion);
      window.removeEventListener('keydown', onKeydown);
      stageEl.removeEventListener('scroll', syncCameraFromScroll);
      stopResize();
      cancelAnimationFrame(rafId);
    };
  });
</script>

<section
  bind:this={stageEl}
  class="office-stage"
  class:is-dragging={isDragging}
  class:is-loaded={isSceneLoaded}
  data-audio-muted={isAudioMuted}
  data-progress={progress.toFixed(3)}
  aria-label="Scena parallasse dell'ufficio"
  onwheel={onWheel}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={endDrag}
  onpointercancel={endDrag}
>
  <div class="office-scroll-space" style={scrollSpaceStyle}>
    <div class="office-world" style={worldStyle}>
      <img
        class="office-asset reveal-layer floor-layer"
        src={asset('floor.svg')}
        alt=""
        draggable="false"
        style={getOfficeFloorStyle()}
      />

      {#each officeAssets as item (item.id)}
        <img
          class={getAssetClass(item)}
          src={asset(item.src)}
          alt=""
          draggable="false"
          data-node-id={item.nodeId}
          style={getAssetStyle(item)}
        />
      {/each}

      <h1 class="office-title" style={getTitleStyle()} aria-label="Ufficio">Ufficio</h1>
    </div>
  </div>
</section>

<style>
  .office-stage {
    position: relative;
    width: 100%;
    min-height: 100svh;
    overflow-x: auto;
    overflow-y: hidden;
    background: var(--color-surface-page);
    cursor: grab;
    scrollbar-width: none;
    user-select: none;
    overscroll-behavior: contain;
    touch-action: pan-x;
  }

  .office-stage::-webkit-scrollbar {
    display: none;
  }

  .office-scroll-space {
    position: relative;
    min-width: 100%;
    min-height: 100svh;
  }

  .office-world {
    position: sticky;
    left: 0;
    top: 0;
    min-width: 100%;
    min-height: 100svh;
    overflow: hidden;
  }

  .office-stage.is-dragging {
    cursor: grabbing;
  }

  .office-asset {
    position: absolute;
    left: 0;
    display: block;
    object-fit: fill;
    pointer-events: none;
    transform-origin: center center;
    user-select: none;
    will-change: transform;
    z-index: calc(var(--scene-layer-z, 0) + var(--scene-z-offset, 0));
  }

  .office-title {
    position: absolute;
    left: 0;
    top: 0;
    will-change: translate, transform;
  }

  .reveal-layer,
  .office-title {
    opacity: 0;
  }

  .office-stage.is-loaded .reveal-layer,
  .office-stage.is-loaded .office-title {
    opacity: 1;
  }

  .office-stage.is-loaded .reveal-layer {
    animation: officeLayerIn 260ms cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay, 0ms)
      forwards;
  }

  .office-stage.is-loaded .office-title {
    animation: officeTitleIn 420ms cubic-bezier(0.22, 1, 0.36, 1) 220ms forwards;
  }

  .floor-layer {
    z-index: 1;
  }

  .background-layer {
    --reveal-delay: 120ms;
    --scene-layer-z: 2;
  }

  .middle-layer {
    --reveal-delay: 190ms;
    --scene-layer-z: 3;
  }

  .office-title {
    z-index: 4;
    margin: 0;
    color: var(--color-text-primary);
    font-family: var(--font-display);
    font-weight: 700;
    line-height: 1.2;
    pointer-events: none;
    transform: translateY(-50%);
    transform-origin: center center;
    white-space: nowrap;
  }

  .foreground-layer {
    --reveal-delay: 260ms;
    --scene-layer-z: 5;
  }

  @keyframes officeLayerIn {
    from {
      opacity: 0;
      filter: saturate(0.72);
    }
    to {
      opacity: 1;
      filter: saturate(1);
    }
  }

  @keyframes officeTitleIn {
    from {
      opacity: 0;
      transform: translate3d(0, -50%, 0) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translate3d(0, -50%, 0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .office-stage.is-loaded .reveal-layer,
    .office-stage.is-loaded .office-title {
      animation-duration: 1ms;
    }
  }
</style>

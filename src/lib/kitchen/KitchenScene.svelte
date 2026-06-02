<script lang="ts">
  import { onMount } from 'svelte';
  import { kitchenSceneConfig } from './kitchen-scene.config';
  import { createSceneController } from '$lib/scene/controller';
  import { clamp, px } from '$lib/scene/math';
  import { createViewportObserver } from '$lib/scene/viewport';
  import type {
    KitchenControllerEvents,
    KitchenControllerState
  } from '$lib/kitchen/kitchen-scroll-controller';

  const {
    assetWidth,
    chef,
    chefQuote,
    cursorCss,
    floorHeight,
    floorBottomOffset,
    floorTileWidth,
    foregroundBottomOffset,
    foregroundSvgHeight,
    foregroundSvgWidth,
    layerSpeed,
    pointerCursorCss,
    sceneHeight,
    sceneWidth,
    title
  } = kitchenSceneConfig;
  const titleLetters = title.split('');
  const initialKitchenState: KitchenControllerState = {
    cameraX: 0,
    targetCameraX: 0,
    progress: 0,
    activeChefId: undefined
  };
  const sceneController = createSceneController<KitchenControllerState, KitchenControllerEvents>(
    initialKitchenState
  );
  const { bridge } = sceneController;

  let stageEl: HTMLElement;
  let viewportWidth = $state(0);
  let viewportHeight = $state(0);
  let cameraX = $state(0);
  let narrativeProgress = $state(0);
  let activeChefId = $state<KitchenControllerState['activeChefId']>();
  let kitchenController:
    | {
        scrollBy: (delta: number) => void;
        beginDrag: (clientX: number) => void;
        dragTo: (clientX: number) => void;
        endDrag: () => void;
        resize: () => void;
        destroy: () => void;
      }
    | undefined;
  let isDragging = $state(false);
  let isSceneLoaded = $state(false);

  const sceneScale = $derived(viewportHeight ? viewportHeight / sceneHeight : 1);
  const worldWidth = $derived(Math.max(viewportWidth, sceneWidth * sceneScale));
  const maxScrollX = $derived(Math.max(0, worldWidth - viewportWidth));

  const scenePx = (value: number) => px(value, 2);
  const chefPinnedLeftInset = $derived(Math.max(32, Math.min(80, viewportWidth * 0.064)));
  const chefNaturalLeft = $derived(chef.x * sceneScale - cameraX * layerSpeed.chef);
  const chefLeft = $derived(Math.max(chefNaturalLeft, chefPinnedLeftInset));
  const isChefPinned = $derived(chefNaturalLeft <= chefPinnedLeftInset);
  const isChefDialogueVisible = $derived(isChefPinned);

  function syncViewport() {
    if (!stageEl) return;
    viewportWidth = stageEl.clientWidth;
    viewportHeight = stageEl.clientHeight;
    cameraX = clamp(cameraX, 0, maxScrollX);
    kitchenController?.resize();
  }

  function scrollBy(delta: number) {
    kitchenController?.scrollBy(delta);
  }

  function getLayerStyle(factor: number, bottomOffset = 0) {
    return [
      `width: ${scenePx(assetWidth * sceneScale)}`,
      `bottom: ${scenePx(bottomOffset * sceneScale)}`,
      `transform: translate3d(${scenePx(-cameraX * factor)}, 0, 0)`
    ].join(';');
  }

  function getForegroundLayerStyle() {
    const foregroundScale = (assetWidth / foregroundSvgWidth) * sceneScale;

    return [
      `width: ${scenePx(assetWidth * sceneScale)}`,
      `height: ${scenePx(foregroundSvgHeight * foregroundScale)}`,
      `bottom: ${scenePx(foregroundBottomOffset * sceneScale)}`,
      `transform: translate3d(${scenePx(-cameraX * layerSpeed.foreground)}, 0, 0)`
    ].join(';');
  }

  function getTitleStyle() {
    return [
      `left: ${scenePx(92 * sceneScale - cameraX * layerSpeed.title)}`,
      `top: ${scenePx(viewportHeight / 2 - 132 * sceneScale)}`,
      `font-size: ${scenePx(180 * sceneScale)}`
    ].join(';');
  }

  function getChefStyle() {
    return [
      `left: ${scenePx(chefLeft)}`,
      `bottom: ${scenePx(viewportHeight / 20)}`,
      `width: ${scenePx(chef.width * sceneScale)}`
    ].join(';');
  }

  function onWheel(event: WheelEvent) {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;

    event.preventDefault();
    scrollBy(event.deltaX * 1.05);
  }

  function onPointerDown(event: PointerEvent) {
    isDragging = true;
    kitchenController?.beginDrag(event.clientX);
    stageEl.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (!isDragging) return;
    kitchenController?.dragTo(event.clientX);
  }

  function endDrag(event: PointerEvent) {
    isDragging = false;
    kitchenController?.endDrag();
    if (stageEl.hasPointerCapture(event.pointerId)) {
      stageEl.releasePointerCapture(event.pointerId);
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    scrollBy(event.key === 'ArrowLeft' ? -42 : 42);
  }

  onMount(() => {
    let destroyed = false;
    const { resources } = sceneController;
    resources.add(bridge.subscribe((state) => {
      cameraX = state.cameraX;
      narrativeProgress = state.progress;
      activeChefId = state.activeChefId;
    }));
    resources.add(createViewportObserver(stageEl, syncViewport));

    import('$lib/kitchen/kitchen-scroll-controller').then(({ mountKitchenScrollController }) => {
      if (destroyed) return;
      kitchenController = mountKitchenScrollController({
        bridge,
        config: kitchenSceneConfig,
        getViewport: () => ({ width: viewportWidth, height: viewportHeight }),
        stageEl
      });
      resources.add(() => kitchenController?.destroy());
    });

    resources.addFrame(() => {
      isSceneLoaded = true;
    });
    resources.addEventListener(window, 'keydown', onKeydown as EventListener);

    return () => {
      destroyed = true;
      sceneController.destroy();
    };
  });
</script>

<section
  bind:this={stageEl}
  class="kitchen-stage"
  class:is-dragging={isDragging}
  class:is-loaded={isSceneLoaded}
  style={`--kitchen-cursor: ${cursorCss}; --kitchen-pointer-cursor: ${pointerCursorCss};`}
  data-active-chef={activeChefId ?? ''}
  data-narrative-progress={narrativeProgress.toFixed(3)}
  aria-label="Scena parallasse della cucina"
  onwheel={onWheel} 
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={endDrag}
  onpointercancel={endDrag}
>
  <div
    class="parallax-layer reveal-layer background-layer"
    style={`${getLayerStyle(layerSpeed.background)}; --reveal-delay: 40ms;`}
  >
    <img src="/assets/cucina_layer4b.svg" alt="" draggable="false" />
  </div>

  <div
    class="floor-layer reveal-layer"
    style={`height: ${scenePx(floorHeight * sceneScale)}; bottom: ${scenePx(floorBottomOffset * sceneScale)}; background-size: ${scenePx(floorTileWidth * sceneScale)} ${scenePx(floorHeight * sceneScale)}; background-position-x: ${scenePx(-cameraX)}; --reveal-delay: 160ms; --reveal-duration: 320ms;`}
  ></div>

  <div
    class="parallax-layer reveal-layer middle-layer"
    style={`${getLayerStyle(layerSpeed.middle)}; --reveal-delay: 280ms;`}
  >
    <img src="/assets/cucina_layer2b.svg" alt="" draggable="false" />
  </div>

  <h1 class="scene-title" style={getTitleStyle()} aria-label="Cucina">
    {#each titleLetters as letter, index}
      <span style={`--letter-delay: ${280 + index * 70}ms`} aria-hidden="true">{letter}</span>
    {/each}
  </h1>

  <button
    class="chef-button reveal-object"
    class:is-dialogue-visible={isChefDialogueVisible}
    style={`${getChefStyle()}; --reveal-delay: 390ms;`}
    type="button"
    aria-label="Testimonianza Carlo Zarri"
    onpointerdown={(event) => event.stopPropagation()}
  >
    <span class="speech-bubble" aria-hidden={!isChefDialogueVisible} data-node-id="3772:1119">
      <span class="speech-bubble-copy">{chefQuote}</span>
      <span class="speech-bubble-meta" aria-label="Chief Executive Chef - Carlo Zarri">
        <span>Chief Executive Chef - </span>
        <strong>Carlo Zarri</strong>
      </span>
    </span>
    <img src="/assets/npc_CarloZarri_alt1.svg" alt="" draggable="false" />
  </button>

  <div
    class="parallax-layer reveal-layer foreground-layer"
    style={`${getForegroundLayerStyle()}; --reveal-delay: 470ms;`}
  >
    <img src="/assets/cucina_layer1b.svg" alt="" draggable="false" />
  </div>
</section>

<style>
  .kitchen-stage {
    position: relative;
    width: 100%;
    min-height: 100svh;
    overflow: hidden;
    background: var(--color-surface-page);
    cursor: var(--kitchen-cursor);
    user-select: none;
    touch-action: none;
  }

  .kitchen-stage:focus-visible {
    outline: none;
  }

  .kitchen-stage.is-dragging {
    cursor: var(--kitchen-cursor);
  }

  .parallax-layer,
  .floor-layer,
  .scene-title,
  .chef-button {
    position: absolute;
    left: 0;
    will-change: transform;
  }

  .parallax-layer {
    pointer-events: none;
  }

  .reveal-layer {
    opacity: 0;
    transform-origin: 50% 50%;
    will-change: opacity;
  }

  .kitchen-stage.is-loaded .reveal-layer {
    animation: layerPopIn 1ms step-end var(--reveal-delay, 0ms) forwards;
  }

  .parallax-layer img {
    display: block;
    width: 100%;
    height: auto;
    user-select: none;
  }

  .background-layer {
    z-index: 1;
  }

  .floor-layer {
    z-index: 2;
    right: 0;
    bottom: 0;
    background-image: url('/assets/pavimento_tile.svg');
    background-repeat: repeat-x;
    transform-origin: 50% 50%;
    pointer-events: none;
  }

  .middle-layer {
    z-index: 3;
  }

  .scene-title {
    z-index: 4;
    margin: 0;
    color: var(--color-text-primary);
    font-family: var(--font-display);
    font-weight: 700;
    line-height: 0.86;
    pointer-events: none;
    transform: translate3d(0, -50%, 0);
    white-space: nowrap;
  }

  .scene-title span {
    display: inline-block;
    opacity: 0;
    transform: scale(0.82);
    transform-origin: 50% 50%;
  }

  .kitchen-stage.is-loaded .scene-title span {
    animation: titleLetterIn 360ms cubic-bezier(0.22, 1, 0.36, 1) var(--letter-delay, 0ms) forwards;
  }

  .chef-button {
    z-index: 4;
    display: block;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-text-primary);
    cursor: var(--kitchen-pointer-cursor);
  }

  .reveal-object {
    opacity: 0;
    transform: scale(0.92);
    transform-origin: 50% 50%;
  }

  .kitchen-stage.is-loaded .reveal-object {
    animation: objectPopIn 360ms cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay, 0ms) forwards;
  }

  .chef-button img {
    display: block;
    width: 100%;
    height: auto;
    pointer-events: none;
    user-select: none;
  }

  .speech-bubble {
    position: absolute;
    z-index: 7;
    left: calc(100% + clamp(14px, 1.7vw, 24px));
    bottom: calc(100% - clamp(72px, 7.8vw, 142px));
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: clamp(260px, 29vw, 370px);
    min-height: clamp(112px, 11vw, 146px);
    color: var(--color-text-primary);
    font-family: var(--font-text);
    text-align: left;
    opacity: 0;
    transition: opacity 1ms linear 220ms;
    pointer-events: none;
  }

  .speech-bubble::before {
    position: absolute;
    z-index: 0;
    left: -20px;
    top: clamp(62px, 6.7vw, 88px);
    width: 22px;
    height: 22px;
    background: var(--color-border-primary);
    clip-path: polygon(0 50%, 100% 0, 100% 100%);
    content: '';
    opacity: 0;
    scale: 0.72;
    transform-origin: 100% 50%;
    transition:
      opacity 1ms linear 80ms,
      scale 220ms cubic-bezier(0.22, 1, 0.36, 1) 80ms;
  }

  .speech-bubble-copy {
    position: relative;
    z-index: 1;
    flex: 1;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    min-height: clamp(94px, 10.7vw, 142px);
    padding: clamp(15px, 1.72vw, 22px);
    border: 2px solid var(--color-border-primary);
    border-radius: 10px 10px 0 0;
    background: var(--color-surface-page);
    font-size: clamp(13px, 1.22vw, 16px);
    font-weight: 400;
    line-height: 1.2;
    word-break: break-word;
    -webkit-clip-path: inset(0 100% 0 0);
    clip-path: inset(0 100% 0 0);
    will-change: clip-path;
  }

  .speech-bubble-meta {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    min-height: 36px;
    margin-top: -2px;
    padding: 0 clamp(13px, 1.18vw, 15px);
    border-radius: 0 0 var(--radius-s) var(--radius-s);
    background: var(--color-border-primary);
    color: var(--color-surface-page);
    font-family: var(--font-text);
    font-size: clamp(10px, 0.98vw, 13px);
    font-weight: 700;
    line-height: 1.5;
    white-space: nowrap;
    -webkit-clip-path: inset(0 100% 0 0);
    clip-path: inset(0 100% 0 0);
    will-change: clip-path;
  }

  .speech-bubble-meta strong {
    margin-left: 4px;
    font-family: "Fasthand", cursive;
    font-size: clamp(16px, 1.48vw, 19px);
    font-weight: 400;
    line-height: 1.5;
  }

  .chef-button.is-dialogue-visible .speech-bubble {
    opacity: 1;
    transition-delay: 0ms;
  }

  .chef-button.is-dialogue-visible .speech-bubble::before {
    opacity: 1;
    scale: 1;
  }

  .chef-button.is-dialogue-visible .speech-bubble-copy {
    animation: dialogueRevealX 280ms cubic-bezier(0.16, 1, 0.3, 1) 20ms forwards;
  }

  .chef-button.is-dialogue-visible .speech-bubble-meta {
    animation: dialogueRevealX 225ms cubic-bezier(0.16, 1, 0.3, 1) 240ms forwards;
  }

  .foreground-layer {
    z-index: 6;
  }

  @keyframes layerPopIn {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  @keyframes dialogueRevealX {
    from {
      -webkit-clip-path: inset(0 100% 0 0);
      clip-path: inset(0 100% 0 0);
    }

    to {
      -webkit-clip-path: inset(0 0 0 0);
      clip-path: inset(0 0 0 0);
    }
  }

  @keyframes titleLetterIn {
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  @keyframes objectPopIn {
    0% {
      opacity: 0;
      transform: scale(0.92);
    }

    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (max-width: 760px) {
    .speech-bubble {
      left: 0;
      bottom: calc(100% + 8px);
      width: min(330px, calc(100vw - 64px));
      min-height: 0;
    }

    .speech-bubble::before {
      left: -18px;
      top: 72px;
      width: 22px;
      height: 22px;
    }

    .speech-bubble-copy {
      min-height: 106px;
      padding: 14px 18px;
      border-width: 2px;
      font-size: 13px;
    }

    .speech-bubble-meta {
      min-height: 41px;
      margin-top: -2px;
      padding: 0 14px;
      font-size: 11px;
    }

    .speech-bubble-meta strong {
      font-size: 18px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal-layer {
      opacity: 1;
      animation: none;
    }

    .reveal-object,
    .scene-title span {
      opacity: 1;
      transform: none;
      animation: none;
    }

    .speech-bubble,
    .speech-bubble::before,
    .speech-bubble-copy,
    .speech-bubble-meta {
      transition: none;
      animation: none;
    }

    .chef-button.is-dialogue-visible .speech-bubble-copy,
    .chef-button.is-dialogue-visible .speech-bubble-meta {
      -webkit-clip-path: inset(0 0 0 0);
      clip-path: inset(0 0 0 0);
    }
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';

  const sceneWidth = 8192;
  const sceneHeight = 1211;
  const assetWidth = 8192;
  const foregroundSvgWidth = 5929;
  const floorHeight = 225;
  const floorTileWidth = 224;
  const layerSpeed = {
    background: 0.38,
    middle: 0.78,
    title: 1.2,
    chef: 1.2,
    foreground: 1.14
  };
  const cursorCss = "url('/cursors/retrogusto-cursor.svg') 5 5, auto";
  const pointerCursorCss = "url('/cursors/retrogusto-cursor.svg') 5 5, pointer";
  const titleLetters = 'Cucina'.split('');
  const chefQuote =
    'Il 30 di gennaio era ancora un cantiere, quindi si entrava con l\'elmetto, col giubbotto catarifrangente e le scarpe antinfortunistiche.';

  let stageEl: HTMLElement;
  let viewportWidth = $state(0);
  let viewportHeight = $state(0);
  let cameraX = $state(0);
  let narrativeProgress = $state(0);
  let helmetRotation = $state(0);
  let activeChefId = $state<'carlo' | undefined>();
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
  let isChefBubbleOpen = $state(false);
  let isHelmetVideoOpen = $state(false);
  let isSceneLoaded = $state(false);

  const helmetHotspot = {
    x: 1998,
    y: 436,
    width: 116,
    height: 104
  };
  const helmetVideoPlaceholder = {
    x: 2158,
    y: 292,
    width: 430,
    height: 248
  };

  const sceneScale = $derived(viewportHeight ? viewportHeight / sceneHeight : 1);
  const worldWidth = $derived(Math.max(viewportWidth, sceneWidth * sceneScale));
  const maxScrollX = $derived(Math.max(0, worldWidth - viewportWidth));

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const px = (value: number) => `${value.toFixed(2)}px`;

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
      `width: ${px(assetWidth * sceneScale)}`,
      `bottom: ${px(bottomOffset * sceneScale)}`,
      `transform: translate3d(${px(-cameraX * factor)}, 0, 0)`
    ].join(';');
  }

  function getTitleStyle() {
    return [
      `left: ${px(92 * sceneScale - cameraX * layerSpeed.title)}`,
      `top: ${px(viewportHeight / 2 - 132 * sceneScale)}`,
      `font-size: ${px(255 * sceneScale)}`
    ].join(';');
  }

  function getChefStyle() {
    return [
      `left: ${px(1100 * sceneScale - cameraX * layerSpeed.chef)}`,
      `bottom: ${px(viewportHeight / 20)}`,
      `width: ${px(250 * sceneScale)}`
    ].join(';');
  }

  function getForegroundRectStyle(rect: { x: number; y: number; width: number; height: number }) {
    const foregroundScale = (assetWidth / foregroundSvgWidth) * sceneScale;

    return [
      `left: ${px(rect.x * foregroundScale)}`,
      `top: ${px(rect.y * foregroundScale)}`,
      `width: ${px(rect.width * foregroundScale)}`,
      `height: ${px(rect.height * foregroundScale)}`
    ].join(';');
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault();
    scrollBy((event.deltaY + event.deltaX) * 1.05);
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
    const resizeObserver = new ResizeObserver(syncViewport);
    resizeObserver.observe(stageEl);
    syncViewport();

    import('$lib/phaser/kitchen-controller').then(({ mountKitchenController }) => {
      if (destroyed) return;
      kitchenController = mountKitchenController({
        sceneWidth,
        sceneHeight,
        chefX: 1100,
        chefWidth: 250,
        getViewport: () => ({ width: viewportWidth, height: viewportHeight }),
        onUpdate: (state) => {
          cameraX = state.cameraX;
          narrativeProgress = state.progress;
          helmetRotation = state.helmetRotation;
          activeChefId = state.activeChefId;
        }
      });
    });

    requestAnimationFrame(() => {
      isSceneLoaded = true;
    });
    window.addEventListener('keydown', onKeydown);

    return () => {
      destroyed = true;
      kitchenController?.destroy();
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeydown);
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
    <img src="/assets/cucina_background.svg" alt="" draggable="false" />
  </div>

  <div
    class="floor-layer reveal-layer"
    style={`height: ${px(floorHeight * sceneScale)}; background-size: ${px(floorTileWidth * sceneScale)} ${px(floorHeight * sceneScale)}; background-position-x: ${px(-cameraX)}; --reveal-delay: 160ms; --reveal-duration: 1120ms;`}
  ></div>

  <div
    class="parallax-layer reveal-layer middle-layer"
    style={`${getLayerStyle(layerSpeed.middle)}; --reveal-delay: 280ms;`}
  >
    <img src="/assets/cucina_layer3a.svg" alt="" draggable="false" />
  </div>

  <h1 class="scene-title" style={getTitleStyle()} aria-label="Cucina">
    {#each titleLetters as letter, index}
      <span style={`--letter-delay: ${280 + index * 70}ms`} aria-hidden="true">{letter}</span>
    {/each}
  </h1>

  <button
    class="chef-button reveal-object"
    class:is-open={isChefBubbleOpen}
    style={`${getChefStyle()}; --reveal-delay: 390ms;`}
    type="button"
    aria-label="Apri testimonianza Carlo Zarri"
    onpointerdown={(event) => event.stopPropagation()}
    onclick={() => {
      isChefBubbleOpen = !isChefBubbleOpen;
    }}
  >
    <span class="speech-bubble" aria-hidden={!isChefBubbleOpen}>
      <strong>Carlo Zarri</strong>
      <span>{chefQuote}</span>
    </span>
    <img src="/assets/npc_CarloZarri_alt1.svg" alt="" draggable="false" />
  </button>

  <div
    class="parallax-layer reveal-layer foreground-layer"
    style={`${getLayerStyle(layerSpeed.foreground, -180)}; --reveal-delay: 470ms;`}
  >
    <img src="/assets/cucina_layer1a.svg" alt="" draggable="false" />
    <button
      class="helmet-hotspot"
      style={getForegroundRectStyle(helmetHotspot)}
      type="button"
      aria-label="Apri placeholder video del casco"
      onpointerdown={(event) => event.stopPropagation()}
      onclick={() => {
        isHelmetVideoOpen = !isHelmetVideoOpen;
      }}
    >
      <img
        src="/assets/cucina_helmet.svg"
        style={`--helmet-rotation: ${helmetRotation.toFixed(3)}deg`}
        alt=""
        draggable="false"
        aria-hidden="true"
      />
    </button>

    {#if isHelmetVideoOpen}
      <div
        class="helmet-video-placeholder"
        style={getForegroundRectStyle(helmetVideoPlaceholder)}
        role="region"
        aria-label="Placeholder video casco"
        onpointerdown={(event) => event.stopPropagation()}
      ></div>
    {/if}
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
    -webkit-mask-image: linear-gradient(90deg, #000 0 62%, transparent 78%);
    mask-image: linear-gradient(90deg, #000 0 62%, transparent 78%);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: 260% 100%;
    mask-size: 260% 100%;
    -webkit-mask-position: 140% 0;
    mask-position: 140% 0;
  }

  .kitchen-stage.is-loaded .reveal-layer {
    animation: layerReveal var(--reveal-duration, 820ms) cubic-bezier(0.19, 1, 0.22, 1) var(--reveal-delay, 0ms) forwards;
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
    transform: translate3d(-0.42em, 0.24em, 0) scale(0.82);
  }

  .kitchen-stage.is-loaded .scene-title span {
    animation: titleLetterIn 360ms cubic-bezier(0.22, 1, 0.36, 1) var(--letter-delay, 0ms) forwards;
  }

  .chef-button {
    z-index: 5;
    display: block;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-text-primary);
    cursor: var(--kitchen-pointer-cursor);
  }

  .reveal-object {
    opacity: 0;
    transform: translate3d(-28px, 18px, 0) scale(0.96);
  }

  .kitchen-stage.is-loaded .reveal-object {
    animation: objectPopIn 440ms cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay, 0ms) forwards;
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
    right: -330px;
    bottom: calc(100% - 90px);
    box-sizing: border-box;
    display: grid;
    gap: 8px;
    width: min(500px, 62vw);
    padding: 18px 20px;
    border: 2px solid var(--color-border-primary);
    border-radius: var(--dialogue-radius);
    background: var(--color-surface-page);
    color: var(--color-text-primary);
    font-family: var(--font-text);
    font-size: clamp(12px, 1.35vw, 18px);
    font-weight: 400;
    line-height: 1.4;
    text-align: left;
    opacity: 0;
    transform: translate3d(0, 10px, 0);
    transition: opacity 160ms ease, transform 180ms ease;
    pointer-events: none;
  }

  .speech-bubble strong {
    font-size: 0.86em;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .chef-button.is-open .speech-bubble {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  .foreground-layer {
    z-index: 6;
  }

  .helmet-hotspot {
    position: absolute;
    z-index: 2;
    display: grid;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: var(--kitchen-pointer-cursor);
    pointer-events: auto;
  }

  .helmet-hotspot img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
    transform-origin: 78% 9%;
    transform: rotate(var(--helmet-rotation, 0deg));
    will-change: transform;
  }

  .helmet-hotspot:focus-visible {
    outline: none;
  }

  .helmet-video-placeholder {
    position: absolute;
    z-index: 3;
    box-sizing: border-box;
    display: grid;
    padding: 18px;
    border: 3px solid #2a4385;
    border-radius: var(--radius-s);
    background: var(--color-surface-page);
    pointer-events: auto;
  }

  @keyframes layerReveal {
    0% {
      opacity: 0;
      -webkit-mask-position: 140% 0;
      mask-position: 140% 0;
    }

    18% {
      opacity: 1;
    }

    100% {
      opacity: 1;
      -webkit-mask-position: 0 0;
      mask-position: 0 0;
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
      transform: translate3d(-28px, 18px, 0) scale(0.96);
    }

    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  @media (max-width: 760px) {
    .speech-bubble {
      right: -180px;
      width: min(360px, 74vw);
      padding: 14px 16px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal-layer {
      opacity: 1;
      -webkit-mask-image: none;
      mask-image: none;
      animation: none;
    }

    .reveal-object,
    .scene-title span,
    .helmet-hotspot img {
      opacity: 1;
      transform: none;
      animation: none;
    }
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import { clamp, px } from '$lib/scene/math';
  import { createViewportObserver } from '$lib/scene/viewport';

  let { isAudioMuted = false } = $props<{ isAudioMuted?: boolean }>();

  type OfficeAsset = {
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
    flipX?: boolean;
    flipY?: boolean;
    fit?: 'contain' | 'fill';
  };

  const sceneWidth = 31800;
  const sceneHeight = 982;
  const assetVersion = '20260617-office-figma-2';
  const asset = (name: string) => `/assets/office-figma/${name}?v=${assetVersion}`;

  const layerSpeed = {
    background: 0.42,
    middle: 0.74,
    title: 0.82,
    floor: 0.96,
    foreground: 1.08
  };

  const backgroundAssets: OfficeAsset[] = [
    { src: 'bg-plant.svg', x: 1489, y: 455, width: 99, height: 409 },
    { src: 'bg-shelf.svg', x: 1892, y: 310, width: 213, height: 166 },
    { src: 'bg-frame-1.svg', x: 2479, y: 223, width: 109, height: 174 },
    { src: 'bg-frame-2.svg', x: 2685, y: 325, width: 109, height: 174 },
    { src: 'bg-board-small.svg', x: 3137, y: 351, width: 231, height: 166 },
    { src: 'bg-mirror.svg', x: 3838, y: 250, width: 126, height: 126 },
    { src: 'bg-long-cabinet-1.svg', x: 4325, y: 575, width: 972, height: 291 },
    { src: 'bg-frame-3.svg', x: 4999, y: 251, width: 129, height: 186 },
    { src: 'bg-shelf-2.svg', x: 5411, y: 317, width: 254, height: 129 },
    { src: 'bg-closed-cabinet.svg', x: 6359, y: 670, width: 234, height: 195 },
    { src: 'bg-car-window-frame.svg', x: 6593, y: 218, width: 520, height: 391 },
    { src: 'bg-car-window-car.svg', x: 6625, y: 371, width: 475, height: 185 },
    { src: 'bg-shelf-plant.svg', x: 7621, y: 363, width: 411, height: 100 },
    { src: 'bg-door.svg', x: 8214, y: 211, width: 300, height: 656 },
    { src: 'bg-magazine-rack.svg', x: 9001, y: 748, width: 136, height: 123 },
    { src: 'bg-bookcase.svg', x: 9322, y: 208, width: 219, height: 658 },
    { src: 'bg-boxes.svg', x: 9725, y: 673, width: 129, height: 193 },
    { src: 'bg-boxes.svg', x: 10312, y: 673, width: 129, height: 193 },
    { src: 'bg-long-cabinet-2.svg', x: 12255, y: 650, width: 691, height: 207 },
    { src: 'bg-desk-monitor.svg', x: 13502, y: 575, width: 609, height: 414 },
    { src: 'bg-chair-front.svg', x: 13564, y: 666, width: 187, height: 365 },
    { src: 'bg-long-cabinet-3.svg', x: 18270, y: 651, width: 691, height: 207 }
  ];

  const middleAssets: OfficeAsset[] = [
    { src: 'mid-printer-cabinet.svg', x: 1819, y: 537, width: 546, height: 346 },
    { src: 'mid-printer-detail.svg', x: 1899, y: 791, width: 85, height: 80 },
    { src: 'mid-bin.svg', x: 3401, y: 780, width: 87, height: 102 },
    { src: 'mid-desk.svg', x: 3535, y: 464, width: 814, height: 418 },
    { src: 'mid-open-cabinet.svg', x: 5907, y: 213, width: 259, height: 682 },
    { src: 'mid-water.svg', x: 7360, y: 310, width: 127, height: 574 },
    { src: 'mid-coffee.svg', x: 8805, y: 447, width: 261, height: 454 },
    { src: 'mid-chair-front.svg', x: 9320, y: 563, width: 164, height: 321 },
    { src: 'mid-chair-front.svg', x: 9717, y: 563, width: 164, height: 321 },
    { src: 'mid-cabinet-doors.svg', x: 10701, y: 594, width: 344, height: 290 },
    { src: 'mid-table-2.svg', x: 11498, y: 578, width: 501, height: 214 },
    { src: 'mid-chair-profile-2.svg', x: 11999, y: 543, width: 198, height: 341, flipY: true },
    { src: 'mid-table.svg', x: 12915, y: 484, width: 323, height: 264 },
    { src: 'mid-chair-profile.svg', x: 13283, y: 538, width: 202, height: 346, flipY: true },
    { src: 'mid-desk-low.svg', x: 14413, y: 578, width: 732, height: 306 },
    { src: 'mid-desk-low-left.svg', x: 14483, y: 657, width: 125, height: 226 },
    { src: 'mid-desk-low-right.svg', x: 14948, y: 658, width: 125, height: 226 }
  ];

  const foregroundAssets: OfficeAsset[] = [
    { src: 'front-drawer.svg', x: 2591, y: 703, width: 210, height: 280 },
    { src: 'front-drawer.svg', x: 2814, y: 703, width: 210, height: 280 },
    { src: 'front-folder-1.svg', x: 2640, y: 592, width: 26, height: 110 },
    { src: 'front-folder-2.svg', x: 2667, y: 592, width: 26, height: 110 },
    { src: 'front-folder-3.svg', x: 2901, y: 592, width: 26, height: 110 },
    { src: 'front-folder-4.svg', x: 2928, y: 592, width: 26, height: 110 },
    { src: 'front-chair-profile.svg', x: 4869, y: 568, width: 241, height: 415 },
    { src: 'front-long-table.svg', x: 5117, y: 600, width: 1095, height: 380 },
    { src: 'front-chair-profile-flip.svg', x: 6186, y: 568, width: 241, height: 415, flipY: true },
    { src: 'front-magazine-rack.svg', x: 6490, y: 805, width: 184, height: 166 },
    { src: 'front-low-table.svg', x: 7921, y: 743, width: 570, height: 242 },
    { src: 'front-curved-chair.svg', x: 7619, y: 616, width: 229, height: 366 },
    { src: 'front-curved-chair-flip.svg', x: 8564, y: 616, width: 230, height: 366, flipY: true },
    { src: 'front-lamp.svg', x: 8098, y: 600, width: 79, height: 183, flipY: true },
    { src: 'front-lamp.svg', x: 8206, y: 600, width: 79, height: 183, flipY: true },
    { src: 'front-cabinet-doors.svg', x: 9997, y: 632, width: 415, height: 350 },
    { src: 'front-curved-chair-2.svg', x: 11772, y: 603, width: 236, height: 378 },
    { src: 'front-table-long.svg', x: 11937, y: 687, width: 1024, height: 293 },
    { src: 'front-curved-chair-flip.svg', x: 13101, y: 616, width: 230, height: 366, flipX: true },
    { src: 'fg-map-base.svg', x: 16158, y: 390, width: 509, height: 334 },
    { src: 'fg-map-lines.svg', x: 16224, y: 455, width: 358, height: 264 },
    { src: 'fg-desk-monitor.svg', x: 17208, y: 512, width: 694, height: 472 },
    { src: 'fg-desk-monitor-chair.svg', x: 17279, y: 616, width: 213, height: 416 },
    { src: 'front-cabinet.svg', x: 19056, y: 684, width: 593, height: 300 },
    { src: 'front-cabinet-detail.svg', x: 19175, y: 830, width: 90, height: 82 },
    { src: 'fg-desk-low.svg', x: 20726, y: 726, width: 378, height: 158 },
    { src: 'fg-desk-low-cabinet.svg', x: 21002, y: 767, width: 65, height: 117 },
    { src: 'fg-phone.svg', x: 20751, y: 659, width: 93, height: 77 },
    { src: 'fg-chair.svg', x: 20862, y: 700, width: 106, height: 207 },
    { src: 'fg-printer.svg', x: 30394, y: 515, width: 377, height: 368 }
  ];

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
    foreground: 1
  });
  const sceneScale = $derived(viewportHeight ? viewportHeight / sceneHeight : 1);
  const worldWidth = $derived(Math.max(viewportWidth, sceneWidth * sceneScale));
  const maxScrollX = $derived(Math.max(0, worldWidth - viewportWidth));
  const progress = $derived(maxScrollX > 0 ? clamp(cameraX / maxScrollX, 0, 1) : 0);
  const scenePx = (value: number) => px(value, 2);
  const worldStyle = $derived(`width: ${scenePx(worldWidth)}; height: ${scenePx(viewportHeight)}`);

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

  function getAssetStyle(item: OfficeAsset, speed: number) {
    const parallaxEnd = maxScrollX * (1 - speed);

    return [
      `--asset-x: ${scenePx(item.x * sceneScale)}`,
      `--asset-y: ${scenePx(item.y * sceneScale)}`,
      `--parallax-end: ${scenePx(parallaxEnd)}`,
      `width: ${scenePx(item.width * sceneScale)}`,
      `height: ${scenePx(item.height * sceneScale)}`,
      `scale: ${item.flipX ? -1 : 1} ${item.flipY ? -1 : 1}`
    ].join(';');
  }

  function getTitleStyle() {
    const titleFontSize = Math.min(
      150 * sceneScale,
      Math.max(56, (viewportWidth - 48) / 4.55)
    );
    const titleX = viewportWidth < 640 ? 24 : 93 * sceneScale;

    return [
      `--asset-x: ${scenePx(titleX)}`,
      `--asset-y: ${scenePx(285 * sceneScale)}`,
      `--parallax-end: ${scenePx(maxScrollX * (1 - resolvedLayerSpeed.title))}`,
      `font-size: ${scenePx(titleFontSize)}`,
      `scale: 1 1`
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
  <div class="office-world" style={worldStyle}>
    <img
      class="office-asset reveal-layer floor-layer"
      src={asset('floor.svg')}
      alt=""
      draggable="false"
      style={getAssetStyle(
        { src: 'floor.svg', x: -226, y: 859, width: 37330, height: 123 },
        resolvedLayerSpeed.floor
      )}
    />

    {#each backgroundAssets as item (item.src + item.x)}
      <img
        class="office-asset reveal-layer background-layer"
        src={asset(item.src)}
        alt=""
        draggable="false"
        style={`${getAssetStyle(item, resolvedLayerSpeed.background)}; --reveal-delay: 120ms; object-fit: ${item.fit ?? 'fill'};`}
      />
    {/each}

    {#each middleAssets as item (item.src + item.x + item.y)}
      <img
        class="office-asset reveal-layer middle-layer"
        src={asset(item.src)}
        alt=""
        draggable="false"
        style={`${getAssetStyle(item, resolvedLayerSpeed.middle)}; --reveal-delay: 190ms; object-fit: ${item.fit ?? 'fill'};`}
      />
    {/each}

    <h1 class="office-title" style={getTitleStyle()} aria-label="Ufficio">Ufficio</h1>

    {#each foregroundAssets as item (item.src + item.x + item.y)}
    <img
      class="office-asset reveal-layer foreground-layer"
      src={asset(item.src)}
      alt=""
      draggable="false"
      style={`${getAssetStyle(item, resolvedLayerSpeed.foreground)}; --reveal-delay: 260ms; object-fit: ${item.fit ?? 'fill'};`}
    />
    {/each}
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
    scroll-timeline-axis: inline;
    scroll-timeline-name: --office-scroll;
    user-select: none;
    overscroll-behavior: contain;
    touch-action: pan-x;
  }

  .office-stage::-webkit-scrollbar {
    display: none;
  }

  .office-world {
    position: relative;
    min-width: 100%;
    min-height: 100svh;
    overflow: hidden;
  }

  .office-stage.is-dragging {
    cursor: grabbing;
  }

  .office-asset,
  .office-title {
    position: absolute;
    left: 0;
    top: 0;
    animation: officeParallax linear both;
    animation-timeline: --office-scroll;
    translate: var(--asset-x, 0) var(--asset-y, 0);
    will-change: translate;
  }

  .office-asset {
    display: block;
    pointer-events: none;
    user-select: none;
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
    z-index: 2;
  }

  .middle-layer {
    z-index: 3;
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
    white-space: nowrap;
  }

  @keyframes officeParallax {
    to {
      translate: calc(var(--asset-x, 0px) + var(--parallax-end, 0px)) var(--asset-y, 0px);
    }
  }

  .foreground-layer {
    z-index: 5;
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

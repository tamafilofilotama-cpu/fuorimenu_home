<script lang="ts">
  import { gsap } from 'gsap';
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
  let { isAudioMuted = false } = $props<{ isAudioMuted?: boolean }>();
  const { bridge } = sceneController;
  const kitchenAssetVersion = '20260616-parallax-4';
  const kitchenAsset = (name: string) => `/assets/${name}?v=${kitchenAssetVersion}`;
  const testimonialHandoffSticky = {
    maxFactor: 0.66,
    minFactor: 0.22,
    releaseAfterNext: 0.009,
    zoneBeforeNext: 0.064
  };
  const tailStartX = 23600;
  const tailWidth = 23000;
  const tailTop = -105;
  const tailHeight = 1117;
  const middleLayerFloorOffset = 28;
  const toolShedMessage =
    'li devi trattare bene, devi dargli dei pasti molto caldi, magari dargli anche il tè o il caffè 24 ore al giorno';
  const carloSpeech =
    "C'erano grosse difficoltà su Santa Giulia. Il 30 di gennaio era ancora un cantiere, quindi si entrava con l'elmetto col giubbotto catarifrangente; la situazione era veramente drammatica.\nDa dicembre 2025 abbiamo cambiato completamente la strategia per quel sito, perché era un sito che si sapeva che avrebbe avuto delle grosse difficoltà, perché a volte si faceva anche fino a 11.000 spettatori per tre gare al giorno.";
  const faustoSecondAudioPauseMs = 700;
  const faustoSecondAudioStartTime = 25.9;
  type KitchenTestimonialId = 'carlo' | 'paganini' | 'fausto';
  type KitchenTestimonial = {
    id: KitchenTestimonialId;
    ariaLabel: string;
    audioStartTime?: number;
    audioSrc?: string;
    bubbleTop?: string;
    dialogueVisibleThreshold?: number;
    enterProgress: number;
    exitProgress?: number;
    imageAlt: string;
    imageSrc: string;
    metaLabel: string;
    name: string;
    revealDurationSeconds?: number;
    rolePrefix: string;
    revealSpeechWithAudio?: boolean;
    speech: string;
    widthMax?: number;
    widthMin?: number;
    widthVw?: number;
    bottomOffset?: number;
  };
  const kitchenTestimonials: KitchenTestimonial[] = [
    {
      id: 'carlo',
      ariaLabel: 'Testimonianza Carlo Zarri',
      audioSrc: '/sound/carlo.mp3',
      bubbleTop: 'clamp(58px, 7vh, 100px)',
      enterProgress: 0.02,
      exitProgress: 0.155,
      imageAlt: '',
      imageSrc: '/assets/npc_CarloZarri_alt1.svg',
      metaLabel: 'Chief Executive Chef - Carlo Zarri',
      name: 'Carlo Zarri',
      rolePrefix: 'Chief Executive Chef - ',
      revealSpeechWithAudio: true,
      speech: carloSpeech,
      bottomOffset: 660
    },
    {
      id: 'paganini',
      ariaLabel: 'Testimonianza Stefano Paganini',
      audioSrc: '/sound/stefano.mp3',
      bubbleTop: 'clamp(72px, 9vh, 126px)',
      enterProgress: 0.168,
      exitProgress: 0.235,
      imageAlt: '',
      imageSrc: '/images/stefano-paganini-figma.png',
      metaLabel: 'Chef - Stefano Paganini',
      name: 'Stefano Paganini',
      rolePrefix: 'Chef - ',
      revealSpeechWithAudio: true,
      speech:
        "Da noi arrivavano ogni tre giorni due barra tre bancali di roba fresca e devi fare in maniera che non ti mancasse mai niente perché c'era sempre la paura, porca miseria se nevica, non possono arrivare con la roba quindi dobbiamo avere le robe in più. Lo standard qualitativo era molto alto perché erano tutti prodotti freschi, che non è scontato eh.",
      widthMax: 390,
      widthMin: 330,
      widthVw: 0.255,
      bottomOffset: 180
    },
    {
      id: 'fausto',
      ariaLabel: 'Testimonianza Fausto',
      audioStartTime: 17.8,
      audioSrc: '/sound/fausto.mp3',
      bubbleTop: 'clamp(16px, 2.5vh, 38px)',
      dialogueVisibleThreshold: 0.16,
      enterProgress: 0.248,
      exitProgress: 0.315,
      imageAlt: '',
      imageSrc: '/images/fausto.png',
      metaLabel: 'Chef - Fausto',
      name: 'Fausto',
      revealDurationSeconds: 12,
      rolePrefix: 'Chef - ',
      revealSpeechWithAudio: true,
      speech:
        "Sei istituti alberghieri, tra cui l'Istituto di Busto Arsizio, l'Istituto Lagrange di Milano, l'Istituto di Bormio, l'Istituto di Cortina e l'Istituto di Brunico ci hanno aiutato per effettuare tutte le tipologie di servizi.",
      widthMax: 390,
      widthMin: 330,
      widthVw: 0.255,
      bottomOffset: 480
    }
  ];
  const carloTestimonial = kitchenTestimonials[0];
  const paganiniTestimonial = kitchenTestimonials[1];
  const faustoTestimonial = kitchenTestimonials[2];
  const testimonialAudioState: Record<
    KitchenTestimonialId,
    {
      hasPlayed: boolean;
      hasUnlocked: boolean;
      isStarting: boolean;
      isStopping: boolean;
      unlockPromise?: Promise<void>;
      playbackToken: number;
    }
  > = {
    carlo: {
      hasPlayed: false,
      hasUnlocked: false,
      isStarting: false,
      isStopping: false,
      playbackToken: 0
    },
    paganini: {
      hasPlayed: false,
      hasUnlocked: false,
      isStarting: false,
      isStopping: false,
      playbackToken: 0
    },
    fausto: {
      hasPlayed: false,
      hasUnlocked: false,
      isStarting: false,
      isStopping: false,
      playbackToken: 0
    }
  };

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
  let toolShedAudioEl: HTMLAudioElement;
  let standMixerAudioEl: HTMLAudioElement;
  let constructionAudioEl: HTMLAudioElement;
  let kitchenAmbientAudioEl: HTMLAudioElement;
  let carloAudioEl: HTMLAudioElement;
  let paganiniAudioEl: HTMLAudioElement;
  let faustoAudioEl: HTMLAudioElement;
  let fausto2AudioEl: HTMLAudioElement;
  let faustoSecondAudioTimer: ReturnType<typeof setTimeout> | undefined;
  let hasPlayedToolShedHover = false;
  let hasPlayedStandMixerHover = false;
  let isAmbientAudioStarted = false;
  let activeTestimonialAudioId = $state<KitchenTestimonialId>();
  let dismissedTestimonialIds = $state<Record<KitchenTestimonialId, boolean>>({
    carlo: false,
    paganini: false,
    fausto: false
  });
  let testimonialRevealProgress = $state<Record<KitchenTestimonialId, number>>({
    carlo: 0,
    paganini: 0,
    fausto: 0
  });
  let prefersReducedMotion = $state(false);
  let toolShedAudioContext: AudioContext | undefined;
  let toolShedAudioSource: MediaElementAudioSourceNode | undefined;
  let isDragging = $state(false);
  let isSceneLoaded = $state(false);

  const resolvedLayerSpeed = $derived({
    background: prefersReducedMotion ? 1 : layerSpeed.background,
    middle: prefersReducedMotion ? 1 : layerSpeed.middle,
    title: prefersReducedMotion ? 1 : layerSpeed.title,
    chef: prefersReducedMotion ? 1 : layerSpeed.chef,
    foreground: prefersReducedMotion ? 1 : layerSpeed.foreground
  });
  const sceneScale = $derived(viewportHeight ? viewportHeight / sceneHeight : 1);
  const worldWidth = $derived(Math.max(viewportWidth, sceneWidth * sceneScale));
  const maxScrollX = $derived(Math.max(0, worldWidth - viewportWidth));

  const scenePx = (value: number) => px(value, 2);
  const testimonialPinnedLeftInset = $derived(Math.max(16, Math.min(48, viewportWidth * 0.028)));

  function syncViewport() {
    if (!stageEl) return;
    viewportWidth = stageEl.clientWidth;
    viewportHeight = stageEl.clientHeight;
    cameraX = clamp(cameraX, 0, maxScrollX);
    kitchenController?.resize();
  }

  function scrollBy(delta: number) {
    kitchenController?.scrollBy(applyTestimonialHandoffResistance(delta));
  }

  function getNextTestimonial(testimonial: KitchenTestimonial) {
    const index = kitchenTestimonials.findIndex((candidate) => candidate.id === testimonial.id);
    return index >= 0 ? kitchenTestimonials[index + 1] : undefined;
  }

  function isTestimonialAudioUnfinished(testimonial: KitchenTestimonial) {
    const audio = getTestimonialAudioEl(testimonial);
    const state = testimonialAudioState[testimonial.id];

    if (state.isStarting) return true;
    if (activeTestimonialAudioId !== testimonial.id || !audio || audio.paused || audio.ended) {
      return false;
    }

    return !Number.isFinite(audio.duration) || audio.currentTime < audio.duration - 0.2;
  }

  function applyTestimonialHandoffResistance(delta: number) {
    if (delta <= 0 || !activeTestimonialAudioId) return delta;

    const activeTestimonial = kitchenTestimonials.find(
      (testimonial) => testimonial.id === activeTestimonialAudioId
    );
    if (!activeTestimonial || !isTestimonialAudioUnfinished(activeTestimonial)) return delta;

    const nextTestimonial = getNextTestimonial(activeTestimonial);
    if (!nextTestimonial) return delta;

    const stickyStart = Math.max(
      activeTestimonial.enterProgress,
      nextTestimonial.enterProgress - testimonialHandoffSticky.zoneBeforeNext
    );
    const stickyEnd = nextTestimonial.enterProgress + testimonialHandoffSticky.releaseAfterNext;
    if (narrativeProgress < stickyStart || narrativeProgress > stickyEnd) return delta;

    const releaseProgress = clamp(
      (narrativeProgress - stickyStart) / Math.max(stickyEnd - stickyStart, 0.001),
      0,
      1
    );
    const factor =
      testimonialHandoffSticky.maxFactor -
      smoothProgress(releaseProgress) *
        (testimonialHandoffSticky.maxFactor - testimonialHandoffSticky.minFactor);

    return delta * factor;
  }

  function getLayerStyle(factor: number, bottomOffset = 0, verticalOffset = 0) {
    return [
      `width: ${scenePx(assetWidth * sceneScale)}`,
      `bottom: ${scenePx((bottomOffset - verticalOffset) * sceneScale)}`,
      `transform: translate3d(${scenePx(-cameraX * factor)}, 0, 0)`
    ].join(';');
  }

  function getTailLayerStyle(factor: number, verticalOffset = 0) {
    return [
      `width: ${scenePx(tailWidth * sceneScale)}`,
      `height: ${scenePx(tailHeight * sceneScale)}`,
      `top: ${scenePx((tailTop + verticalOffset) * sceneScale)}`,
      `transform: translate3d(${scenePx(tailStartX * sceneScale - cameraX * factor)}, 0, 0)`
    ].join(';');
  }

  function getForegroundLayerStyle() {
    const foregroundScale = (assetWidth / foregroundSvgWidth) * sceneScale;

    return [
      `width: ${scenePx(assetWidth * sceneScale)}`,
      `height: ${scenePx(foregroundSvgHeight * foregroundScale)}`,
      `bottom: ${scenePx(foregroundBottomOffset * sceneScale)}`,
      `transform: translate3d(${scenePx(-cameraX * resolvedLayerSpeed.foreground)}, 0, 0)`
    ].join(';');
  }

  function getTitleStyle() {
    return [
      `left: ${scenePx(92 * sceneScale - cameraX * resolvedLayerSpeed.title)}`,
      `top: ${scenePx(viewportHeight / 2 - 132 * sceneScale)}`,
      `font-size: ${scenePx(180 * sceneScale)}`
    ].join(';');
  }

  function getToolShedStyle() {
    const x = 5500;
    const width = 166.747;
    const height = 180.446;
    const y = 595 - height;

    return [
      `width: ${scenePx(width * sceneScale)}`,
      `height: ${scenePx(height * sceneScale)}`,
      `bottom: ${scenePx((sceneHeight - y - height) * sceneScale)}`,
      `--tool-shed-message-left: ${scenePx(190 * sceneScale)}`,
      `--tool-shed-message-top: ${scenePx(36 * sceneScale)}`,
      `--tool-shed-message-width: ${scenePx(322 * sceneScale)}`,
      `--tool-shed-message-padding: ${scenePx(20 * sceneScale)}`,
      `--tool-shed-message-font-size: ${scenePx(16 * sceneScale)}`,
      `--tool-shed-arrow-top: ${scenePx(64 * sceneScale)}`,
      `--tool-shed-arrow-size: ${scenePx(18 * sceneScale)}`,
      `transform: translate3d(${scenePx(x * sceneScale - cameraX * resolvedLayerSpeed.foreground)}, 0, 0)`
    ].join(';');
  }

  function getStandMixerStyle() {
    const x = 6690;
    const width = 154;
    const height = 160;
    const y = 545 - height;

    return [
      `width: ${scenePx(width * sceneScale)}`,
      `height: ${scenePx(height * sceneScale)}`,
      `bottom: ${scenePx((sceneHeight - y - height) * sceneScale)}`,
      `--stand-mixer-message-left: ${scenePx(168 * sceneScale)}`,
      `--stand-mixer-message-top: ${scenePx(8 * sceneScale)}`,
      `--stand-mixer-message-width: ${scenePx(322 * sceneScale)}`,
      `--stand-mixer-message-padding: ${scenePx(20 * sceneScale)}`,
      `--stand-mixer-message-font-size: ${scenePx(16 * sceneScale)}`,
      `--stand-mixer-arrow-left: ${scenePx(168 * sceneScale)}`,
      `--stand-mixer-arrow-top: ${scenePx(102 * sceneScale)}`,
      `--stand-mixer-arrow-size: ${scenePx(18 * sceneScale)}`,
      `transform: translate3d(${scenePx(x * sceneScale - cameraX * resolvedLayerSpeed.foreground)}, 0, 0)`
    ].join(';');
  }

  function smoothProgress(value: number) {
    return value * value * (3 - 2 * value);
  }

  function getRawTestimonialPresence(testimonial: KitchenTestimonial) {
    const enter = clamp((narrativeProgress - testimonial.enterProgress) / 0.012, 0, 1);
    const exit =
      testimonial.exitProgress === undefined
        ? 1
        : 1 - clamp((narrativeProgress - testimonial.exitProgress) / 0.012, 0, 1);

    return clamp(smoothProgress(enter) * smoothProgress(exit), 0, 1);
  }

  function getTestimonialPresence(testimonial: KitchenTestimonial) {
    if (dismissedTestimonialIds[testimonial.id]) return 0;
    return getRawTestimonialPresence(testimonial);
  }

  function isTestimonialInDialogueRange(testimonial: KitchenTestimonial) {
    return getRawTestimonialPresence(testimonial) > (testimonial.dialogueVisibleThreshold ?? 0.94);
  }

  function isTestimonialDialogueVisible(testimonial: KitchenTestimonial) {
    return getTestimonialPresence(testimonial) > (testimonial.dialogueVisibleThreshold ?? 0.94);
  }

  function getTestimonialStyle(testimonial: KitchenTestimonial) {
    const presence = getTestimonialPresence(testimonial);
    const entryY = (1 - presence) * Math.max(420, Math.min(560, viewportHeight * 0.58));
    const width = Math.max(
      testimonial.widthMin ?? 340,
      Math.min(testimonial.widthMax ?? 400, viewportWidth * (testimonial.widthVw ?? 0.265))
    );
    const bottomOffset = testimonial.bottomOffset ?? 660;

    return [
      `left: ${scenePx(testimonialPinnedLeftInset)}`,
      `bottom: ${scenePx(-bottomOffset)}`,
      `width: ${scenePx(width)}`,
      `--chef-entry-y: ${scenePx(entryY)}`,
      `--chef-entry-opacity: ${presence.toFixed(3)}`,
      `--speech-bubble-top: ${testimonial.bubbleTop ?? 'clamp(128px, 16vh, 188px)'}`
    ].join(';');
  }

  function getVisibleSpeech(testimonial: KitchenTestimonial) {
    if (!testimonial.revealSpeechWithAudio) return testimonial.speech;

    const visibleLength = Math.ceil(
      testimonial.speech.length * testimonialRevealProgress[testimonial.id]
    );

    return testimonial.speech.slice(0, visibleLength);
  }

  function resetTestimonialSpeechReveal(testimonial: KitchenTestimonial) {
    testimonialRevealProgress[testimonial.id] = testimonial.revealSpeechWithAudio ? 0 : 1;
  }

  function resetTestimonialReplay(testimonial: KitchenTestimonial) {
    testimonialAudioState[testimonial.id].hasPlayed = false;
    dismissedTestimonialIds[testimonial.id] = false;
    resetTestimonialSpeechReveal(testimonial);
    if (testimonial.id === 'fausto') clearFaustoSecondAudioTimer();
  }

  function completeTestimonialSpeechReveal(testimonial: KitchenTestimonial) {
    testimonialRevealProgress[testimonial.id] = 1;
  }

  function finishTestimonialDialogue(testimonial: KitchenTestimonial) {
    completeTestimonialSpeechReveal(testimonial);
    dismissedTestimonialIds[testimonial.id] = true;
    if (activeTestimonialAudioId === testimonial.id) activeTestimonialAudioId = undefined;
  }

  function clearFaustoSecondAudioTimer() {
    if (!faustoSecondAudioTimer) return;
    clearTimeout(faustoSecondAudioTimer);
    faustoSecondAudioTimer = undefined;
  }

  function queueFaustoSecondAudio() {
    clearFaustoSecondAudioTimer();
    activeTestimonialAudioId = 'fausto';
    faustoSecondAudioTimer = setTimeout(() => {
      faustoSecondAudioTimer = undefined;
      void playFaustoSecondAudio();
    }, faustoSecondAudioPauseMs);
  }

  async function playFaustoSecondAudio() {
    if (isAudioMuted || dismissedTestimonialIds.fausto || !fausto2AudioEl) return;

    gsap.killTweensOf(fausto2AudioEl);
    fausto2AudioEl.pause();
    fausto2AudioEl.currentTime = faustoSecondAudioStartTime;
    fausto2AudioEl.muted = false;
    fausto2AudioEl.volume = 1;
    activeTestimonialAudioId = 'fausto';

    try {
      await fausto2AudioEl.play();
    } catch {
      if (activeTestimonialAudioId === 'fausto') activeTestimonialAudioId = undefined;
    }
  }

  function finishFaustoFirstDialogue() {
    completeTestimonialSpeechReveal(faustoTestimonial);
    queueFaustoSecondAudio();
  }

  function syncTestimonialSpeechReveal(testimonial: KitchenTestimonial) {
    const audio = getTestimonialAudioEl(testimonial);
    if (!testimonial.revealSpeechWithAudio || !audio) return;

    const startTime = testimonial.audioStartTime ?? 0;
    const audioDuration =
      Number.isFinite(audio.duration) && audio.duration > startTime
        ? audio.duration - startTime
        : 1;
    const revealDuration = testimonial.revealDurationSeconds ?? audioDuration;
    testimonialRevealProgress[testimonial.id] = clamp(
      (audio.currentTime - startTime) / Math.max(revealDuration, 0.001),
      0,
      1
    );
  }

  function onWheel(event: WheelEvent) {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

    event.preventDefault();
    void startAmbientAudio();
    unlockRelevantTestimonialAudio();
    scrollBy(delta * 1.05);
  }

  function onPointerDown(event: PointerEvent) {
    isDragging = true;
    void startAmbientAudio();
    unlockRelevantTestimonialAudio();
    kitchenController?.beginDrag(event.clientX);
    stageEl.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (!isDragging) return;
    kitchenController?.dragTo(event.clientX);
    unlockRelevantTestimonialAudio();
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
    void startAmbientAudio();
    unlockRelevantTestimonialAudio();
    scrollBy(event.key === 'ArrowLeft' ? -42 : 42);
  }

  function boostToolShedAudio() {
    if (!toolShedAudioEl || toolShedAudioSource) return;

    toolShedAudioContext = new AudioContext();
    toolShedAudioSource = toolShedAudioContext.createMediaElementSource(toolShedAudioEl);
    const gain = toolShedAudioContext.createGain();
    gain.gain.value = 1.35;
    toolShedAudioSource.connect(gain);
    gain.connect(toolShedAudioContext.destination);
  }

  function playHoverSound(audio: HTMLAudioElement | undefined, volume = 0.78) {
    if (isAudioMuted || !audio) return;
    audio.pause();
    audio.currentTime = 0.35;
    audio.volume = volume;
    void audio.play().catch(() => {});
  }

  function getKitchenAmbientMix() {
    if (!viewportWidth) return 0;

    const standMixerCenterX = (6690 + 77) * sceneScale - cameraX * resolvedLayerSpeed.foreground;
    const fadeStartX = viewportWidth * 0.9;
    const fadeEndX = viewportWidth * 0.46;

    return clamp((fadeStartX - standMixerCenterX) / (fadeStartX - fadeEndX), 0, 1);
  }

  function setAmbientAudioVolumes() {
    const mix = getKitchenAmbientMix();
    const voiceDuck = activeTestimonialAudioId ? 0.18 : 1;
    const fadeDuration = activeTestimonialAudioId ? 0.36 : 0.72;
    const constructionVolume = isAudioMuted ? 0 : 0.13 * (1 - mix) * voiceDuck;
    const kitchenVolume = isAudioMuted ? 0 : 0.26 * mix * voiceDuck;

    if (constructionAudioEl) {
      gsap.to(constructionAudioEl, {
        volume: constructionVolume,
        duration: fadeDuration,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (kitchenAmbientAudioEl) {
      gsap.to(kitchenAmbientAudioEl, {
        volume: kitchenVolume,
        duration: fadeDuration,
        ease: 'power2.out',
        overwrite: true
      });
    }
  }

  async function startAmbientAudio() {
    if (isAudioMuted || isAmbientAudioStarted || !constructionAudioEl || !kitchenAmbientAudioEl) {
      return;
    }

    constructionAudioEl.loop = true;
    kitchenAmbientAudioEl.loop = true;
    setAmbientAudioVolumes();

    try {
      await Promise.all([constructionAudioEl.play(), kitchenAmbientAudioEl.play()]);
      isAmbientAudioStarted = true;
    } catch {
      isAmbientAudioStarted = false;
    }
  }

  $effect(() => {
    setAmbientAudioVolumes();

    if (!isAudioMuted) {
      void startAmbientAudio();
      return;
    }

    toolShedAudioEl?.pause();
    standMixerAudioEl?.pause();
    pauseAllTestimonialAudioForMute();
    constructionAudioEl?.pause();
    kitchenAmbientAudioEl?.pause();
    isAmbientAudioStarted = false;
  });

  $effect(() => {
    if (isAudioMuted) return;

    kitchenTestimonials.forEach((testimonial) => {
      const state = testimonialAudioState[testimonial.id];
      const audio = getTestimonialAudioEl(testimonial);
      const isInDialogueRange = isTestimonialInDialogueRange(testimonial);
      const isDialogueVisible = isTestimonialDialogueVisible(testimonial);

      if (isDialogueVisible) {
        if (!state.hasPlayed && !state.isStarting) void playTestimonialAudio(testimonial);
        return;
      }

      if (!isInDialogueRange && (state.hasPlayed || dismissedTestimonialIds[testimonial.id])) {
        resetTestimonialReplay(testimonial);
      }

      if (
        !state.isStopping &&
        (activeTestimonialAudioId === testimonial.id || state.isStarting || !audio?.paused)
      ) {
        stopTestimonialAudio(testimonial);
      }
    });
  });

  function playToolShedHoverSound() {
    if (hasPlayedToolShedHover) return;
    hasPlayedToolShedHover = true;
    boostToolShedAudio();
    void toolShedAudioContext?.resume();
    playHoverSound(toolShedAudioEl, 0.34);
  }

  function resetToolShedHoverSound() {
    hasPlayedToolShedHover = false;
  }

  function playStandMixerHoverSound() {
    if (hasPlayedStandMixerHover) return;
    hasPlayedStandMixerHover = true;
    playHoverSound(standMixerAudioEl, 0.24);
  }

  function resetStandMixerHoverSound() {
    hasPlayedStandMixerHover = false;
  }

  function getTestimonialAudioEl(testimonial: KitchenTestimonial) {
    if (testimonial.id === 'carlo') return carloAudioEl;
    if (testimonial.id === 'paganini') return paganiniAudioEl;
    if (testimonial.id === 'fausto') return faustoAudioEl;
    return undefined;
  }

  function getActiveTestimonialAudioEl(testimonial: KitchenTestimonial) {
    if (testimonial.id === 'fausto' && fausto2AudioEl && !fausto2AudioEl.paused) {
      return fausto2AudioEl;
    }

    return getTestimonialAudioEl(testimonial);
  }

  function pauseAllTestimonialAudioForMute() {
    clearFaustoSecondAudioTimer();
    kitchenTestimonials.forEach((testimonial) => {
      const state = testimonialAudioState[testimonial.id];
      const audioElements = [getTestimonialAudioEl(testimonial)];
      if (testimonial.id === 'fausto') audioElements.push(fausto2AudioEl);

      state.playbackToken += 1;
      state.isStarting = false;
      state.isStopping = false;

      audioElements.forEach((audio) => {
        if (!audio) return;
        gsap.killTweensOf(audio);
        audio.pause();
        audio.volume = 1;
      });
    });

    activeTestimonialAudioId = undefined;
  }

  function unlockRelevantTestimonialAudio() {
    kitchenTestimonials.forEach((testimonial) => {
      const unlockStart = testimonial.enterProgress - 0.04;
      const unlockEnd = (testimonial.exitProgress ?? testimonial.enterProgress + 0.06) + 0.03;
      if (narrativeProgress < unlockStart || narrativeProgress > unlockEnd) return;
      void unlockTestimonialAudio(testimonial);
    });
  }

  function unlockTestimonialAudio(testimonial: KitchenTestimonial) {
    const audio = getTestimonialAudioEl(testimonial);
    const state = testimonialAudioState[testimonial.id];

    if (
      isAudioMuted ||
      !testimonial.audioSrc ||
      state.hasUnlocked ||
      state.hasPlayed ||
      activeTestimonialAudioId === testimonial.id ||
      !audio
    ) {
      return Promise.resolve();
    }
    if (state.unlockPromise) return state.unlockPromise;

    state.unlockPromise = (async () => {
      const previousMuted = audio.muted;
      const previousVolume = audio.volume;

      try {
        audio.muted = true;
        audio.volume = 0;
        await audio.play();
        audio.pause();
        audio.currentTime = testimonial.audioStartTime ?? 0;

        if (testimonial.id === 'fausto' && fausto2AudioEl) {
          const previousSecondMuted = fausto2AudioEl.muted;
          const previousSecondVolume = fausto2AudioEl.volume;

          try {
            fausto2AudioEl.muted = true;
            fausto2AudioEl.volume = 0;
            await fausto2AudioEl.play();
            fausto2AudioEl.pause();
            fausto2AudioEl.currentTime = faustoSecondAudioStartTime;
          } finally {
            fausto2AudioEl.volume = previousSecondVolume;
            fausto2AudioEl.muted = previousSecondMuted;
          }
        }

        state.hasUnlocked = true;
      } catch {
        state.hasUnlocked = false;
      } finally {
        audio.volume = previousVolume;
        audio.muted = previousMuted;
        state.unlockPromise = undefined;
      }
    })();

    return state.unlockPromise;
  }

  async function playTestimonialAudio(testimonial: KitchenTestimonial) {
    const audio = getTestimonialAudioEl(testimonial);
    const state = testimonialAudioState[testimonial.id];
    if (isAudioMuted || !testimonial.audioSrc || state.hasPlayed || state.isStarting || !audio) return;

    state.isStarting = true;
    if (state.unlockPromise) await state.unlockPromise;
    if (isAudioMuted || state.hasPlayed || !audio) {
      state.isStarting = false;
      return;
    }

    stopAllTestimonialAudio({ duration: 0, except: testimonial.id, resetReplay: false });
    if (testimonial.id === 'fausto') clearFaustoSecondAudioTimer();

    gsap.killTweensOf(audio);
    state.isStopping = false;
    audio.pause();
    audio.currentTime = testimonial.audioStartTime ?? 0;
    if (testimonial.id === 'fausto' && fausto2AudioEl) {
      gsap.killTweensOf(fausto2AudioEl);
      fausto2AudioEl.pause();
      fausto2AudioEl.currentTime = faustoSecondAudioStartTime;
      fausto2AudioEl.volume = 1;
    }
    audio.muted = false;
    audio.volume = 1;
    dismissedTestimonialIds[testimonial.id] = false;
    resetTestimonialSpeechReveal(testimonial);
    activeTestimonialAudioId = testimonial.id;
    const playbackToken = ++state.playbackToken;

    try {
      await audio.play();
      if (playbackToken === state.playbackToken) state.hasPlayed = true;
    } catch {
      if (activeTestimonialAudioId === testimonial.id) activeTestimonialAudioId = undefined;
    } finally {
      state.isStarting = false;
    }
  }

  function stopTestimonialAudio(
    testimonial: KitchenTestimonial,
    options: { duration?: number; resetReplay?: boolean } = {}
  ) {
    const audio = getActiveTestimonialAudioEl(testimonial);
    const state = testimonialAudioState[testimonial.id];
    if (!audio) return;

    const duration = options.duration ?? 0.46;
    const resetReplay = options.resetReplay ?? true;
    if (state.isStopping && duration > 0) return;

    state.playbackToken += 1;
    state.isStarting = false;
    state.isStopping = duration > 0 && !audio.paused;
    if (resetReplay) state.hasPlayed = false;

    gsap.killTweensOf(audio);

    const afterStop = () => {
      audio.pause();
      audio.currentTime =
        testimonial.id === 'fausto' && audio === fausto2AudioEl
          ? faustoSecondAudioStartTime
          : (testimonial.audioStartTime ?? 0);
      audio.volume = 1;
      if (testimonial.id === 'fausto') {
        clearFaustoSecondAudioTimer();
        if (fausto2AudioEl && audio !== fausto2AudioEl) {
          gsap.killTweensOf(fausto2AudioEl);
          fausto2AudioEl.pause();
          fausto2AudioEl.currentTime = faustoSecondAudioStartTime;
          fausto2AudioEl.volume = 1;
        }
      }
      state.isStopping = false;
      resetTestimonialSpeechReveal(testimonial);
      if (activeTestimonialAudioId === testimonial.id) activeTestimonialAudioId = undefined;
    };

    if (duration <= 0 || audio.paused) {
      afterStop();
      return;
    }

    gsap.to(audio, {
      volume: 0,
      duration,
      ease: 'power2.out',
      overwrite: true,
      onComplete: afterStop
    });
  }

  function stopAllTestimonialAudio(
    options: { duration?: number; except?: KitchenTestimonialId; resetReplay?: boolean } = {}
  ) {
    kitchenTestimonials.forEach((testimonial) => {
      if (testimonial.id === options.except) return;
      stopTestimonialAudio(testimonial, options);
    });
  }

  function onTestimonialPointerDown(event: PointerEvent, testimonial: KitchenTestimonial) {
    event.stopPropagation();
    if (!testimonial.audioSrc || isAudioMuted) return;
    testimonialAudioState[testimonial.id].hasPlayed = false;
    dismissedTestimonialIds[testimonial.id] = false;
    void playTestimonialAudio(testimonial);
  }

  onMount(() => {
    let destroyed = false;
    const { resources } = sceneController;
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncReducedMotion = () => {
      prefersReducedMotion = reducedMotionQuery.matches;
    };

    syncReducedMotion();
    reducedMotionQuery.addEventListener('change', syncReducedMotion);
    resources.add(() => reducedMotionQuery.removeEventListener('change', syncReducedMotion));
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
    void startAmbientAudio();

    return () => {
      constructionAudioEl?.pause();
      kitchenAmbientAudioEl?.pause();
      stopAllTestimonialAudio({ duration: 0, resetReplay: false });
      void toolShedAudioContext?.close();
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
    style={`${getLayerStyle(resolvedLayerSpeed.background)}; --reveal-delay: 40ms;`}
  >
    <img src={kitchenAsset('layer-bg.svg')} alt="" draggable="false" />
  </div>

  <div
    class="parallax-layer reveal-layer background-layer tail-layer"
    style={`${getTailLayerStyle(resolvedLayerSpeed.background)}; --reveal-delay: 40ms;`}
  >
    <img src={kitchenAsset('layer-bg-tail.svg')} alt="" draggable="false" />
  </div>

  <div
    class="floor-layer reveal-layer"
    style={`height: ${scenePx(floorHeight * sceneScale)}; bottom: ${scenePx(floorBottomOffset * sceneScale)}; background-size: ${scenePx(floorTileWidth * sceneScale)} ${scenePx(floorHeight * sceneScale)}; background-position-x: ${scenePx(-cameraX)}; --reveal-delay: 160ms; --reveal-duration: 320ms;`}
  ></div>

  <div
    class="parallax-layer reveal-layer middle-layer"
    style={`${getLayerStyle(resolvedLayerSpeed.middle, 0, middleLayerFloorOffset)}; --reveal-delay: 280ms;`}
  >
    <img src={kitchenAsset('layer-mid.svg')} alt="" draggable="false" />
  </div>

  <div
    class="parallax-layer reveal-layer middle-layer tail-layer"
    style={`${getTailLayerStyle(resolvedLayerSpeed.middle, middleLayerFloorOffset)}; --reveal-delay: 280ms;`}
  >
    <img src={kitchenAsset('layer-mid-tail.svg')} alt="" draggable="false" />
  </div>

  <h1 class="scene-title" style={getTitleStyle()} aria-label="Cucina">
    {#each titleLetters as letter, index}
      <span style={`--letter-delay: ${280 + index * 70}ms`} aria-hidden="true">{letter}</span>
    {/each}
  </h1>

  <div
    class="parallax-layer reveal-layer tool-shed-layer"
    style={`${getToolShedStyle()}; --reveal-delay: 470ms;`}
    role="button"
    tabindex="0"
    aria-label="Messaggio casetta degli attrezzi"
    onpointerenter={playToolShedHoverSound}
    onpointerleave={resetToolShedHoverSound}
    onpointerdown={(event) => event.stopPropagation()}
  >
    <img src={kitchenAsset('casetta_attrezzi_figma.svg')} alt="" draggable="false" />
    <span
      class="object-shine"
      style={`--shine-mask: url('${kitchenAsset('casetta_attrezzi_figma.svg')}')`}
      aria-hidden="true"
    ></span>
    <span class="tool-shed-hover-dialogue" aria-hidden="true" data-node-id="3928:1640">
      <span class="tool-shed-hover-arrow" aria-hidden="true"></span>
      <span class="tool-shed-hover-panel">
        <span class="tool-shed-hover-copy">{toolShedMessage}</span>
      </span>
    </span>
  </div>

  <div
    class="parallax-layer reveal-layer stand-mixer-layer"
    style={`${getStandMixerStyle()}; --reveal-delay: 470ms;`}
    aria-hidden="true"
    data-node-id="3622:4038"
    onpointerenter={playStandMixerHoverSound}
    onpointerleave={resetStandMixerHoverSound}
  >
    <img src={kitchenAsset('planetaria_figma.svg')} alt="" draggable="false" />
    <span
      class="object-shine"
      style={`--shine-mask: url('${kitchenAsset('planetaria_figma.svg')}')`}
      aria-hidden="true"
    ></span>
    <span class="stand-mixer-hover-dialogue" aria-hidden="true" data-node-id="3950:1617">
      <span class="stand-mixer-hover-arrow" aria-hidden="true"></span>
      <span class="stand-mixer-hover-panel">
        <span class="stand-mixer-hover-copy">{toolShedMessage}</span>
      </span>
    </span>
  </div>

  {#each kitchenTestimonials as testimonial (testimonial.id)}
    {@const isDialogueVisible = isTestimonialDialogueVisible(testimonial)}
    <button
      class="chef-button"
      class:is-dialogue-visible={isDialogueVisible}
      data-testimonial={testimonial.id}
      style={`${getTestimonialStyle(testimonial)}; --reveal-delay: 390ms;`}
      type="button"
      aria-label={testimonial.ariaLabel}
      onpointerdown={(event) => onTestimonialPointerDown(event, testimonial)}
    >
      <span class="speech-bubble" aria-hidden={!isDialogueVisible} data-node-id="3772:1119">
        <span class="speech-bubble-copy">{getVisibleSpeech(testimonial)}</span>
        <span class="speech-bubble-meta" aria-label={testimonial.metaLabel}>
          <span>{testimonial.rolePrefix}</span>
          <strong>{testimonial.name}</strong>
        </span>
      </span>
      <img src={testimonial.imageSrc} alt={testimonial.imageAlt} draggable="false" />
    </button>
  {/each}

  <div
    class="parallax-layer reveal-layer foreground-layer"
    style={`${getForegroundLayerStyle()}; --reveal-delay: 470ms;`}
  >
    <img src={kitchenAsset('layer-fg.svg')} alt="" draggable="false" />
  </div>

  <div
    class="parallax-layer reveal-layer foreground-layer tail-layer"
    style={`${getTailLayerStyle(resolvedLayerSpeed.foreground)}; --reveal-delay: 470ms;`}
  >
    <img src={kitchenAsset('layer-fg-tail.svg')} alt="" draggable="false" />
  </div>
</section>

<audio bind:this={toolShedAudioEl} src="/sound/toolbox.mp3" preload="auto"></audio>
<audio bind:this={standMixerAudioEl} src="/sound/mixer.mp3" preload="auto"></audio>
<audio bind:this={constructionAudioEl} src="/sound/cantieresuoni.mp3" preload="auto"></audio>
<audio bind:this={kitchenAmbientAudioEl} src="/sound/cucinasuoni.mp3" preload="auto"></audio>
<audio
  bind:this={carloAudioEl}
  src="/sound/carlo.mp3"
  preload="auto"
  onplay={() => {
    if (!carloAudioEl?.muted) activeTestimonialAudioId = 'carlo';
  }}
  ontimeupdate={() => syncTestimonialSpeechReveal(carloTestimonial)}
  onpause={() => {
    if (activeTestimonialAudioId === 'carlo') activeTestimonialAudioId = undefined;
  }}
  onended={() => {
    finishTestimonialDialogue(carloTestimonial);
  }}
></audio>
<audio
  bind:this={paganiniAudioEl}
  src="/sound/stefano.mp3"
  preload="auto"
  onplay={() => {
    if (!paganiniAudioEl?.muted) activeTestimonialAudioId = 'paganini';
  }}
  ontimeupdate={() => syncTestimonialSpeechReveal(paganiniTestimonial)}
  onpause={() => {
    if (activeTestimonialAudioId === 'paganini') activeTestimonialAudioId = undefined;
  }}
  onended={() => {
    finishTestimonialDialogue(paganiniTestimonial);
  }}
></audio>
<audio
  bind:this={faustoAudioEl}
  src="/sound/fausto.mp3"
  preload="auto"
  onplay={() => {
    if (!faustoAudioEl?.muted) activeTestimonialAudioId = 'fausto';
  }}
  ontimeupdate={() => syncTestimonialSpeechReveal(faustoTestimonial)}
  onpause={() => {
    if (activeTestimonialAudioId === 'fausto') activeTestimonialAudioId = undefined;
  }}
  onended={() => {
    finishFaustoFirstDialogue();
  }}
></audio>
<audio
  bind:this={fausto2AudioEl}
  src="/sound/fausto2.mp3"
  preload="auto"
  onplay={() => {
    if (!fausto2AudioEl?.muted) activeTestimonialAudioId = 'fausto';
  }}
  onpause={() => {
    if (activeTestimonialAudioId === 'fausto') activeTestimonialAudioId = undefined;
  }}
  onended={() => {
    finishTestimonialDialogue(faustoTestimonial);
  }}
></audio>

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

  .tail-layer img {
    height: 100%;
    object-fit: fill;
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
    z-index: 10;
    display: block;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-text-primary);
    cursor: var(--kitchen-pointer-cursor);
    opacity: var(--chef-entry-opacity, 0);
    transform: translate3d(0, var(--chef-entry-y, 0), 0);
    transition:
      opacity 180ms ease,
      transform 360ms cubic-bezier(0.18, 1.05, 0.28, 1);
  }

  .chef-button img {
    display: block;
    width: 100%;
    height: auto;
    pointer-events: none;
    user-select: none;
  }

  .chef-button[data-testimonial='fausto'] img {
    width: auto;
    max-width: 100%;
    max-height: clamp(760px, 62vw, 960px);
    margin-inline: auto;
    transform: translate3d(0, clamp(78px, 7.4vw, 128px), 0) scale(1.32);
    transform-origin: 50% 100%;
  }

  .speech-bubble {
    position: absolute;
    z-index: 7;
    left: calc(100% + clamp(14px, 1.7vw, 24px));
    top: var(--speech-bubble-top, clamp(128px, 16vh, 188px));
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: clamp(260px, 29vw, 370px);
    min-height: clamp(112px, 11vw, 146px);
    color: var(--color-text-primary);
    font-family: var(--font-text);
    text-align: left;
    opacity: 0;
    transition: opacity 90ms ease;
    pointer-events: none;
  }

  .speech-bubble::before {
    position: absolute;
    z-index: 0;
    left: 0;
    top: clamp(72px, 7vw, 92px);
    width: 18px;
    height: 18px;
    background: var(--color-border-primary);
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
    content: '';
    opacity: 0;
    scale: 0.72;
    transform: translate(-50%, -50%);
    transform-origin: 50% 50%;
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
    white-space: pre-line;
    word-break: break-word;
    -webkit-clip-path: inset(0 100% 0 0);
    clip-path: inset(0 100% 0 0);
    will-change: clip-path;
  }

  .chef-button[data-testimonial='carlo'] .speech-bubble {
    width: clamp(360px, 41vw, 570px);
    min-height: clamp(190px, 19vw, 252px);
  }

  .chef-button[data-testimonial='carlo'] .speech-bubble::before {
    top: clamp(82px, 8.2vw, 110px);
  }

  .chef-button[data-testimonial='carlo'] .speech-bubble-copy {
    align-items: flex-start;
    min-height: clamp(168px, 17vw, 224px);
    font-size: clamp(12px, 1.04vw, 14px);
    line-height: 1.26;
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
    animation: dialogueRevealX 280ms cubic-bezier(0.16, 1, 0.3, 1) 20ms both;
  }

  .chef-button.is-dialogue-visible .speech-bubble-meta {
    animation: dialogueRevealX 225ms cubic-bezier(0.16, 1, 0.3, 1) 240ms both;
  }

  .foreground-layer {
    z-index: 6;
  }

  .tool-shed-layer {
    z-index: 8;
    overflow: visible;
    pointer-events: auto;
  }

  .stand-mixer-layer {
    z-index: 7;
    pointer-events: auto;
  }

  .stand-mixer-layer img {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    height: auto;
    transform-origin: 56% 100%;
    animation: standMixerIdle 2.4s cubic-bezier(0.45, 0, 0.2, 1) infinite;
    will-change: transform;
  }

  .stand-mixer-layer:hover img,
  .stand-mixer-layer:focus-visible img {
    animation: standMixerHoverLanding 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .stand-mixer-hover-dialogue {
    position: absolute;
    inset: 0;
    z-index: 3;
    opacity: 0;
    transition: opacity 120ms ease;
    pointer-events: none;
  }

  .stand-mixer-hover-panel {
    position: absolute;
    z-index: 2;
    left: var(--stand-mixer-message-left);
    top: var(--stand-mixer-message-top);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--stand-mixer-message-width);
    padding: var(--stand-mixer-message-padding);
    border: 2px solid #fcb531;
    border-radius: var(--radius-s);
    background: #f7f3ea;
    color: var(--color-text-primary);
    -webkit-clip-path: inset(0 0 0 0);
    clip-path: inset(0 0 0 0);
    will-change: clip-path;
  }

  .stand-mixer-hover-arrow {
    position: absolute;
    z-index: 1;
    left: var(--stand-mixer-arrow-left);
    top: var(--stand-mixer-arrow-top);
    width: var(--stand-mixer-arrow-size);
    height: var(--stand-mixer-arrow-size);
    background: #fcb531;
    transform: translate(-50%, -50%) rotate(45deg);
  }

  .stand-mixer-hover-copy {
    position: relative;
    z-index: 1;
    width: 100%;
    font-family: "JetBrains Mono", var(--font-text);
    font-size: var(--stand-mixer-message-font-size);
    font-style: italic;
    font-weight: 300;
    line-height: normal;
    letter-spacing: 0;
    text-align: left;
    word-break: break-word;
  }

  .stand-mixer-layer:hover .stand-mixer-hover-dialogue,
  .stand-mixer-layer:focus-visible .stand-mixer-hover-dialogue {
    opacity: 1;
  }

  .stand-mixer-layer:hover .stand-mixer-hover-panel,
  .stand-mixer-layer:focus-visible .stand-mixer-hover-panel {
    animation: dialogueRevealX 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .tool-shed-layer:focus-visible,
  .stand-mixer-layer:focus-visible {
    outline: none;
  }

  .tool-shed-layer img {
    position: relative;
    z-index: 1;
    transform-origin: 50% 100%;
    will-change: transform;
  }

  .object-shine {
    position: absolute;
    z-index: 2;
    inset: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    -webkit-mask-image: var(--shine-mask);
    mask-image: var(--shine-mask);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    transform-origin: 50% 50%;
    animation: objectLightSweepOpacityTool 1.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    will-change: opacity;
  }

  .stand-mixer-layer .object-shine {
    animation-name: objectLightSweepOpacityMixer;
    animation-duration: 2.4s;
  }

  .object-shine::before {
    position: absolute;
    top: -34%;
    left: 46%;
    width: 18%;
    height: 168%;
    background:
      linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.18),
        #ffffff,
        rgba(255, 255, 255, 0.24),
        transparent 50%
      );
    content: '';
    transform: translate3d(-430%, -34%, 0) rotate(35deg);
    transform-origin: 50% 50%;
    animation: objectLightSweepBeamTool 1.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    will-change: transform;
  }

  .stand-mixer-layer .object-shine::before {
    animation-name: objectLightSweepBeamMixer;
    animation-duration: 2.4s;
  }

  .tool-shed-layer:hover img,
  .tool-shed-layer:focus-visible img {
    animation: toolShedHeavyLanding 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .tool-shed-hover-dialogue {
    position: absolute;
    inset: 0;
    z-index: 3;
    opacity: 0;
    transition: opacity 120ms ease;
    pointer-events: none;
  }

  .tool-shed-hover-panel {
    position: absolute;
    z-index: 2;
    left: var(--tool-shed-message-left);
    top: var(--tool-shed-message-top);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--tool-shed-message-width);
    padding: var(--tool-shed-message-padding);
    border: 2px solid #fcb531;
    border-radius: var(--radius-s);
    background: #f7f3ea;
    color: var(--color-text-primary);
    -webkit-clip-path: inset(0 0 0 0);
    clip-path: inset(0 0 0 0);
    will-change: clip-path;
  }

  .tool-shed-hover-arrow {
    position: absolute;
    z-index: 1;
    left: var(--tool-shed-message-left);
    top: var(--tool-shed-arrow-top);
    width: var(--tool-shed-arrow-size);
    height: var(--tool-shed-arrow-size);
    background: #fcb531;
    transform: translate(-50%, -50%) rotate(45deg);
  }

  .tool-shed-hover-copy {
    position: relative;
    z-index: 1;
    width: 100%;
    font-family: "JetBrains Mono", var(--font-text);
    font-size: var(--tool-shed-message-font-size);
    font-style: italic;
    font-weight: 300;
    line-height: normal;
    letter-spacing: 0;
    text-align: left;
    word-break: break-word;
  }

  .tool-shed-layer:hover .tool-shed-hover-dialogue,
  .tool-shed-layer:focus-visible .tool-shed-hover-dialogue {
    opacity: 1;
  }

  .tool-shed-layer:hover .tool-shed-hover-panel,
  .tool-shed-layer:focus-visible .tool-shed-hover-panel {
    animation: dialogueRevealX 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
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

  @keyframes objectLightSweepOpacityTool {
    0%,
    52% {
      opacity: 0;
    }

    63% {
      opacity: 0.8;
    }

    90% {
      opacity: 0;
    }

    100% {
      opacity: 0;
    }
  }

  @keyframes objectLightSweepBeamTool {
    0%,
    52% {
      transform: translate3d(-430%, -34%, 0) rotate(35deg);
    }

    90%,
    100% {
      transform: translate3d(430%, 34%, 0) rotate(35deg);
    }
  }

  @keyframes objectLightSweepOpacityMixer {
    0%,
    58% {
      opacity: 0;
    }

    66% {
      opacity: 0.8;
    }

    78% {
      opacity: 0;
    }

    100% {
      opacity: 0;
    }
  }

  @keyframes objectLightSweepBeamMixer {
    0%,
    58% {
      transform: translate3d(-430%, -34%, 0) rotate(35deg);
    }

    78%,
    100% {
      transform: translate3d(430%, 34%, 0) rotate(35deg);
    }
  }

  @keyframes toolShedHeavyLanding {
    0% {
      transform: translate3d(0, 0, 0) scale(1);
    }

    10% {
      transform: translate3d(0, 0, 0) scale(1.035, 0.965);
    }

    24% {
      transform: translate3d(0, -18px, 0) scale(0.975, 1.025);
    }

    42% {
      transform: translate3d(1px, -34px, 0) scale(0.985, 1.015);
    }

    56% {
      transform: translate3d(-1px, -14px, 0) scale(1);
    }

    66% {
      transform: translate3d(0, 0, 0) scale(1.11, 0.86);
    }

    73% {
      transform: translate3d(0, -7px, 0) scale(0.965, 1.045);
    }

    81% {
      transform: translate3d(0, 0, 0) scale(1.055, 0.935);
    }

    89% {
      transform: translate3d(0, -2px, 0) scale(0.99, 1.01);
    }

    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  @keyframes standMixerIdle {
    0%,
    42%,
    100% {
      transform: translate3d(0, 0, 0) rotate(0deg);
    }

    52% {
      transform: translate3d(0, -3px, 0) rotate(-1.6deg);
    }

    64% {
      transform: translate3d(0, 0, 0) rotate(0.9deg);
    }

    78% {
      transform: translate3d(0, -0.8px, 0) rotate(-0.5deg);
    }
  }

  @keyframes standMixerHoverLanding {
    0% {
      transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
    }

    12% {
      transform: translate3d(0, 0, 0) rotate(2.5deg) scale(1.025, 0.975);
    }

    28% {
      transform: translate3d(0, -14px, 0) rotate(-6deg) scale(0.985, 1.018);
    }

    43% {
      transform: translate3d(1px, -24px, 0) rotate(-9deg) scale(0.99, 1.012);
    }

    57% {
      transform: translate3d(0, -9px, 0) rotate(-4deg) scale(1);
    }

    67% {
      transform: translate3d(0, 0, 0) rotate(1.8deg) scale(1.075, 0.91);
    }

    76% {
      transform: translate3d(0, -5px, 0) rotate(-2.2deg) scale(0.985, 1.025);
    }

    84% {
      transform: translate3d(0, 0, 0) rotate(0.9deg) scale(1.035, 0.955);
    }

    92% {
      transform: translate3d(0, -1.5px, 0) rotate(-0.45deg) scale(0.996, 1.006);
    }

    100% {
      transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
    }
  }

  @keyframes titleLetterIn {
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  @media (max-width: 760px) {
    .speech-bubble {
      left: 0;
      bottom: calc(100% + 18px);
      width: min(330px, calc(100vw - 64px));
      min-height: 0;
    }

    .chef-button[data-testimonial='carlo'] .speech-bubble {
      width: min(360px, calc(100vw - 48px));
      min-height: 0;
    }

    .speech-bubble::before {
      left: 0;
      top: 72px;
      width: 18px;
      height: 18px;
    }

    .speech-bubble-copy {
      min-height: 106px;
      padding: 14px 18px;
      border-width: 2px;
      font-size: 13px;
    }

    .chef-button[data-testimonial='carlo'] .speech-bubble-copy {
      min-height: 178px;
      font-size: 11.5px;
      line-height: 1.22;
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

    .tool-shed-layer:hover img,
    .tool-shed-layer:focus-visible img,
    .stand-mixer-layer img,
    .stand-mixer-layer:hover img,
    .stand-mixer-layer:focus-visible img,
    .scene-title span {
      opacity: 1;
      transform: none;
      animation: none;
    }

    .speech-bubble,
    .speech-bubble::before,
    .speech-bubble-copy,
    .speech-bubble-meta,
    .chef-button,
    .object-shine,
    .tool-shed-hover-dialogue,
    .tool-shed-hover-panel,
    .tool-shed-hover-arrow,
    .stand-mixer-hover-dialogue,
    .stand-mixer-hover-panel,
    .stand-mixer-hover-arrow {
      transition: none;
      animation: none;
    }

    .chef-button.is-dialogue-visible .speech-bubble-copy,
    .chef-button.is-dialogue-visible .speech-bubble-meta,
    .tool-shed-layer:hover .tool-shed-hover-panel,
    .tool-shed-layer:focus-visible .tool-shed-hover-panel,
    .stand-mixer-layer:hover .stand-mixer-hover-panel,
    .stand-mixer-layer:focus-visible .stand-mixer-hover-panel {
      -webkit-clip-path: inset(0 0 0 0);
      clip-path: inset(0 0 0 0);
    }
  }
</style>

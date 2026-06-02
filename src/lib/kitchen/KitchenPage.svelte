<script lang="ts">
  import { onMount } from 'svelte';
  import VolumeMaxIcon from '$lib/VolumeMaxIcon.svelte';
  import VolumeOffIcon from '$lib/VolumeOffIcon.svelte';
  import KitchenScene from './KitchenScene.svelte';

  let isAudioMuted = $state(false);
  const audioLabel = $derived(isAudioMuted ? 'Audio disattivato' : 'Audio attivo');

  function toggleAudioMuted() {
    isAudioMuted = !isAudioMuted;
  }

  onMount(() => {
    if (sessionStorage.getItem('kitchen-card-transition') !== '1') return;
    sessionStorage.removeItem('kitchen-card-transition');

    const transitionEls = Array.from(
      document.querySelectorAll<HTMLElement>('.card-enter-fade, .role-card.is-entering')
    );
    if (!transitionEls.length) return;

    requestAnimationFrame(() => {
      const animations = transitionEls.map((el) =>
        el.animate(
          [
            { opacity: getComputedStyle(el).opacity },
            { opacity: '0' }
          ],
          { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
        )
      );

      Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
        transitionEls.forEach((el) => el.remove());
      });
    });
  });
</script>

<svelte:head>
  <title>Cucina | Fuorimenù</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=DynaPuff:wght@400..700&family=Fasthand&family=JetBrains+Mono:ital,wght@0,400;1,300;1,700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<main class="game-page">
  <header class="kitchen-topbar" aria-label="Navigazione cucina">
    <a class="logo" href="/?view=brand" aria-label="Vai al brand screen Fuorimenù">FM</a>
    <button
      class="icon-button top-bar-audio"
      type="button"
      aria-label={audioLabel}
      aria-pressed={isAudioMuted}
      onclick={toggleAudioMuted}
    >
      {#if isAudioMuted}
        <VolumeOffIcon class="volume-icon" />
      {:else}
        <VolumeMaxIcon class="volume-icon volume-max-icon" />
      {/if}
    </button>
    <a class="home-link" href="/?view=cards" aria-label="Torna alle card">
      <span class="close-icon" aria-hidden="true"></span>
    </a>
  </header>

  <section class="game-shell" aria-label="Scena parallasse della cucina">
    <KitchenScene {isAudioMuted} />
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    background: var(--color-surface-page);
  }

  .game-page {
    position: relative;
    min-height: 100svh;
    overflow-x: hidden;
    color: var(--color-text-primary);
    background: var(--color-surface-page);
    font-family: var(--font-text);
  }

  .kitchen-topbar {
    position: fixed;
    z-index: 10;
    top: 0;
    left: 0;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    width: 100%;
    height: var(--layout-topbar-height);
    padding: var(--layout-topbar-padding);
    pointer-events: none;
  }

  .logo,
  .icon-button,
  .home-link {
    pointer-events: auto;
  }

  .logo {
    width: 51px;
    color: var(--color-interactive-primary);
    font-family: var(--font-display);
    font-size: var(--unit-40);
    line-height: 1;
    text-decoration: none;
    transition: color 160ms ease;
  }

  .home-link {
    grid-column: 3;
    display: grid;
    justify-self: end;
    width: var(--button-icon-size);
    height: var(--button-icon-size);
    place-items: center;
    color: var(--color-interactive-primary);
    cursor: url('/cursors/retrogusto-cursor.svg') 5 5, pointer;
    transition: color 160ms ease;
  }

  .top-bar-audio {
    grid-column: 2;
    justify-self: center;
  }

  .icon-button {
    display: grid;
    width: var(--button-icon-size);
    height: var(--button-icon-size);
    padding: 0;
    place-items: center;
    border: 0;
    background: transparent;
    color: var(--color-interactive-primary);
    cursor: url('/cursors/retrogusto-cursor.svg') 5 5, pointer;
    transition: color 160ms ease, opacity 0.2s ease;
  }

  .close-icon,
  .close-icon::before {
    display: block;
    width: 24px;
    height: 2.4px;
    background: currentColor;
    border-radius: var(--radius-full);
  }

  .close-icon {
    position: relative;
    transform: rotate(45deg);
  }

  .close-icon::before {
    position: absolute;
    left: 0;
    content: '';
    transform: rotate(90deg);
  }

  .logo:hover,
  .logo:focus-visible,
  .icon-button:hover,
  .icon-button:focus-visible,
  .home-link:hover,
  .home-link:focus-visible {
    color: var(--color-interactive-hover);
  }

  .logo:focus-visible,
  .icon-button:focus-visible,
  .home-link:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: var(--unit-4);
  }

  :global(.volume-icon) {
    width: 28px;
    height: 28px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2.2;
  }

  :global(.volume-max-icon) {
    stroke-width: 2.33333;
  }

  :global(.volume-slash) {
    stroke-width: 2.8;
  }

  .game-shell {
    position: relative;
    height: 100svh;
  }

  @media (max-width: 760px) {
    .kitchen-topbar {
      height: var(--layout-topbar-height-mobile);
      padding: var(--layout-topbar-padding-mobile);
    }

    .logo {
      font-size: 34px;
    }
  }
</style>

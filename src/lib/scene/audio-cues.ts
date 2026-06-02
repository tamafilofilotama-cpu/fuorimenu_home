import { gsap } from 'gsap';

export type AudioCueConfig = {
  el?: HTMLAudioElement;
  fadeIn?: boolean;
  fadeInDuration?: number;
  loop?: boolean;
  maxTime?: number;
  outputGain?: number;
  src?: string;
  startTime?: number;
  targetVolume: number;
};

type AudioCueManagerOptions = {
  fade?: {
    duration: number;
    ease: string;
  };
};

const defaultFade = {
  duration: 0.52,
  ease: 'power2.inOut'
};

export function createAudioCueManager<Id extends string>(options: AudioCueManagerOptions = {}) {
  const cues = new Map<Id, AudioCueConfig>();
  const fadeTweens = new Map<Id, gsap.core.Tween>();
  const loopFrames = new Map<Id, number>();
  const sources = new Map<Id, MediaElementAudioSourceNode>();
  const gains = new Map<Id, GainNode>();
  const fadeMotion = { ...defaultFade, ...options.fade };
  let audioContext: AudioContext | undefined;
  let unlocked = false;

  function registerAudioCue(id: Id, config: AudioCueConfig) {
    cues.set(id, config);
    return () => {
      stop(id, { duration: 0 });
      cues.delete(id);
    };
  }

  function getCue(id: Id) {
    return cues.get(id);
  }

  function cancelLoop(id: Id) {
    const frame = loopFrames.get(id);
    if (frame) cancelAnimationFrame(frame);
    loopFrames.delete(id);
  }

  function cancelFade(id: Id) {
    fadeTweens.get(id)?.kill();
    fadeTweens.delete(id);
  }

  function getContext() {
    audioContext ??= new AudioContext();
    return audioContext;
  }

  function setupOutput(id: Id) {
    const config = cues.get(id);
    const audio = config?.el;
    if (!config || !audio || sources.has(id)) return;

    const context = getContext();
    const source = context.createMediaElementSource(audio);
    const gain = context.createGain();
    gain.gain.value = config.outputGain ?? 1;
    source.connect(gain);
    gain.connect(context.destination);
    sources.set(id, source);
    gains.set(id, gain);
  }

  function watchLoop(id: Id) {
    const config = cues.get(id);
    const audio = config?.el;
    if (!config?.maxTime || !audio || config.maxTime <= (config.startTime ?? 0)) return;

    const tick = () => {
      if (audio.currentTime >= config.maxTime!) {
        audio.currentTime = config.startTime ?? 0;
      }
      loopFrames.set(id, requestAnimationFrame(tick));
    };

    loopFrames.set(id, requestAnimationFrame(tick));
  }

  function fade(id: Id, targetVolume: number, afterFade?: () => void, duration = fadeMotion.duration) {
    const audio = cues.get(id)?.el;
    if (!audio) return;

    cancelFade(id);
    if (duration <= 0) {
      audio.volume = targetVolume;
      afterFade?.();
      return;
    }

    fadeTweens.set(
      id,
      gsap.to(audio, {
        volume: targetVolume,
        duration,
        ease: fadeMotion.ease,
        overwrite: true,
        onComplete: () => {
          audio.volume = targetVolume;
          fadeTweens.delete(id);
          afterFade?.();
        }
      })
    );
  }

  async function play(id: Id) {
    const config = cues.get(id);
    const audio = config?.el;
    if (!config || !audio) return false;

    cancelFade(id);
    cancelLoop(id);
    audio.loop = config.loop ?? false;
    audio.pause();
    audio.currentTime = config.startTime ?? 0;
    setupOutput(id);
    await audioContext?.resume();
    audio.volume = config.fadeIn === false ? config.targetVolume : 0;

    try {
      await audio.play();
      watchLoop(id);
      if (config.fadeIn !== false) fade(id, config.targetVolume, undefined, config.fadeInDuration);
      return true;
    } catch {
      return false;
    }
  }

  function stop(id: Id, options: { duration?: number } = {}) {
    const config = cues.get(id);
    const audio = config?.el;
    if (!config || !audio) return;

    cancelLoop(id);
    fade(
      id,
      0,
      () => {
        audio.pause();
        audio.currentTime = config.startTime ?? 0;
      },
      options.duration ?? fadeMotion.duration
    );
  }

  function stopAll(ids: readonly Id[] = Array.from(cues.keys())) {
    ids.forEach((id) => stop(id));
  }

  async function unlock(ids: readonly Id[] = Array.from(cues.keys())) {
    if (unlocked) return true;

    const audios = ids
      .map((id) => cues.get(id)?.el)
      .filter(Boolean) as HTMLAudioElement[];
    if (!audios.length) return false;

    try {
      ids.forEach(setupOutput);
      await audioContext?.resume();
      await Promise.all(
        audios.map(async (audio) => {
          const previousVolume = audio.volume;
          audio.volume = 0;
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
          audio.volume = previousVolume;
        })
      );
      unlocked = true;
      return true;
    } catch {
      unlocked = false;
      return false;
    }
  }

  function destroy() {
    Array.from(cues.keys()).forEach((id) => {
      cancelFade(id);
      cancelLoop(id);
      const audio = cues.get(id)?.el;
      audio?.pause();
    });
    cues.clear();
    sources.clear();
    gains.clear();
    void audioContext?.close();
    audioContext = undefined;
  }

  return {
    destroy,
    fade,
    getCue,
    play,
    registerAudioCue,
    stop,
    stopAll,
    unlock
  };
}

export function registerAudioCue<Id extends string>(
  manager: ReturnType<typeof createAudioCueManager<Id>>,
  id: Id,
  config: AudioCueConfig
) {
  return manager.registerAudioCue(id, config);
}

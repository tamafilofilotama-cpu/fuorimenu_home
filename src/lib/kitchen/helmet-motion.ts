import { clamp, degToRad, radToDeg } from '$lib/scene/math';

export type HelmetMotionState = {
  lift: number;
  rotation: number;
};

export function createHelmetMotion() {
  let angle = degToRad(5.2);
  let angularVelocity = 0.38;
  let hoverStartAngle = 0;
  let hoverElapsed = 0;
  let lift = 0;
  let hovered = false;

  function setHover(isHovered: boolean) {
    if (hovered === isHovered) return false;

    hovered = isHovered;
    hoverElapsed = 0;
    hoverStartAngle = angle;
    angularVelocity = isHovered ? 0 : 0.62;
    return true;
  }

  function step(delta: number, now: number) {
    const dt = Math.min(delta / 1000, 0.032);

    if (hovered) {
      const hoverDuration = 0.32;
      const progress = clamp(hoverElapsed / hoverDuration, 0, 1);
      const falloff = Math.pow(1 - progress, 2.25);
      const jumpArc = 4 * progress * (1 - progress);
      const shake = Math.sin(progress * Math.PI * 5) * falloff * degToRad(7.4);

      angle = hoverStartAngle * (1 - progress) + shake;
      lift = jumpArc * 25;
      angularVelocity = 0;
      hoverElapsed += dt;

      if (progress >= 1) {
        angle = 0;
        lift = 0;
      }

      return;
    }

    lift = 0;

    const gravity = 1180;
    const pendulumLength = 54;
    const damping = 0.16;
    const ambientForce = Math.sin(now * 0.00095) * 0.08;
    const angularAcceleration =
      -(gravity / pendulumLength) * Math.sin(angle) - damping * angularVelocity + ambientForce;

    angularVelocity += angularAcceleration * dt;
    angle += angularVelocity * dt;

    if (Math.abs(angle) > degToRad(6.4)) {
      angle = clamp(angle, degToRad(-6.4), degToRad(6.4));
      angularVelocity *= 0.28;
    }
  }

  function getRotation() {
    if (hovered) return radToDeg(angle);

    const maxIdleAngle = degToRad(6.4);
    const normalizedAngle = clamp(angle / maxIdleAngle, -1, 1);
    const easedAngle =
      Math.sign(normalizedAngle) * Math.pow(Math.abs(normalizedAngle), 0.86) * maxIdleAngle;

    return radToDeg(easedAngle);
  }

  function getState(): HelmetMotionState {
    return {
      lift,
      rotation: getRotation()
    };
  }

  return {
    getState,
    setHover,
    step
  };
}

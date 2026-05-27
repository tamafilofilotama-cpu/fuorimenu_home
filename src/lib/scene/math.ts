export type CssVars = Record<`--${string}`, string | number>;

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

export function ease(value: number) {
  return value * value * (3 - 2 * value);
}

export function fixed(value: number, digits = 3) {
  return value.toFixed(digits);
}

export function px(value: number, digits = 1) {
  return `${value.toFixed(digits)}px`;
}

export function deg(value: number, digits = 2) {
  return `${value.toFixed(digits)}deg`;
}

export function vh(value: number, digits = 1) {
  return `${value.toFixed(digits)}vh`;
}

export function vw(value: number, digits = 2) {
  return `${value.toFixed(digits)}vw`;
}

export function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

export function radToDeg(value: number) {
  return (value * 180) / Math.PI;
}

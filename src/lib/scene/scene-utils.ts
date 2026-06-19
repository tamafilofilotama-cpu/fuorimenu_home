import type { SceneAsset } from './scene-asset.types';
import { px } from './math';

const formatNumber = (value: number) =>
  Number.isInteger(value) ? value.toString() : Number(value.toFixed(4)).toString();

export function getSceneAssetStyle(
  asset: SceneAsset,
  cameraX: number,
  sceneHeight: number,
  sceneScale: number,
  layerSpeed: Record<string, number>,
  tailStartX = 0
): string {
  const xAbsolute = asset.isTail ? tailStartX + asset.x : asset.x;
  const speed = layerSpeed[asset.layer] ?? 1;
  const scaleOverrideX = asset.scaleOverride?.x ?? 1;
  const scaleOverrideY = asset.scaleOverride?.y ?? 1;
  const scaleX = (asset.flipX ? -1 : 1) * scaleOverrideX;
  const scaleY = (asset.flipY ? -1 : 1) * scaleOverrideY;
  const rotate = asset.rotate ?? 0;
  const translateX = xAbsolute * sceneScale - cameraX * speed;
  const bottom = (sceneHeight - asset.y - asset.height) * sceneScale;

  const style = [
    `width: ${px(asset.width * sceneScale * scaleOverrideX, 2)}`,
    `height: ${px(asset.height * sceneScale * scaleOverrideY, 2)}`,
    `bottom: ${px(bottom, 2)}`,
    `transform: translate3d(${px(translateX, 2)}, 0, 0) scale(${formatNumber(scaleX)}, ${formatNumber(
      scaleY
    )}) rotate(${formatNumber(rotate)}deg)`
  ];

  if (asset.opacity !== undefined) style.push(`opacity: ${formatNumber(asset.opacity)}`);
  if (asset.zOffset !== undefined) style.push(`--scene-z-offset: ${formatNumber(asset.zOffset)}`);

  return style.join(';');
}

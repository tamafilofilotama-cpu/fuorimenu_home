export type SceneLayer = 'background' | 'middle' | 'foreground';

export type SceneAssetBase = {
  id: string;
  src: string;
  nodeId?: string;

  // Figma coordinates: top-left origin, scene px.
  x: number;
  y: number;
  width: number;
  height: number;

  layer: SceneLayer;

  rotate?: number;
  flipX?: boolean;
  flipY?: boolean;
  scaleOverride?: {
    x: number;
    y: number;
  };

  zOffset?: number;
  opacity?: number;

  isTail?: boolean;
};

export type StaticSceneAsset = SceneAssetBase & { kind: 'static' };

export type InteractiveSceneAsset = SceneAssetBase & {
  kind: 'interactive';
  hoverDialogue?: string;
  hoverSound?: string;
  shineEffect?: boolean;
  ariaLabel?: string;
  hoverDialogueNodeId?: string;
  hoverDialoguePlacement?: {
    left: number;
    top: number;
    width: number;
    padding: number;
    fontSize: number;
    arrowLeft?: number;
    arrowTop: number;
    arrowSize: number;
  };
};

export type ProgressGatedAsset = SceneAssetBase & {
  kind: 'gated';
  visibleFrom: number;
  visibleUntil?: number;
};

export type SceneAsset = StaticSceneAsset | InteractiveSceneAsset | ProgressGatedAsset;

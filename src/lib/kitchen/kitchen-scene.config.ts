import type { SceneAsset } from '$lib/scene/scene-asset.types';

export type KitchenChefId = 'carlo';

export const kitchenAssetVersion = '20260618-scene-assets-3';

const kitchenTailHeight = 1117;
const kitchenTailY = -137;
const toolShedMessage =
  'li devi trattare bene, devi dargli dei pasti molto caldi, magari dargli anche il tè o il caffè 24 ore al giorno';

export const kitchenSceneConfig = {
  sceneWidth: 46600,
  sceneHeight: 875,
  assetWidth: 24268,
  foregroundSvgWidth: 24268,
  foregroundSvgHeight: 875,
  foregroundBottomOffset: 0,
  floorHeight: 225,
  floorBottomOffset: -96,
  floorTileWidth: 224,
  chef: {
    id: 'carlo' as KitchenChefId,
    x: 1100,
    width: 185,
    visibleThreshold: 0.34
  },
  layerSpeed: {
    background: 1,
    middle: 1,
    title: 0.8,
    chef: 0.8,
    foreground: 1
  },
  cursorCss: "url('/cursors/retrogusto-cursor.svg') 5 5, auto",
  pointerCursorCss: "url('/cursors/retrogusto-cursor.svg') 5 5, pointer",
  title: 'Cucina',
  chefQuote:
    'Il 30 di gennaio era ancora un cantiere, quindi si entrava con l\'elmetto, col giubbotto catarifrangente e le scarpe antinfortunistiche.'
} as const;

export type KitchenSceneConfig = typeof kitchenSceneConfig;

export const kitchenAssets: SceneAsset[] = [
  {
    id: 'layer-bg',
    kind: 'static',
    src: 'layer-bg.svg',
    x: 0,
    y: 0,
    width: kitchenSceneConfig.assetWidth,
    height: kitchenSceneConfig.sceneHeight,
    layer: 'background'
  },
  {
    id: 'layer-bg-tail',
    kind: 'static',
    src: 'layer-bg-tail.svg',
    x: 0,
    y: kitchenTailY,
    width: 23000,
    height: kitchenTailHeight,
    layer: 'background',
    isTail: true
  },
  {
    id: 'layer-mid',
    kind: 'static',
    src: 'layer-mid.svg',
    x: 0,
    y: 0,
    width: kitchenSceneConfig.assetWidth,
    height: kitchenSceneConfig.sceneHeight,
    layer: 'middle'
  },
  {
    id: 'layer-mid-tail',
    kind: 'static',
    src: 'layer-mid-tail.svg',
    x: 0,
    y: kitchenTailY,
    width: 23000,
    height: kitchenTailHeight,
    layer: 'middle',
    isTail: true
  },
  {
    id: 'tool-shed',
    kind: 'interactive',
    src: 'casetta_attrezzi_figma.svg',
    x: 5500,
    y: 595 - 180.446,
    width: 166.747,
    height: 180.446,
    layer: 'foreground',
    zOffset: 2,
    ariaLabel: 'Messaggio casetta degli attrezzi',
    hoverDialogue: toolShedMessage,
    hoverDialogueNodeId: '3928:1640',
    hoverSound: 'toolbox',
    shineEffect: true,
    hoverDialoguePlacement: {
      left: 190,
      top: 36,
      width: 322,
      padding: 20,
      fontSize: 16,
      arrowTop: 64,
      arrowSize: 18
    }
  },
  {
    id: 'stand-mixer',
    kind: 'interactive',
    src: 'planetaria_figma.svg',
    nodeId: '3622:4038',
    x: 6690,
    y: 545 - 160,
    width: 154,
    height: 160,
    layer: 'foreground',
    zOffset: 1,
    hoverDialogue: toolShedMessage,
    hoverDialogueNodeId: '3950:1617',
    hoverSound: 'mixer',
    shineEffect: true,
    hoverDialoguePlacement: {
      left: 168,
      top: 8,
      width: 322,
      padding: 20,
      fontSize: 16,
      arrowLeft: 168,
      arrowTop: 102,
      arrowSize: 18
    }
  },
  {
    id: 'layer-fg',
    kind: 'static',
    src: 'layer-fg.svg',
    x: 0,
    y: 0,
    width: kitchenSceneConfig.assetWidth,
    height: kitchenSceneConfig.foregroundSvgHeight,
    layer: 'foreground'
  },
  {
    id: 'layer-fg-tail',
    kind: 'static',
    src: 'layer-fg-tail.svg',
    x: 0,
    y: kitchenTailY,
    width: 23000,
    height: kitchenTailHeight,
    layer: 'foreground',
    isTail: true
  }
];

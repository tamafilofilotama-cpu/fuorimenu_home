import type { SceneAsset } from '$lib/scene/scene-asset.types';

export type KitchenChefId = 'carlo';

export const kitchenAssetVersion = '20260620-scene-assets-1';

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

// Extracted crops from the original kitchen layer SVGs. Move these entries one by one
// by editing x/y/width/height, then rename ids when the visual mapping is confirmed.
const kitchenSplitBackgroundAssets: SceneAsset[] = [
  { id: 'kitchen-bg-a', kind: 'static', src: 'kitchen-figma/kitchen-bg-a.svg', x: 9120, y: 149, width: 384, height: 290, layer: 'background' },
  { id: 'kitchen-bg-b', kind: 'static', src: 'kitchen-figma/kitchen-bg-b.svg', x: 10943, y: 321, width: 290, height: 38, layer: 'background' },
  { id: 'kitchen-bg-c', kind: 'static', src: 'kitchen-figma/kitchen-bg-c.svg', x: 20298, y: 83, width: 710, height: 178, layer: 'background' },
  { id: 'kitchen-bg-d', kind: 'static', src: 'kitchen-figma/kitchen-bg-d.svg', x: 6299.59, y: 333.141, width: 90.415, height: 84.52, layer: 'background' },
  { id: 'kitchen-bg-e', kind: 'static', src: 'kitchen-figma/kitchen-bg-e.svg', x: 6265.996, y: 324.02, width: 107.262, height: 102.98, layer: 'background' },
  { id: 'kitchen-bg-f', kind: 'static', src: 'kitchen-figma/kitchen-bg-f.svg', x: 6480, y: 175, width: 397, height: 579, layer: 'background' },
  { id: 'kitchen-bg-g', kind: 'static', src: 'kitchen-figma/kitchen-bg-g.svg', x: 18433, y: 216, width: 72, height: 297, layer: 'background' }
];

const kitchenSplitBackgroundTailAssets: SceneAsset[] = [
  { id: 'kitchen-bg-tail-29000', kind: 'static', src: 'kitchen-figma/kitchen-bg-tail-29000.svg', x: 5300.49, y: 262, width: 298.16, height: 487.099, layer: 'background', isTail: true }
];

const kitchenSplitMiddleAssets: SceneAsset[] = [
  { id: 'kitchen-mid-c', kind: 'static', src: 'kitchen-figma/kitchen-mid-c.svg', x: 2129, y: 720, width: 86, height: 129, layer: 'middle' },
  { id: 'kitchen-mid-d', kind: 'static', src: 'kitchen-figma/kitchen-mid-d.svg', x: 4212, y: 731, width: 86, height: 129, layer: 'middle' },
  { id: 'kitchen-mid-e', kind: 'static', src: 'kitchen-figma/kitchen-mid-e.svg', x: 2261, y: 723, width: 86, height: 129, layer: 'middle' },
  { id: 'kitchen-mid-f', kind: 'static', src: 'kitchen-figma/kitchen-mid-f.svg', x: 2197, y: 693, width: 86, height: 129, layer: 'middle' },
  { id: 'kitchen-mid-g', kind: 'static', src: 'kitchen-figma/kitchen-mid-g.svg', x: 8383, y: 516.223, width: 567, height: 299.985, layer: 'middle' },
  { id: 'kitchen-mid-h', kind: 'static', src: 'kitchen-figma/kitchen-mid-h.svg', x: 8894.001, y: 479, width: 107.663, height: 114.102, layer: 'middle' },
  { id: 'kitchen-mid-i', kind: 'static', src: 'kitchen-figma/kitchen-mid-i.svg', x: 4286, y: 626, width: 163, height: 128, layer: 'middle' },
  { id: 'kitchen-mid-j', kind: 'static', src: 'kitchen-figma/kitchen-mid-j.svg', x: 4406, y: 634, width: 170, height: 134, layer: 'middle' },
  { id: 'kitchen-mid-k', kind: 'static', src: 'kitchen-figma/kitchen-mid-k.svg', x: 22503, y: 259, width: 463, height: 538, layer: 'middle' },
  { id: 'kitchen-mid-l', kind: 'static', src: 'kitchen-figma/kitchen-mid-l.svg', x: 13316, y: 388, width: 578, height: 464, layer: 'middle' },
  { id: 'kitchen-mid-m', kind: 'static', src: 'kitchen-figma/kitchen-mid-m.svg', x: 19014, y: 402, width: 894, height: 460, layer: 'middle' },
  { id: 'kitchen-mid-n', kind: 'static', src: 'kitchen-figma/kitchen-mid-n.svg', x: 836, y: 710, width: 86, height: 129, layer: 'middle' },
  { id: 'kitchen-mid-o', kind: 'static', src: 'kitchen-figma/kitchen-mid-o.svg', x: 17345, y: 77, width: 91, height: 139, layer: 'middle' },
  { id: 'kitchen-mid-p', kind: 'static', src: 'kitchen-figma/kitchen-mid-p.svg', x: 17853, y: 77, width: 91, height: 139, layer: 'middle' }
];

const kitchenSplitMiddleTailAssets: SceneAsset[] = [
  { id: 'kitchen-mid-tail-31300', kind: 'static', src: 'kitchen-figma/kitchen-mid-tail-31300.svg', x: 7508, y: 340, width: 556, height: 476, layer: 'middle', isTail: true },
  { id: 'kitchen-mid-tail-31900', kind: 'static', src: 'kitchen-figma/kitchen-mid-tail-31900.svg', x: 8238, y: 180, width: 247, height: 594, layer: 'middle', isTail: true }
];

const kitchenInteractiveMiddleAssets: SceneAsset[] = [
  {
    id: 'coffee-machine',
    kind: 'interactive',
    src: 'kitchen-figma/kitchen-coffee-machine-21500.svg',
    x: 21284,
    y: 575,
    width: 82,
    height: 53,
    layer: 'middle',
    zOffset: 1,
    ariaLabel: 'Messaggio macchinetta del caffè',
    hoverDialogue: toolShedMessage,
    shineEffect: true,
    hoverDialoguePlacement: {
      left: -74,
      top: -138,
      width: 322,
      padding: 20,
      fontSize: 16,
      arrowLeft: 44,
      arrowTop: 138,
      arrowSize: 18
    }
  }
];

export const kitchenAssets: SceneAsset[] = [
  {
    id: 'layer-bg',
    kind: 'static',
    src: 'kitchen-figma/layer-bg-base.svg',
    x: 0,
    y: 0,
    width: kitchenSceneConfig.assetWidth,
    height: kitchenSceneConfig.sceneHeight,
    layer: 'background'
  },
  ...kitchenSplitBackgroundAssets,
  {
    id: 'layer-bg-tail',
    kind: 'static',
    src: 'kitchen-figma/layer-bg-tail-base.svg',
    x: 0,
    y: kitchenTailY,
    width: 23000,
    height: kitchenTailHeight,
    layer: 'background',
    isTail: true
  },
  ...kitchenSplitBackgroundTailAssets,
  {
    id: 'layer-mid',
    kind: 'static',
    src: 'kitchen-figma/layer-mid-base.svg',
    x: 0,
    y: 0,
    width: kitchenSceneConfig.assetWidth,
    height: kitchenSceneConfig.sceneHeight,
    layer: 'middle'
  },
  ...kitchenSplitMiddleAssets,
  ...kitchenInteractiveMiddleAssets,
  {
    id: 'layer-mid-tail',
    kind: 'static',
    src: 'kitchen-figma/layer-mid-tail-base.svg',
    x: 0,
    y: kitchenTailY,
    width: 23000,
    height: kitchenTailHeight,
    layer: 'middle',
    isTail: true
  },
  ...kitchenSplitMiddleTailAssets,
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

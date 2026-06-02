export type KitchenChefId = 'carlo';

export const kitchenSceneConfig = {
  sceneWidth: 24268,
  sceneHeight: 875,
  assetWidth: 24268,
  foregroundSvgWidth: 24268,
  foregroundSvgHeight: 875,
  foregroundBottomOffset: 0,
  floorHeight: 225,
  floorBottomOffset: -28,
  floorTileWidth: 224,
  chef: {
    id: 'carlo' as KitchenChefId,
    x: 1100,
    width: 185,
    visibleThreshold: 0.34
  },
  layerSpeed: {
    background: 0.38,
    middle: 1.2,
    title: 0.8,
    chef: 0.8,
    foreground: 1.14
  },
  cursorCss: "url('/cursors/retrogusto-cursor.svg') 5 5, auto",
  pointerCursorCss: "url('/cursors/retrogusto-cursor.svg') 5 5, pointer",
  title: 'Cucina',
  chefQuote:
    'Il 30 di gennaio era ancora un cantiere, quindi si entrava con l\'elmetto, col giubbotto catarifrangente e le scarpe antinfortunistiche.'
} as const;

export type KitchenSceneConfig = typeof kitchenSceneConfig;

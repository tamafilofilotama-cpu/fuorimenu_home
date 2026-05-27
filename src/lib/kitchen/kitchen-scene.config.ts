export type KitchenChefId = 'carlo';

export const kitchenSceneConfig = {
  sceneWidth: 8192,
  sceneHeight: 1211,
  assetWidth: 8192,
  foregroundSvgWidth: 5929,
  foregroundSvgHeight: 1022,
  foregroundBottomOffset: -180,
  floorHeight: 225,
  floorTileWidth: 224,
  chef: {
    id: 'carlo' as KitchenChefId,
    x: 1390,
    width: 300,
    visibleThreshold: 0.34
  },
  layerSpeed: {
    background: 0.38,
    middle: 0.78,
    title: 1.2,
    chef: 1.2,
    foreground: 1.14
  },
  cursorCss: "url('/cursors/retrogusto-cursor.svg') 5 5, auto",
  pointerCursorCss: "url('/cursors/retrogusto-cursor.svg') 5 5, pointer",
  title: 'Cucina',
  chefQuote:
    'Il 30 di gennaio era ancora un cantiere, quindi si entrava con l\'elmetto, col giubbotto catarifrangente e le scarpe antinfortunistiche.',
  helmet: {
    hotspot: {
      x: 1998,
      y: 404,
      width: 116,
      height: 104
    },
    source: {
      x: 1998,
      y: 436,
      width: 116,
      height: 104
    },
    videoPlaceholder: {
      x: 2158,
      y: 292,
      width: 430,
      height: 248
    }
  }
} as const;

export type KitchenSceneConfig = typeof kitchenSceneConfig;

export const kitchenHelmetGeometry = {
  offset: {
    x: kitchenSceneConfig.helmet.hotspot.x - kitchenSceneConfig.helmet.source.x,
    y: kitchenSceneConfig.helmet.hotspot.y - kitchenSceneConfig.helmet.source.y
  },
  pivot: {
    x: kitchenSceneConfig.helmet.source.x + kitchenSceneConfig.helmet.source.width * 0.78,
    y: kitchenSceneConfig.helmet.source.y + kitchenSceneConfig.helmet.source.height * 0.09
  }
} as const;

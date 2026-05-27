import Phaser from 'phaser';

export function mountHeadlessPhaserScene<Scene extends Phaser.Scene>(scene: Scene) {
  const game = new Phaser.Game({
    type: Phaser.HEADLESS,
    width: 1,
    height: 1,
    scene,
    banner: false,
    audio: { noAudio: true }
  });

  return {
    game,
    scene,
    destroy: () => game.destroy(true)
  };
}

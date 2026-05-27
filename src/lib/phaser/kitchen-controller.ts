import Phaser from 'phaser';

type Viewport = {
  width: number;
  height: number;
};

export type KitchenControllerState = {
  cameraX: number;
  targetCameraX: number;
  progress: number;
  helmetRotation: number;
  activeChefId: 'carlo' | undefined;
};

type KitchenControllerOptions = {
  sceneWidth: number;
  sceneHeight: number;
  chefX: number;
  chefWidth: number;
  getViewport: () => Viewport;
  onUpdate: (state: KitchenControllerState) => void;
};

class KitchenControllerScene extends Phaser.Scene {
  private cameraX = 0;
  private targetCameraX = 0;
  private dragStartX = 0;
  private dragCameraX = 0;
  private isDragging = false;
  private options: KitchenControllerOptions;

  constructor(options: KitchenControllerOptions) {
    super('KitchenControllerScene');
    this.options = options;
  }

  scrollBy(delta: number) {
    this.setTargetCameraX(this.targetCameraX + delta);
  }

  beginDrag(clientX: number) {
    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragCameraX = this.targetCameraX;
  }

  dragTo(clientX: number) {
    if (!this.isDragging) return;
    this.setTargetCameraX(this.dragCameraX + (this.dragStartX - clientX) * 1.35);
  }

  endDrag() {
    this.isDragging = false;
  }

  resize() {
    this.targetCameraX = this.clampCamera(this.targetCameraX);
    this.cameraX = this.clampCamera(this.cameraX);
  }

  update(_time: number, delta: number) {
    const distance = this.targetCameraX - this.cameraX;
    const easing = this.isDragging ? 0.26 : 0.13;
    const frameScale = Math.min(delta / 16.667, 2.4);
    const step = 1 - Math.pow(1 - easing, frameScale);

    if (Math.abs(distance) < 0.08) {
      this.cameraX = this.targetCameraX;
    } else {
      this.cameraX += distance * step;
    }

    this.options.onUpdate({
      cameraX: this.cameraX,
      targetCameraX: this.targetCameraX,
      progress: this.getProgress(),
      helmetRotation: this.getHelmetRotation(this.time.now),
      activeChefId: this.getActiveChefId()
    });
  }

  private setTargetCameraX(value: number) {
    this.targetCameraX = this.clampCamera(value);
  }

  private getMetrics() {
    const viewport = this.options.getViewport();
    const viewWidth = Math.max(viewport.width, 1);
    const viewHeight = Math.max(viewport.height, 1);
    const sceneScale = viewHeight / this.options.sceneHeight;
    const worldWidth = Math.max(viewWidth, this.options.sceneWidth * sceneScale);
    const maxScrollX = Math.max(0, worldWidth - viewWidth);

    return { viewWidth, sceneScale, maxScrollX };
  }

  private clampCamera(value: number) {
    return Phaser.Math.Clamp(value, 0, this.getMetrics().maxScrollX);
  }

  private getProgress() {
    const { maxScrollX } = this.getMetrics();
    return maxScrollX > 0 ? Phaser.Math.Clamp(this.cameraX / maxScrollX, 0, 1) : 0;
  }

  private getActiveChefId() {
    const { viewWidth, sceneScale } = this.getMetrics();
    const chefLeft = this.options.chefX * sceneScale - this.cameraX * 1.2;
    const chefRight = chefLeft + this.options.chefWidth * sceneScale;
    const visibleWidth = Math.min(chefRight, viewWidth) - Math.max(chefLeft, 0);
    const visibility = visibleWidth / Math.max(this.options.chefWidth * sceneScale, 1);

    return visibility > 0.34 ? 'carlo' : undefined;
  }

  private getHelmetRotation(time: number) {
    const t = (time % 3200) / 3200;
    const wave = Math.sin(t * Math.PI * 2);
    const harmonic = Math.sin(t * Math.PI * 4 + 0.55) * 0.22;
    const gravityHold = 0.88 + Math.cos(t * Math.PI * 2) * 0.12;

    return (wave + harmonic) * gravityHold * 4.3;
  }
}

export function mountKitchenController(options: KitchenControllerOptions) {
  const scene = new KitchenControllerScene(options);
  const game = new Phaser.Game({
    type: Phaser.HEADLESS,
    width: 1,
    height: 1,
    scene,
    banner: false,
    audio: { noAudio: true }
  });

  return {
    scrollBy: (delta: number) => scene.scrollBy(delta),
    beginDrag: (clientX: number) => scene.beginDrag(clientX),
    dragTo: (clientX: number) => scene.dragTo(clientX),
    endDrag: () => scene.endDrag(),
    resize: () => scene.resize(),
    destroy: () => game.destroy(true)
  };
}

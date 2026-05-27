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
  private helmetAngle = Phaser.Math.DegToRad(2.4);
  private helmetAngularVelocity = 0.6;
  private helmetHoverStartAngle = 0;
  private helmetHoverElapsed = 0;
  private isHelmetHovered = false;
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
    this.setTargetCameraX(this.dragCameraX + (this.dragStartX - clientX) * 1.95);
  }

  endDrag() {
    this.isDragging = false;
  }

  setHelmetHover(isHovered: boolean) {
    if (this.isHelmetHovered === isHovered) return;

    this.isHelmetHovered = isHovered;
    this.helmetHoverElapsed = 0;
    this.helmetHoverStartAngle = this.helmetAngle;

    if (isHovered) {
      this.helmetAngularVelocity = 0;
    } else {
      this.helmetAngularVelocity = 0.62;
    }
  }

  resize() {
    this.targetCameraX = this.clampCamera(this.targetCameraX);
    this.cameraX = this.clampCamera(this.cameraX);
  }

  update(_time: number, delta: number) {
    this.stepHelmetPendulum(delta);

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
      helmetRotation: this.getHelmetRotation(),
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

  private stepHelmetPendulum(delta: number) {
    const dt = Math.min(delta / 1000, 0.032);

    if (this.isHelmetHovered) {
      const hoverDuration = 0.32;
      const progress = Phaser.Math.Clamp(this.helmetHoverElapsed / hoverDuration, 0, 1);
      const falloff = Math.pow(1 - progress, 2.25);
      const shake = Math.sin(progress * Math.PI * 5) * falloff * Phaser.Math.DegToRad(3.2);

      this.helmetAngle = this.helmetHoverStartAngle * (1 - progress) + shake;
      this.helmetAngularVelocity = 0;
      this.helmetHoverElapsed += dt;

      if (progress >= 1) {
        this.helmetAngle = 0;
      }

      return;
    }

    const gravity = 1500;
    const pendulumLength = 22;
    const damping = 0.34;
    const ambientForce = Math.sin(this.time.now * 0.00135) * 0.045;
    const angularAcceleration =
      -(gravity / pendulumLength) * Math.sin(this.helmetAngle) -
      damping * this.helmetAngularVelocity +
      ambientForce;

    this.helmetAngularVelocity += angularAcceleration * dt;
    this.helmetAngle += this.helmetAngularVelocity * dt;

    if (Math.abs(this.helmetAngle) > Phaser.Math.DegToRad(2.8)) {
      this.helmetAngle = Phaser.Math.Clamp(
        this.helmetAngle,
        Phaser.Math.DegToRad(-2.8),
        Phaser.Math.DegToRad(2.8)
      );
      this.helmetAngularVelocity *= 0.42;
    }
  }

  private getHelmetRotation() {
    return Phaser.Math.RadToDeg(this.helmetAngle);
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
    setHelmetHover: (isHovered: boolean) => scene.setHelmetHover(isHovered),
    resize: () => scene.resize(),
    destroy: () => game.destroy(true)
  };
}

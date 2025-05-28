export default class DashPickup extends Phaser.Physics.Matter.Sprite {
  constructor(scene, x, y) {
    super(scene.matter.world, x, y, "dash-pickup");

    // Add this sprite to the scene
    scene.add.existing(this);

    this.id = "dash-pickup";
    this.name = "dash";
    this.collected = false;
    // Setup physics properties
    this.setIgnoreGravity(true);
    // this.setScale(1);
    if (this.body) {
      this.body.label = "dash-pickup";
      this.body.gameObject = this;
    }
    this.setCollisionCategory(scene.dashPickupCategory);
    this.setCollidesWith([scene.playerCategory, scene.dangerZoneCategory, scene.dashPickupCategory]);
    this.setScale(window.devicePixelRatio / 2);
    this.once("addedtoscene", () => {
      scene.tweens.add({
        targets: this,
        y: this.y - 7,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  setId(id) {
    this.id = `dash-pickup-${id}`;
  }

  getId() {
    return this.id;
  }

  pickup() {
    // Play collect animation and destroy
    if (this.collected) return;
    this.collected = true;
    // console.info("[DashPickup] Dash pickup collected!");
    this.particles = this.scene.add.particles(
      this.x,
      this.y + 8,
      "bubbleParticle",
      {
        speedY: { min: -50, max: -80 },
        speedX: { min: -10, max: 10 },
        scaleX: { start: 0.2, end: 0.5 },
        scaleY: { start: 0.2, end: 0.5 },
        alpha: { start: 1, end: 0 },
        lifespan: 1000,
        quantity: 1,
        gravityY: -100,
      }
    );

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 900,
      ease: 'Back.easeIn',
      onComplete: () => {
        if (this.particles) {
          this.particles.destroy();
          this.particles = null;
        }
        this.destroy();
      }
    });
  }
}

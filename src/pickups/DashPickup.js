export default class DashPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'dash-pickup');
    
    // Add this sprite to the scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setScale(window.devicePixelRatio / 2);
    this.id = "dash-pickup";
    this.name = "dash";
    // Setup physics properties
    this.body.setAllowGravity(false);
    this.setScale(1);
    this.scene.tweens.add({
      targets: this,
      y: this.y - 7,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
  }
  
  setId(id) {
    this.id = `dash-pickup-${id}`;
  }
  getId() {
    return this.id;
  }
  pickup() {
    // Play collect animation and destroy
    this.particles = this.scene.add.particles(this.x, this.y + 8, 'bubbleParticle',
        {
            speedY: { min: -50, max: -100 },
            speedX: { min: -20, max: 20 },
            scale: { start: 0.3, end: 1 },
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            quantity: 5,
            gravityY: -100,
        }
    );
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.destroy();
        this.particles.stop();
      }
    });
  }
}
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
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.destroy();
      }
    });
  }
}
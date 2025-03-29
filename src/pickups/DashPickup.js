export default class DashPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'dash-pickup');
    
    // Add this sprite to the scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.id = "dash-pickup";
    this.name = "dash";
    // Setup physics properties
    this.body.setAllowGravity(false);
    
    // Add a pulsing animation
    this.scene.tweens.add({
      targets: this,
      scale: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
    // Add a small rotation
    this.scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 3000,
      repeat: -1
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
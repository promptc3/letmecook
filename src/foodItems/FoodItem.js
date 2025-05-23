export default class FoodItem extends Phaser.Physics.Matter.Sprite {
  constructor(scene, x, y, texture, name = "food", type = "static") {
    super(scene.matter.world, x, y, texture);
    // Add the sprite to the scene
    scene.add.existing(this);
    this.name = name;
    this.type = type;
    this.isPickedUp = false;
    this.isCollectable = false;

    // Store reference to the scene
    this.setInteractive();
    this.isDropping = false;

    // Generate a unique ID for this food item
    this._id = "food_" + Math.random().toString(36);
    this.setupPointerEvents(scene);
    // this.debugGraphics = scene.add.graphics({ lineStyle: { width: 10, color: 0xffdd00, alpha: 0.5 } });
    // this.line = new Phaser.Geom.Line();
  }

  setupPointerEvents(scene) {
    this.on("pointerover", function (pointer) {
      scene.input.setDefaultCursor(
        "url(./../assets/UI/spriteSheets/mouseSprites/Catpaw-Mouse-icon.cur), pointer"
      );
      console.info("Pointer over sprite");
    });

    this.on("pointerout", function (pointer) {
      scene.input.setDefaultCursor(
        "url(./../assets/UI/spriteSheets/mouseSprites/Catpaw-pointing-Mouse-icon.cur), pointer"
      );
    });

    this.on("pointerdown", function (pointer) {
      scene.input.setDefaultCursor(
        "url(./../assets/UI/spriteSheets/mouseSprites/Catpaw-holding-Mouse-icon.cur), pointer"
      );
      if (this.isCollectable) {
        scene.events.emit("pickupFood", this);
      }
    });
  }

  setId(id) {
    this._id = id;
  }

  getId() {
    return this._id;
  }

  // Method to handle being picked up by the player
  pickup() {
    if (!this.isPickedUp) {
      this.isPickedUp = true;
      this.disableBody(true, true);
      console.log(`${this.name} has been picked up by player`);
      // this.particles.setActive(true);
      const particleZone = new Phaser.Geom.Rectangle(0, 0, 16, 40);
      this.particles = this.scene.add.particles(
        this.x - 8,
        this.y - 20,
        "starParticle",
        {
          lifespan: 600,
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          speed: { min: 20, max: 50 },
          quantity: 10,
          frequency: 50,
          emitZone: {
            type: "random",
            source: particleZone,
          },
          blendMode: "SCREEN",
        }
      );
      this.scene.tweens.add({
        targets: this,
        scale: { from: 1, to: 0.3 },
        alpha: 0,
        duration: 1100,
        ease: "Back.easeOut",
        onComplete: () => {
          this.setVisible(false);
          this.particles.stop();
        },
      });
      return true;
    }
    return false;
  }

  drop(player, dropX, dropY) {
    const playerX = player.x;
    const playerY = player.y;

    if (!this.isPickedUp) return false;

    this.isPickedUp = false;
    this.isDropping = true;

    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(1);

    // Configure physics body properties
    this.enableBody(true, playerX, playerY, true, true);
    this.setPosition(playerX, playerY);
    this.body.reset(playerX, playerY);
    this.setCollideWorldBounds(true);
    this.setDamping(true);
    this.setDrag(0.1,0.1);

    const throwAngle = Phaser.Math.Angle.Between(
      playerX,
      playerY,
      dropX,
      dropY
    );
    // Phaser.Geom.Line.SetToAngle(this.line, playerX, playerY, throwAngle, 128);
    // this.debugGraphics.clear().strokeLineShape(this.line);
    const newVel = this.scene.matter.applyForceFromAngle(throwAngle, 250);
    this.setRotation(throwAngle);
    // this.setVelocity(newVel.x, newVel.y);
    // console.info("New food item velocity", newVel)

    // Optional: after a short delay, make the object static again
    this.scene.time.delayedCall(300, () => {
      if (this.body && this.body.world && !this.body.pendingDestroy) {
        this.scene.sound.play("drop");
        this.isDropping = false;
        player.toggleReadyToDrop();
      }
    });

    return true;
  }

  update() {
    this.isCollectable = Phaser.Geom.Intersects.RectangleToRectangle(
      this.scene.player.getDangerZoneBounds(),
      this.getBounds()
    );
  }
}

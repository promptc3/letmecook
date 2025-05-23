export default class Player extends Phaser.Physics.Matter.Sprite {
  constructor(scene, x, y) {
    super(scene.matter.world, x, y);

    // Add this sprite to the scene
    scene.add.existing(this);

    // this.setSize(32, 48);

    // this.body.setCircle(radius, 0, 0);
    this.setScale(0.5);
    // this.body.setGravity(false);
    // this.body.setCollideWorldBounds(false);

    // Movement properties
    this.moveSpeed = 200;
    this.lerpFactor = 0.1; // Controls how smoothly the player follows the cursor (0-1)

    // danger zone (2x the radius of the player)
    this.dangerZone = scene.add.rectangle(x, y, 60, 60);
    scene.add.existing(this.dangerZone, false); // false = non-static body

    // Make danger zone not collide with anything physically
    this.dangerZone.body.setCollideWorldBounds(false);

    // Player's inventory
    this.inventory = new Map();

    // Player's powerups
    this.powerUps = [];
    this.activePowerUp = undefined;

    // Store a reference to the input manager
    this.input = scene.input;
    this.name = "Player";
    this.isPlaying = true;
    this.duration = 0;

    // add keys
    // Input setup for WASD and Arrow keys
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      F: Phaser.Input.Keyboard.KeyCodes.F
    });

    // Other properties
    this.readyToDash = false;
    this.readyToDashStart = undefined;
    this.isDashing = false;
    this.dashSpeed = 1200;
    this.dashActiveDuration = 5000;
    this.dashDuration = 800;
    this.dashStart = undefined;
    this.isStunned = false;
    this.stunDuration = 2700;
    this.readyToDrop = false;
    this.input.hitArea = new Phaser.Geom.Rectangle(0, 0, 32, 48); // Set hit area for the input
    this.setupAnimations(scene);
    this.directionMap = new Map([
      [8, "w"],
      [1, "nw"],
      [2, "n"],
      [3, "ne"],
      [4, "e"],
      [5, "se"],
      [6, "s"],
      [7, "sw"],
    ]);
    scene.time.addEvent({
      delay: 1000, // 1 second
      callback: () => {
        if (this.isPlaying) {
          this.duration += 1;
          // console.log(`Time Played: ${this.duration}s`);
        }
      },
      loop: true,
    });
    this.setupFootstepSounds(scene);
    scene.events.on('cookRecipe', args => this.handleCookRecipe(args), this);
    scene.events.on('pickupFood', args => this.collectFoodItem(args), this);
  }

  handleCookRecipe(args) {
    this.scene.tweens.add({
        targets: this,
        y: this.x + 50,
        duration: 700,
        ease: 'Linear'
    });
  }

  setupFootstepSounds(scene) {
    const s1 = scene.sound.add("footstep1", { volume: 0.3 });
    const s2 = scene.sound.add("footstep2", { volume: 0.3 });
    this.footstepSounds = [s1, s2];
    this.currentFootstep = 0;
    this.walkTimer = scene.time.addEvent({
      delay: 300, // Adjust to match step timing
      callback: this.playFootstep,
      callbackScope: this,
      loop: true,
    });
    this.walkTimer.paused = true;
  }

  setupAnimations(scene) {
    const frameRate = 10;
    const repeat = -1;
    scene.anims.create({
      key: "idle",
      frames: scene.anims.generateFrameNumbers("orange_player_idle", {
        start: 0,
        end: 7,
      }),
      frameRate: frameRate,
      repeat: repeat,
    });
    scene.anims.create({
      key: "walk_n",
      frames: scene.anims.generateFrameNumbers("orange_walk_n", {
        start: 0,
        end: 7,
      }),
      frameRate: frameRate,
      repeat: repeat,
    });
    scene.anims.create({
      key: "walk_e",
      frames: scene.anims.generateFrameNumbers("orange_walk_e", {
        start: 0,
        end: 7,
      }),
      frameRate: frameRate,
      repeat: repeat,
    });
    scene.anims.create({
      key: "walk_w",
      frames: scene.anims.generateFrameNumbers("orange_walk_w", {
        start: 0,
        end: 7,
      }),
      frameRate: frameRate,
      repeat: repeat,
    });
    scene.anims.create({
      key: "walk_s",
      frames: scene.anims.generateFrameNumbers("orange_walk_s", {
        start: 0,
        end: 7,
      }),
      frameRate: frameRate,
      repeat: repeat,
    });
    scene.anims.create({
      key: "walk_ne",
      frames: scene.anims.generateFrameNumbers("orange_walk_ne", {
        start: 0,
        end: 7,
      }),
      frameRate: frameRate,
      repeat: repeat,
    });
    scene.anims.create({
      key: "walk_nw",
      frames: scene.anims.generateFrameNumbers("orange_walk_nw", {
        start: 0,
        end: 7,
      }),
      frameRate: frameRate,
      repeat: repeat,
    });
    scene.anims.create({
      key: "walk_se",
      frames: scene.anims.generateFrameNumbers("orange_walk_se", {
        start: 0,
        end: 7,
      }),
      frameRate: frameRate,
      repeat: repeat,
    });
    scene.anims.create({
      key: "walk_sw",
      frames: scene.anims.generateFrameNumbers("orange_walk_sw", {
        start: 0,
        end: 7,
      }),
      frameRate: frameRate,
      repeat: repeat,
    });
    this.anims.play("idle", true);
    // this.setFrame('orange_player_idle',0)
  }

  setName(name) {
    const fontConfig = {
      fontFamily: "pixelFont",
      fontSize: "9px",
      fill: "#000",
    };
    this.nameUI = this.scene.add.text(this.x, this.y, `${name}`, fontConfig);
    this.name = name;
  }

  getDangerZoneBounds() {
    return this.dangerZone.getBounds();
  }

  setupDangerZoneOverlap(foodItems, powerUps) {
    this.scene.matter.add.overlap(
      this.dangerZone,
      powerUps,
      this.collectPowerUp,
      null,
      this
    );
  }

  toggleReadyToDrop() {
    this.readyToDrop = !this.readyToDrop;
  }

  collectFoodItem(foodItem) {
    // Add obstacle to inventory if not already collected
    const item = this.inventory.get(foodItem.name);
    // console.info(`[Player] Inventory:`, this.inventory);
    this.scene.events.emit("foodCollected", foodItem);
    if (item !== undefined) {
      const newQty = item.quantity + 1;
      // console.info(`[Player] Collected item: ${foodItem.name} Qty: ${item.quantity}`);
      this.inventory.set(foodItem.name, { quantity: newQty, obj: foodItem });
    } else {
      // console.info(`[Player] Collected item: ${foodItem.name} Qty: ${1}`);
      this.inventory.set(foodItem.name, { quantity: 1, obj: foodItem });
    }
  }

  dropFoodItem(name) {
    // console.info(`[player] Dropping ${name} from `, this.inventory);
    const item = this.inventory.get(name);
    if (item === undefined) return;
    if (item.quantity === 1) {
      this.inventory.delete(name);
    } else {
      this.inventory.set(item, { quantity: item.quantity - 1, obj: item.obj });
    }
    return item.obj;
  }

  collectPowerUp(dangerZone, powerUp) {
    if (!this.powerUps.includes(powerUp)) {
      this.powerUps.push(powerUp);
      console.log(`Collected power-up: ${powerUp.name || "unnamed powerUp"}`);
      this.scene.events.emit("powerUpCollected", powerUp);
      this.activePowerUp = powerUp;
    }
  }

  enablePowerUp() {
    console.log("Power-up activated:", this.activePowerUp);
    if (this.activePowerUp === null || this.activePowerUp === undefined) return;
    switch (this.activePowerUp.name) {
      case "speedBoost":
        this.moveSpeed *= 1.5; // Increase speed by 50%
        break;
      case "dash":
        this.setReadyToDash(); // Enable dash ability
        this.powerUps = this.powerUps.filter(
          (powerUp) => powerUp.getId() !== this.activePowerUp.getId()
        ); // Remove dash from power-ups
        break;
      default:
        break;
    }
    if (this.powerUps.length > 0) {
      this.activePowerUp = this.powerUps[0];
    } else {
      this.activePowerUp = null;
    }
  }
  createDashEffect() {
    // Create a trail effect when dashing
    const trail = this.scene.add
      .image(this.x, this.y, this.texture.key)
      .setAlpha(0.7)
      .setTint(0xaefa00, 0.5) // Red tint for the trail
      .setScale(this.scaleX, this.scaleY)
      .setFlipX(this.flipX);

    // Fade out and destroy the trail
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        trail.destroy();
      },
    });
  }

  handleCollision() {
    // console.log('Collision detected!', 'Stunned: ', this.isStunned, 'Dashing: ', this.readyToDash);
    if (this.readyToDash && !this.isStunned) {
      console.log("Stunned!");
      this.isStunned = true;
      this.moveSpeed = 0;
      this.body.setVelocity(0, 0);
      this.nameUI.setText(`${this.name}::Stunned`);
      this.scene.events.emit("playerStunned", Math.random() * 3 + 1);
      // End dash after duration
      this.scene.tweens.add({
        targets: this,
        duration: 100,
        alpha: 0,
        yoyo: true,
        repeat: Math.floor(this.stunDuration / 200) - 1,
        onComplete: () => {
          this.alpha = 1;
          this.moveSpeed = 200;
          this.isStunned = false;
          this.nameUI.setText(this.name);
        },
      });
    } else {
      // console.log('stopping');
      this.setVelocity(0, 0);
      this.walkTimer.paused = true;
    }
  }

  playFootstep() {
    this.footstepSounds[this.currentFootstep].play();
    this.currentFootstep =
      (this.currentFootstep + 1) % this.footstepSounds.length; // Toggle between 0 and 1
  }

  updateDangerZone() {
    this.dangerZone.x = this.x;
    this.dangerZone.y = this.y;
  }

  updateText() {
    this.nameUI.x = this.x - this.width / 2;
    this.nameUI.y = this.y - this.height / 2;
  }

  setTargetLocation(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  setReadyToDash() {
    // this.moveSpeed = this.dashSpeed;
    if (!this.readyToDash && (this.dashStart || this.readyToDrop)) return;
    this.readyToDash = true;
    this.readyToDashStart = this.scene.time.now;
    this.moveSpeed = this.dashSpeed;
    return true;
  }

  performDash() {
    this.dashStart = this.scene.time.now;
    this.isDashing = true;
  }

  update() {
    let velocityX = 0;
    let velocityY = 0;
    let crntDirectionIndex = 1;

    if (this.cursors.left.isDown || this.keys.A.isDown) velocityX = -1;
    else if (this.cursors.right.isDown || this.keys.D.isDown) velocityX = 1;

    if (this.cursors.up.isDown || this.keys.W.isDown) velocityY = -1;
    else if (this.cursors.down.isDown || this.keys.S.isDown) velocityY = 1;

    const isMoving = velocityX !== 0 || velocityY !== 0;

    if (this.readyToDash && !this.dashStart) {
      if (this.scene.time.now - this.readyToDashStart < this.dashActiveDuration) {
        this.performDash();
      }
    }
    if (isMoving && this.isDashing) {
      if (this.scene.time.now - this.dashStart > this.dashDuration) {
        this.readyToDash = false;
        this.moveSpeed = 200;
        this.dashStart = undefined;
        this.isDashing = false;
        this.setVelocity(0, 0);
      }
    }
    if (isMoving) {
      const dir = new Phaser.Math.Vector2(velocityX, velocityY).normalize();
      this.setVelocity(dir.x * this.moveSpeed, dir.y * this.moveSpeed);

      // Set animation based on angle
      const angle = Math.atan2(dir.y, dir.x);
      const angleNormalized = (angle + Math.PI) / (Math.PI * 2);
      const directionIndex = Math.floor(angleNormalized * 8);
      crntDirectionIndex = directionIndex;
      const directionKey = this.directionMap.get(directionIndex);
      // console.info('direction key: ', directionKey, ' direction Index: ', directionIndex);
      this.anims.play(`walk_${directionKey}`, true);
      this.walkTimer.paused = false;

      // Store latest input direction for dash
      this.dashDirection = dir;
      if (this.isDashing) {
        this.createDashEffect();
      }
    } else {
      this.setVelocity(0, 0);
      // this.anims.play("idle", true);
      this.setFrame('orange_player_idle', crntDirectionIndex);
      this.walkTimer.paused = true;
    }

    this.updateDangerZone();
    this.updateText();
  }
}

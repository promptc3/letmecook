import Phaser from "phaser";

export default class Player extends Phaser.Physics.Matter.Sprite {
  constructor(scene, x, y) {
    // Added texture and frame for clarity
    // Pass the scene's Matter.js world instance to the super constructor
    // The texture and frame are also important for the sprite
    super(scene.matter.world, x, y);

    // Add this sprite to the scene
    scene.add.existing(this);

    this.setBody({
      type: "rectangle",
      width: 32,
      height: 48,
      label: "player",
      gameObject: this
    });
    this.setScale(0.5);

    this.setSizeToFrame(this.scene.textures.get("orange_player_idle", 0));
    // Set common Matter.js properties for a player character
    this.setFixedRotation(); // Prevent the player from rotating on collisions
    this.setFrictionAir(0.05); // Add some air resistance for smoother stopping
    this.setMass(10); // Give the player some mass
    this.setBounce(0.0); // No bounce by default for a character

    this.setIgnoreGravity(true); // Assuming a top-down game as per original code

    this.setCollisionCategory(scene.playerCategory);
    this.setCollidesWith([scene.foodItemCategory, scene.playerCategory,
         scene.dashPickupCategory, scene.utensilSwitchCategory, scene.dangerZoneCategory]);
    // Adapt categories as per your game's collision needs.

    // Movement properties
    this.moveSpeed = 5;
    this.lerpFactor = 0.1; // Controls how smoothly the player follows the cursor (0-1)

    this.dangerZone = scene.matter.add.rectangle(x, y, 60, 60, {
      isSensor: true,
      isStatic: false,
      label: "dangerZone",
      gameObject: this,
    });
    // After creating the dangerZone body
    this.dangerZone.collisionFilter.category = scene.dangerZoneCategory;
    this.dangerZone.collisionFilter.mask = scene.foodItemCategory | scene.dashPickupCategory;

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
    this.input.hitArea = new Phaser.Geom.Rectangle(0, 0, 32, 48); // Generally not needed for Matter sprites as input is handled by the body itself
    this.setupAnimations(scene);
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
    scene.events.on("pickupFood", (args) => this.collectFoodItem(args), this);

    // --- Matter.js Collision Event Listener for the Player ---
    this.scene.matter.world.on(
      "collisionstart",
      this.handleMatterCollision,
      this
    );
  }

  // New Matter.js specific collision handler
  handleMatterCollision(event, bodyA, bodyB) {
    // Check if the current player's body is one of the colliding bodies
    // console.info("[player] Collision detected between bodies:", bodyA, bodyB);
    if (
      (bodyA === this.dangerZone && bodyB.label === "dash-pickup") ||
      (bodyB === this.dangerZone && bodyA.label === "dash-pickup")
    ) {
      // Get the DashPickup game object
      const dashPickupBody = bodyA.label === "dash-pickup" ? bodyA : bodyB;
      const dashPickup = dashPickupBody.gameObject;
      if (dashPickup && dashPickup.name === "dash") {
        dashPickup.pickup();
        this.collectPowerUp(dashPickup);
      }
    }
  }

  handleCookRecipe(foodItem) {
    this.scene.tweens.add({
      targets: this,
      onStart: () => {
        this.setVelocityY(-50); // Small upward velocity
      },
      duration: 350, // Shorter duration for a quick effect
      ease: "Sine.easeOut", // More natural jump curve
      yoyo: true, // Go back down
    });
    this.collectFoodItem(foodItem);
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
    const bounds = this.dangerZone.bounds; // this.dangerZone is the Matter.Body object
    const x = bounds.min.x;
    const y = bounds.min.y;
    const width = bounds.max.x - bounds.min.x;
    const height = bounds.max.y - bounds.min.y;

    // You can return a Phaser.Geom.Rectangle if you want, or just the values
    return new Phaser.Geom.Rectangle(x, y, width, height);
  }
  toggleReadyToDrop() {
    this.readyToDrop = !this.readyToDrop;
  }

  collectFoodItem(foodItem) {
    // Add obstacle to inventory if not already collected
    const existingItem = this.inventory.get(foodItem.name);
    // console.info(`[Player] Inventory:`, this.inventory);
    this.scene.events.emit("foodCollected", foodItem);
    if (existingItem !== undefined) {
      const newQty = existingItem.quantity + 1;
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

  collectPowerUp(powerUp) {
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

  handleCollision(otherGameObject) {
    // Changed signature to accept the other GameObject
    // console.log('Collision detected!', 'Stunned: ', this.isStunned, 'Dashing: ', this.readyToDash);
    if (this.readyToDash && !this.isStunned) {
      console.log("Stunned!");
      this.isStunned = true;
      this.moveSpeed = 0;
      this.setVelocity(0, 0); // Correct for Matter.js
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
      this.setVelocity(0, 0); // Correct for Matter.js
      this.walkTimer.paused = true;
    }
  }

  playFootstep() {
    this.footstepSounds[this.currentFootstep].play();
    this.currentFootstep =
      (this.currentFootstep + 1) % this.footstepSounds.length; // Toggle between 0 and 1
  }

  updateDangerZone() {
    this.dangerZone.position.x = this.x;
    this.dangerZone.position.y = this.y;
  }

  updateText() {
    this.nameUI.x = this.x - this.nameUI.width / 2; // Center the text
    this.nameUI.y = this.y - this.height / 2 - 10; // Position above the player
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
    let crntFrame = 'idle'

    if (this.cursors.left.isDown || this.keys.A.isDown) velocityX = -1;
    else if (this.cursors.right.isDown || this.keys.D.isDown) velocityX = 1;

    if (this.cursors.up.isDown || this.keys.W.isDown) velocityY = -1;
    else if (this.cursors.down.isDown || this.keys.S.isDown) velocityY = 1;

    const isMoving = velocityX !== 0 || velocityY !== 0;

    if (this.readyToDash && !this.dashStart) {
      if (
        this.scene.time.now - this.readyToDashStart <
        this.dashActiveDuration
      ) {
        this.performDash();
      }
    }

    // Changed logic for dash duration handling to allow continuous movement during dash
    if (
      this.isDashing &&
      this.scene.time.now - this.dashStart > this.dashDuration
    ) {
      this.readyToDash = false;
      this.moveSpeed = 200; // Reset speed after dash
      this.dashStart = undefined;
      this.isDashing = false;
      // No need to set velocity to 0 here unless movement stops
    }

    if (isMoving && !this.isStunned) {
      const dir = new Phaser.Math.Vector2(velocityX, velocityY).normalize();
      // In Matter.js, setVelocity is fine for direct control.
      this.setVelocity(dir.x * this.moveSpeed, dir.y * this.moveSpeed);

      // Set animation based on angle
      const angle = Math.atan2(dir.y, dir.x);
      // Adjust angle to match your directionMap:
      // Assuming your directionMap uses 0=East, 1=NE, 2=N, 3=NW, 4=W, 5=SW, 6=S, 7=SE
      const angleDeg = Phaser.Math.RadToDeg(angle);
      let normalizedAngle = angleDeg >= 0 ? angleDeg : angleDeg + 360;
      crntDirectionIndex = Math.round(normalizedAngle / 45) % 8; // Adjust to 0-7
      if (crntDirectionIndex === 8) crntDirectionIndex = 0; // Handle 360/0 overlap
      const standardDirectionMap = ["e", "se", "s", "sw", "w", "nw", "n", "ne"];
      const actualDirectionKey = standardDirectionMap[crntDirectionIndex]; // Use crntDirectionIndex directly
      crntFrame = `walk_${actualDirectionKey}`;
      this.anims.play(`walk_${actualDirectionKey}`, true);

      this.walkTimer.paused = false;

      // Store latest input direction for dash
      this.dashDirection = dir;
      if (this.isDashing) {
        this.createDashEffect();
      }
    } else {
      // Only set velocity to 0 if NOT dashing AND not moving (user input)
      if (!this.isDashing) {
        this.setVelocity(0, 0);
      }
      this.setFrame(0); // Assuming idle frames align with direction
      this.walkTimer.paused = true;
    }

    this.updateDangerZone();
    this.updateText();
  }
}

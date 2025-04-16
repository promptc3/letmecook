export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        // Add this sprite to the scene
        scene.add.existing(this);

        const spriteHeight = this.height * this.scaleY;

        // Enable physics on this sprite
        scene.physics.add.existing(this);
        this.scene.physics.world.enable(this);
        // this.setSize(32, 48);
        
        // this.body.setCircle(radius, 0, 0);
        this.body.setSize(32, 48);
        // this.body.setGravity(false);
        // this.body.setCollideWorldBounds(false); 
        
        // Movement properties
        this.moveSpeed = 200;
        this.lerpFactor = 0.10; // Controls how smoothly the player follows the cursor (0-1)

        // danger zone (2x the radius of the player)
        this.dangerZone = scene.add.rectangle(x, y, 32, 48);
        scene.physics.add.existing(this.dangerZone, false); // false = non-static body
        
        // Make danger zone not collide with anything physically
        this.dangerZone.body.setCollideWorldBounds(false);
        
        // Player's inventory
        this.inventory = [];

        // Player's powerups
        this.powerUps = [];
        this.activePowerUp = undefined;
        
        // Store a reference to the input manager
        this.input = scene.input;
        this.name = 'Player';
        this.isPlaying = true;
        this.duration = 0;

        // Other properties
        this.isDashing = false;
        this.dashSpeed = 1200;
        this.dashDuration = 800;
        this.dashStart = undefined;
        this.isStunned = false;
        this.stunDuration = 1700;
        this.input.hitArea = new Phaser.Geom.Rectangle(0, 0, 32, 48); // Set hit area for the input
        this.setupAnimations(scene);
        this.directionMap = new Map([
            [0, 'w'], [1, 'nw'], [2, 'n'], [3, 'ne'], [4, 'e'], [5, 'se'], [6, 's'], [7, 'sw']
        ]);
        scene.time.addEvent({
            delay: 1000, // 1 second
            callback: () => {
                if (this.isPlaying) {
                    this.duration += 1;
                    // console.log(`Time Played: ${this.duration}s`);
                }
            },
            loop: true
        });
        this.setupFootstepSounds(scene);
    }

    setupFootstepSounds(scene) {
        const s1 = scene.sound.add('footstep1', { volume: 0.3 });
        const s2 = scene.sound.add('footstep2', { volume: 0.3 });
        this.footstepSounds = [s1, s2];
        this.currentFootstep = 0;
        this.walkTimer = scene.time.addEvent({
            delay: 300, // Adjust to match step timing
            callback: this.playFootstep,
            callbackScope: this,
            loop: true
        });
        this.walkTimer.paused = true; 
    }

    setupAnimations(scene) {
        const frameRate = 10;
        const repeat = -1;
        scene.anims.create({
            key: 'idle',
            frames: scene.anims.generateFrameNumbers('orange_player_idle', { start: 0, end: 7 }),
            frameRate: frameRate,
            repeat: repeat
        });
        scene.anims.create({
            key: 'walk_n',
            frames: scene.anims.generateFrameNumbers('orange_walk_n', { start: 0, end: 7 }),
            frameRate: frameRate,
            repeat: repeat
        });
        scene.anims.create({
            key: 'walk_e',
            frames: scene.anims.generateFrameNumbers('orange_walk_e', { start: 0, end: 7 }),
            frameRate: frameRate,
            repeat: repeat
        });
        scene.anims.create({
            key: 'walk_w',
            frames: scene.anims.generateFrameNumbers('orange_walk_w', { start: 0, end: 7 }),
            frameRate: frameRate,
            repeat: repeat
        });
        scene.anims.create({
            key: 'walk_s',
            frames: scene.anims.generateFrameNumbers('orange_walk_s', { start: 0, end: 7 }),
            frameRate: frameRate,
            repeat: repeat
        });
        scene.anims.create({
            key: 'walk_ne',
            frames: scene.anims.generateFrameNumbers('orange_walk_ne', { start: 0, end: 7 }),
            frameRate: frameRate,
            repeat: repeat
        });
        scene.anims.create({
            key: 'walk_nw',
            frames: scene.anims.generateFrameNumbers('orange_walk_nw', { start: 0, end: 7 }),
            frameRate: frameRate,
            repeat: repeat
        });
        scene.anims.create({
            key: 'walk_se',
            frames: scene.anims.generateFrameNumbers('orange_walk_se', { start: 0, end: 7 }),
            frameRate: frameRate,
            repeat: repeat
        });
        scene.anims.create({
            key: 'walk_sw',
            frames: scene.anims.generateFrameNumbers('orange_walk_sw', { start: 0, end: 7 }),
            frameRate: frameRate,
            repeat: repeat
        });
        this.anims.play('idle', true);
    }

    setName(name) {
        this.name = this.scene.add.text(this.x, this.y, `${this.isStunned ? name+"::Stunned" : name}`, { fontSize: '9px', fill: '#000' });
    }

    setupDangerZoneOverlap(foodItems, powerUps) {
        this.scene.physics.add.overlap(
            this.dangerZone, 
            foodItems, 
            this.collectFoodItem, 
            null, 
            this
        );
        this.scene.physics.add.overlap(
            this.dangerZone, 
            powerUps, 
            this.collectPowerUp, 
            null, 
            this
        );
    }

    collectFoodItem(dangerZone, foodItem) {
        // Add obstacle to inventory if not already collected
        if (!this.inventory.includes(foodItem)) {
            this.inventory.push(foodItem);
            console.log(`Collected obstacle: ${foodItem.name || 'unnamed foodItem'}`);
            this.scene.events.emit('foodCollected', foodItem);
        }
    }

    collectPowerUp(dangerZone, powerUp) {
        if (!this.powerUps.includes(powerUp)) {
            this.powerUps.push(powerUp);
            console.log(`Collected power-up: ${powerUp.name || 'unnamed powerUp'}`);
            this.scene.events.emit('powerUpCollected', powerUp);
            this.activePowerUp = powerUp;
        }
    }

    enablePowerUp() {
        console.log("Power-up activated:", this.activePowerUp);
        if (this.activePowerUp === null || this.activePowerUp === undefined) return;
        switch (this.activePowerUp.name) {
            case 'speedBoost':
                this.moveSpeed *= 1.5; // Increase speed by 50%
                break;
            case 'dash':
                this.performDash(); // Enable dash ability
                this.powerUps = this.powerUps.filter(powerUp => powerUp.getId() !== this.activePowerUp.getId()); // Remove dash from power-ups
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
    performDash() {
        // this.moveSpeed = this.dashSpeed;
        if (this.isDashing) return false;
        
        this.isDashing = true;
        this.moveSpeed = this.dashSpeed;
        return true;
    }
  
    createDashEffect() {
        // Create a trail effect when dashing
        const trail = this.scene.add.image(this.x, this.y, this.texture.key)
        .setAlpha(0.7)
        .setTint(0x3498db)
        .setScale(this.scaleX, this.scaleY)
        .setFlipX(this.flipX);
        
        // Fade out and destroy the trail
        this.scene.tweens.add({
        targets: trail,
        alpha: 0,
        duration: 300,
        onComplete: () => {
            trail.destroy();
        }
        });
    }

    handleCollision() {
        console.log('Collision detected!', 'Stunned: ', this.isStunned, 'Dashing: ', this.isDashing);
        if (this.isDashing && !this.isStunned) {
            console.log('Stunned!');
            this.isStunned = true;
            this.moveSpeed = 0;
            this.body.setVelocity(0, 0);
            this.scene.events.emit('playerStunned', Math.random()*3 + 1);
            // End dash after duration
            this.scene.time.delayedCall(this.stunDuration, () => {
                this.moveSpeed = 400;
                this.isStunned = false;
            });
        } else {
            // console.log('stopping');
            this.body.setVelocity(0, 0);
            this.walkTimer.paused = true;
        }
    }

    playFootstep() {
        this.footstepSounds[this.currentFootstep].play();
        this.currentFootstep = (this.currentFootstep + 1) % this.footstepSounds.length; // Toggle between 0 and 1
    }

    updateDangerZone() {
        this.dangerZone.x = this.x;
        this.dangerZone.y = this.y;
    }

    updateText() {
        this.name.x = this.x - this.width/2;
        this.name.y = this.y - this.height/2;
    }

    update() {
        const pointer = this.input.activePointer;
        
        // Handle dash duration
        if (this.isDashing && this.scene.time.now - this.dashStart > this.dashDuration) {
            this.body.setVelocity(0, 0);
            this.moveSpeed = 400;
            this.isDashing = false;
            this.dashStart = undefined;

            // IMPORTANT: stop targeting to prevent snap/jitter
            this.targetX = undefined;
            this.targetY = undefined;

            // Also freeze velocity just in case
            this.body.velocity.x = 0;
            this.body.velocity.y = 0;
        }

        // Update movement target if mouse is held down
        if (pointer.isDown) {
            this.targetX = pointer.worldX;
            this.targetY = pointer.worldY;
            
            if (this.isDashing && !this.dashStart) {
                this.dashStart = this.scene.time.now;
                this.createDashEffect();
            }
        }

        // Skip movement if there's no target or dash just ended
        if (this.targetX === undefined || this.targetY === undefined) {
            this.body.setVelocity(0, 0);
            this.anims.play('idle', true);
            this.walkTimer.paused = true;
            this.updateDangerZone();
            this.updateText();
            return;
        }

        // Movement logic
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            const decelerationFactor = Phaser.Math.Clamp(distance / 100, 0.1, 1);
            const speedX = (dx / distance) * this.moveSpeed * decelerationFactor;
            const speedY = (dy / distance) * this.moveSpeed * decelerationFactor;

            if (this.isDashing) {
                this.body.setVelocity(speedX, speedY);
            } else {
                this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, speedX, this.lerpFactor);
                this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, speedY, this.lerpFactor);
            }

            // Handle animations
            const angle = Math.atan2(dy, dx);
            const angleNormalized = ((angle + Math.PI) / (Math.PI * 2));
            const directionIndex = Math.floor(angleNormalized * 8);
            const directionKey = this.directionMap.get(directionIndex);

            this.anims.play(`walk_${directionKey}`, true);
            this.walkTimer.paused = false;
        } else {
            // Stop movement if close to target
            this.body.setVelocity(0, 0);
            this.setFrame(0);
            this.walkTimer.paused = true;
            this.targetX = undefined;
            this.targetY = undefined;
        }

        this.updateDangerZone();
        this.updateText();
    }

}
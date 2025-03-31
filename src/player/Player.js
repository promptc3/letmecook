export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        
        // Add this sprite to the scene
        scene.add.existing(this);

        this.setScale(0.5);
        const spriteHeight = this.height * this.scaleY;

        // Enable physics on this sprite
        scene.physics.add.existing(this);
        
        // Set up physics body properties
        const radius = spriteHeight/2;
        
        // this.body.setCircle(radius, 0, 0);
        // this.body.setGravity(false);
        // this.body.setCollideWorldBounds(false); 
        
        // Movement properties
        this.moveSpeed = 200;
        this.lerpFactor = 0.10; // Controls how smoothly the player follows the cursor (0-1)

        // danger zone (2x the radius of the player)
        this.dangerZone = scene.add.circle(x, y, radius * 2, 0xff0000, 0.2);
        scene.physics.add.existing(this.dangerZone, false); // false = non-static body
        
        // Make danger zone not collide with anything physically
        this.dangerZone.body.setCollideWorldBounds(false);
        
        // Player's inventory
        this.inventory = [];

        // Player's powerups
        this.powerUps = [];
        this.activePowerUp = this.powerUps[0]?.name || null;
        
        // Store a reference to the input manager
        this.input = scene.input;
        this.name = 'Player';
        this.isPlaying = true;
        this.duration = 0;

        // Other properties
        this.isDashing = false;
        this.dashSpeed = 1200;
        this.dashDuration = 800;
        this.lastDashTime = 0;
        this.isStunned = false;
        this.stunDuration = 1700;
        // this.setFrame(0); // Set a valid initial frame
        // this.play('idle'); // Start with idle animation
        this.setupAnimationsAi(scene);

    }

    setupAnimationsAi(scene) {
        // Create running animation (assuming each frame is 64x64)
        scene.anims.create({
            key: 'run',
            frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 7 }), // Adjust frame range
            frameRate: 10,
            repeat: -1
        });

        scene.anims.create({
            key: 'idle',
            frames: [{ key: 'player', frame: 0 }],
            frameRate: 1
        });
    }
    setupAnimations() {
        const frameRate = 5;
        const repeat = -1; // Loop infinitely
        
        // Looking at your spritesheet, it appears to have 8 rows of character frames
        // Each row seems to represent a different direction
        const directions = 8;
        
        // For each direction, create an idle and move animation
        for (let i = 0; i < directions; i++) {
            // Assuming your spritesheet has 8 frames per row
            // and the first 4 are for idle, last 4 are for movement
            
            // Create idle animation for this direction
            this.scene.anims.create({
                key: `idle_${i}`,
                frames: this.scene.anims.generateFrameNumbers(this.texture.key, { 
                    start: i * 8, 
                    end: i * 8 + 2 
                }),
                frameRate: frameRate,
                repeat: repeat
            });
            
            // Create movement animation for this direction
            this.scene.anims.create({
                key: `move_${i}`,
                frames: this.scene.anims.generateFrameNumbers(this.texture.key, { 
                    start: i * 8 + 3, 
                    end: i * 8 + 7 
                }),
                frameRate: frameRate,
                repeat: repeat
            });
        }
    }
    setName(name) {
        this.name = this.scene.add.text(this.x, this.y, name, { fontSize: '12px', fill: '#000' });
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
            this.activePowerUp = powerUp.name;
        }
    }

    enablePowerUp() {
        console.log(`Power-up activated: ${this.activePowerUp}`);
        switch (this.activePowerUp) {
            case 'speedBoost':
                this.moveSpeed *= 1.5; // Increase speed by 50%
                break;
            case 'dash':
                this.performDash(); // Enable dash ability
                break;
            default:
                break;
        }
    }
    performDash() {
        // Check if player can dash and cooldown is ready
        if (this.isDashing) return false;
        
        // Set dashing state
        this.isDashing = true;
        this.moveSpeed = this.dashSpeed;
        
        // Create dash effect
        this.createDashEffect();
        
        // End dash after duration
        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
            this.moveSpeed = 200;
        });
        
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
        if (this.isStunned) return false;
        if (this.isDashing && !this.isStunned) {
            this.isStunned = true;
            this.moveSpeed = 0;
        }
        // End dash after duration
        this.scene.time.delayedCall(this.stunDuration, () => {
            this.moveSpeed = 200;
            this.isStunned = false;
        });
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
        // Follow cursor with smooth lerping
        const pointer = this.input.activePointer;
        
        const dx = pointer.worldX - this.x;
        const dy = pointer.worldY - this.y;

        const angle = Math.atan2(dx, dy);
        this.setRotation((Math.PI / 2) - angle);
        
         // Move only if left mouse button is pressed
        if (pointer.isDown || this.isDashing) {
            // Store the clicked position as the target
            this.targetX = pointer.worldX;
            this.targetY = pointer.worldY;
        }

        if (this.targetX !== undefined && this.targetY !== undefined) {
            // Calculate direction vector to the target
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;

            // Calculate distance to the target
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 5) { // Small threshold to stop completely
                // Decelerate speed as the player nears the target
                const decelerationFactor = Phaser.Math.Clamp(distance / 100, 0.1, 1); // Scales speed based on distance
                
                // Normalize direction and apply movement speed with deceleration
                const speedX = (dx / distance) * this.moveSpeed * decelerationFactor;
                const speedY = (dy / distance) * this.moveSpeed * decelerationFactor;
                
                // Smooth movement using linear interpolation (lerp)
                this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, speedX, this.lerpFactor);
                this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, speedY, this.lerpFactor);
                console.log('Current Animation:', this.anims.currentAnim ? this.anims.currentAnim.key : 'None');
                console.log('Run Animation Exists:', this.scene.anims.exists('run'));
                console.log('Animation Keys:', this.anims.animationManager.anims.keys());
                // if (this.anims.currentAnim?.key !== 'run') {
                //     this.anims.stop(); // Stop any existing animation
                //     this.anims.play('run', true);
                // }
            } else {
                // Stop the player when close enough
                this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, 0, this.lerpFactor * 2);
                this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, 0, this.lerpFactor * 2);
                this.play('idle', true);
            }
        }
        this.updateDangerZone();
        this.updateText();
        // update playing duration
        if (this.isPlaying) {
            this.duration = this.scene.time.now - this.scene.startTime;
        }
    }
}
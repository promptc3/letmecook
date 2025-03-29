export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, width = null, height = null) {
        super(scene, x, y, texture);
        
        // Add this sprite to the scene
        scene.add.existing(this);

        // Set custom dimensions if provided
        if (width !== null && height !== null) {
            this.setDisplaySize(width, height);
        }
        this.setScale(0.5);

        const spriteHeight = this.height * this.scaleY;

        // Enable physics on this sprite
        scene.physics.add.existing(this);
        
        // Set up physics body properties
        const radius = spriteHeight/2;
        
        this.body.setCircle(radius, 0, 0);
        this.body.setGravity(false);
        this.body.setCollideWorldBounds(false); 
        
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

        // Dash properties
        this.isDashing = false;
        this.dashSpeed = 600;
        this.dashDuration = 300;
        this.lastDashTime = 0;

         // Visual indicator for dash ability
        this.dashIndicator = scene.add.sprite(0, -50, 'dash-indicator')
        .setScale(0.5)
        .setAlpha(0);
        this.add(this.dashIndicator);
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
        switch (this.activePowerUp) {
            case 'speedBoost':
                this.moveSpeed *= 1.5; // Increase speed by 50%
                break;
            case 'dash':
                this.enableDash(); // Enable dash ability
                break;
            default:
                break;
        }
    }
     // Call this when player picks up a dash item
    enableDash() {
        this.canDash = true;
        
        // Show dash indicator
        this.scene.tweens.add({
        targets: this.dashIndicator,
        alpha: 1,
        y: -40,
        duration: 300
        });
        
    }
  
    disableDash() {
        this.canDash = false;
        
        // Hide dash indicator
        this.scene.tweens.add({
        targets: this.dashIndicator,
        alpha: 0,
        y: -50,
        duration: 300
        });
        
        // Clear timer if it exists
        if (this.dashTimer) this.dashTimer.remove();
    }
    performDash(direction) {
        // Check if player can dash and cooldown is ready
        if (!this.canDash || this.isDashing || 
            (this.scene.time.now - this.lastDashTime < this.dashCooldown)) {
            return false;
        }
        
        // Set dashing state
        this.isDashing = true;
        this.lastDashTime = this.scene.time.now;
        
        // Apply dash velocity based on direction
        const dashVelocity = new Phaser.Math.Vector2(direction).normalize().scale(this.dashSpeed);
        this.setVelocity(dashVelocity.x, dashVelocity.y);
        
        // Create dash effect
        this.createDashEffect();
        
        // End dash after duration
        this.scene.time.delayedCall(this.dashDuration, () => {
        this.isDashing = false;
            // Send dash event to server
            this.scene.room.send("playerDashed", {
                x: this.x,
                y: this.y,
                vx: this.body.velocity.x,
                vy: this.body.velocity.y
            });
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
        
         // Move only if left mouse button is pressed
        if (pointer.isDown) {
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
            const angle = Math.atan2(dx, dy);
            this.setRotation((Math.PI / 2) - angle);

            if (distance > 5) { // Small threshold to stop completely
                // Decelerate speed as the player nears the target
                const decelerationFactor = Phaser.Math.Clamp(distance / 100, 0.1, 1); // Scales speed based on distance
                
                // Normalize direction and apply movement speed with deceleration
                const speedX = (dx / distance) * this.moveSpeed * decelerationFactor;
                const speedY = (dy / distance) * this.moveSpeed * decelerationFactor;
                
                // Smooth movement using linear interpolation (lerp)
                this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, speedX, this.lerpFactor);
                this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, speedY, this.lerpFactor);
            } else {
                // Stop the player when close enough
                this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, 0, this.lerpFactor * 2);
                this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, 0, this.lerpFactor * 2);
            }
        }
        if (this.canDash) {
            const cooldownProgress = Math.min(
                (this.scene.time.now - this.lastDashTime) / this.dashCooldown, 
                1
            );
            
            // Update dash indicator to show cooldown
            if (cooldownProgress < 1) {
                this.dashIndicator.setAlpha(0.5);
                this.dashIndicator.setTint(0xff0000);
                this.disableDash();
            } else {
                this.dashIndicator.setAlpha(1);
                this.dashIndicator.setTint(0xffffff);
            }
        }
        this.updateDangerZone();
        this.updateText();
    }
}
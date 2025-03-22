export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, width = null, height = null) {
        super(scene, x, y, texture);
        
        // Add this sprite to the scene
        scene.add.existing(this);

        // Set custom dimensions if provided
        if (width !== null && height !== null) {
            this.setDisplaySize(width, height);
        }

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
        
        // Store a reference to the input manager
        this.input = scene.input;
    }

    update() {
        // Follow cursor with smooth lerping
        const pointer = this.input.activePointer;
        
        // Calculate direction vector to cursor
        const dx = pointer.worldX - this.x;
        const dy = pointer.worldY - this.y;
        
        // Calculate distance to cursor
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dx, dy);
        this.setRotation((Math.PI/2) - angle);
        
        // Move only if the cursor is far enough away
        if (distance > 40) {
            // Normalize direction vector and apply movement speed
            const speedX = (dx / distance) * this.moveSpeed;
            const speedY = (dy / distance) * this.moveSpeed;
            
            // Apply smooth movement using linear interpolation (lerp)
            this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, speedX, this.lerpFactor);
            this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, speedY, this.lerpFactor);
        } else {
            // If we're close enough to the cursor, slow down
            this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, 0, this.lerpFactor * 2);
            this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, 0, this.lerpFactor * 2);
        }
        this.updateDangerZone();
    }

    updateDangerZone() {
        this.dangerZone.x = this.x;
        this.dangerZone.y = this.y;
    }

    setupDangerZoneOverlap(foodItems) {
        this.scene.physics.add.overlap(
            this.dangerZone, 
            foodItems, 
            this.collectFoodItem, 
            null, 
            this
        );
    }

    collectFoodItem(dangerZone, foodItem) {
        // Add obstacle to inventory if not already collected
        if (!this.inventory.includes(foodItem)) {
            this.inventory.push(foodItem);
            console.log(`Collected obstacle: ${foodItem.name || 'unnamed foodItem'}`);
            console.log(foodItem)
            console.log(`Inventory now contains ${this.inventory.length} items`);
            
            // Emit an event that can be listened to elsewhere
            this.scene.events.emit('foodCollected', foodItem, this.inventory);
        }
    }
}
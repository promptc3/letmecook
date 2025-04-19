export default class FoodItem extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, name = "food", type = "static") {
        super(scene, x, y, texture);
        // Add the sprite to the scene
        scene.add.existing(this);
        this.name = name;
        this.type = type;
        // Flag to track if this item has been picked up
        this.isPickedUp = false;
        
        // Store reference to the scene
        this.scene = scene;
        
        // Generate a unique ID for this food item
        this._id = 'food_' + Math.random().toString(36);
        if (type === "static") {
            scene.physics.add.existing(this, true); // true = static body
            this.scene.tweens.add({
                targets: this,
                y: this.y - 5,
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
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
            this.body.enable = false;
            console.log(`${this.name} has been picked up by player`);
            // this.particles.setActive(true);
            const particleZone = new Phaser.Geom.Rectangle(0, 0, 16, 40); 
            this.particles = this.scene.add.particles(this.x - 8, this.y - 20, 'starParticle',
                {
                    lifespan: 600,
                    scale: { start: 0.5, end: 0 },
                    alpha: { start: 1, end: 0 },
                    speed: {min: 20, max: 50},
                    quantity: 10,
                    frequency: 50,
                    emitZone: {
                        type: "random",
                        source: particleZone
                    },
                    blendMode: 'ADD'
                }
            );
             this.scene.tweens.add({
                targets: this,
                scale: { from: 1, to: 1.3 },
                alpha: 0,
                duration: 250,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.setVisible(false)
                    this.particles.stop();
                }
            });
            return true;
        }
        return false;
    }
    
    // Method to drop the item at specified coordinates
    drop(x, y) {
        if (this.isPickedUp) {
            this.isPickedUp = false;
            // Set new position
            
            
            this.body.enable = true;
            this.body.position.x = x - this.width/2;
            this.body.position.y = y - this.height/2;
            this.setPosition(x, y);
            // Make visible if it was hidden
            this.setVisible(true);

            if (this.type === "dynamic") {
                this.setRandomMovement();
            } 
            
            console.log(`${this.name} has been dropped`, this.body);
            return true;
        }
        return false;
    }
    
}
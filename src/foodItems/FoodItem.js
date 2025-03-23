export default class FoodItem extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, name = "food", type = "static") {
        super(scene, x, y, texture);
        this.setDisplaySize(16, 16);
        this.setScale(2);
        // Add the sprite to the scene
        scene.add.existing(this);
        scene.physics.add.existing(this, type === "static"); // true = static body
        
        this.name = name;
        this.type = type;
        if (type === "dynamic") {
            this.body.setBounce(0.5);
            this.body.setDrag(50);
            this.setRandomMovement();
        }
        
        // Food item states
        this.states = {
            RAW: 'raw',
            PREP: 'prep',
            COOKING: 'cooking',
            READY: 'ready'
        };
        
        // Initial state
        this.state = this.states.RAW;
        
        // Flag to track if this item has been picked up
        this.isPickedUp = false;
        
        // Store reference to the scene
        this.scene = scene;
        
        // Enable input for interaction when clicked directly
        this.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                // Only allow direct interaction if not picked up
                if (!this.isPickedUp) {
                    this.handleInteraction();
                }
        });

        // Generate a unique ID for this food item
        this._id = 'food_' + Math.random().toString(36);

    }

    getId() {
        return this._id;
    }

    setRandomMovement() {
        this.scene.time.addEvent({
            delay: Phaser.Math.Between(1000, 3000), // Change direction at random intervals
            callback: this.changeDirection,
            callbackScope: this,
            loop: true
        });
    }

    changeDirection() {
        if (!this.isPickedUp) {
            let speed = Phaser.Math.Between(50, 150); // Random speed
            let angle = Phaser.Math.FloatBetween(0, 2 * Math.PI); // Random direction
            if (this.body) {
                this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            }
        }
    }
    // Method to handle being picked up by the player
    pickup(player) {
        if (!this.isPickedUp) {
            this.isPickedUp = true;
            this.body.enable = false;
            this.setVisible(false);   
            console.log(`${this.name} has been picked up by player`);
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
    
    // Check for overlap with another game object
    checkOverlap(target) {
        return Phaser.Geom.Intersects.RectangleToRectangle(
            this.getBounds(),
            target.getBounds()
        );
    }
}
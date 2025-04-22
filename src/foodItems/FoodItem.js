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
        this.setInteractive();
        this.isDropping = false;
        
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
        this.setupPointerEvents(scene);
    }

    setupPointerEvents(scene) {
        this.on('pointerover', function (pointer) {
           scene.input.setDefaultCursor('url(./../assets/UI/spriteSheets/mouseSprites/Catpaw-Mouse-icon.cur), pointer');
           console.info("Pointer over sprite")
        });

        this.on('pointerout', function (pointer) {
           scene.input.setDefaultCursor('url(./../assets/UI/spriteSheets/mouseSprites/Catpaw-pointing-Mouse-icon.cur), pointer');
        });

        this.on('pointerdown', function (pointer) {
           scene.input.setDefaultCursor('url(./../assets/UI/spriteSheets/mouseSprites/Catpaw-holding-Mouse-icon.cur), pointer');
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
                    blendMode: 'SCREEN'
                }
            );
             this.scene.tweens.add({
                targets: this,
                scale: { from: 1, to: 0.3 },
                alpha: 0,
                duration: 1100,
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
    drop(player, dropX, dropY) {
        const playerX = player.x;
        const playerY = player.y;
        if (this.isPickedUp) {
            this.isPickedUp = false;
            this.isDropping = true;
            this.setPosition(playerX, playerY);
            this.setVisible(true);
            this.setAlpha(1);
            this.scene.tweens.add({
                targets: this,
                x: {
                    getStart: () => playerX,
                    getEnd: () => dropX,
                },
                y: {
                    getStart: () => playerY,
                    getEnd: () => dropY,
                },
                duration: 300,
                ease: 'Quad.easeOut',
                scale: 1,
                onComplete: () => {
                    this.scene.sound.play("drop");
                    this.scene.tweens.add({
                        targets: this,
                        angle: {from: -30, to: 30},
                        yoyo: true,
                        duration: 200,
                        repeat: 2,
                        onComplete: () => {
                            // Final snap to scale
                            this.isDropping = false;
                            this.setScale(1);
                            // Set new position
                            this.setPosition(dropX, dropY);
                            this.body.enable = true;
                            this.body.position.x = dropX;
                            this.body.position.y = dropY;
                            player.toggleReadyToDrop();
                        }
                    })}
            });

            return true;
        }
        return false;
    }
    
}
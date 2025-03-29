import {Client, getStateCallbacks} from 'colyseus.js';
import Player from '../player/Player.js';
import FoodItem from '../foodItems/FoodItem.js';
import DashPickup from '../pickups/DashPickup.js';

export class Game extends Phaser.Scene
{
    constructor()
    {
        super({key: 'Game'});
        this.map = null;
        this.recipe = {
            name: "Veg Curry",
            ingredients: [
                {name: "Carrot", quantity: "2", texture: "vegetable_carrot"},
                {name: "Corn", quantity: "1", texture: "vegetable_corn"},
                {name: "Potato", quantity: "2", texture: "vegetable_potato"},
                {name: "Garlic", quantity: "1", texture: "vegetable_garlic"},
                {name: "Ginger", quantity: "2", texture: "vegetable_ginger"},
                {name: "Onion", quantity: "1", texture: "vegetable_onion"}
	    ]}
        this.invHash = new Map();
        this.recipe.ingredients.forEach(i => this.invHash.set(i.name, 0));
        // new Client
         this.client = null;
        this.room = null;
        this.remotePlayers = new Map();
        this.scoreBoard = [];
    }

    async create()
    {
        try {
            this.map = this.make.tilemap({ key: 'map'});
            console.log("Map loaded.", this.map);
        } catch(error) {
            console.error("Failed to load map", error);
        }
        const tileset = this.map.addTilesetImage('Grass', 'tiles');
        const biomTileset = this.map.addTilesetImage('Biom', 'biomTiles');
        this.groundLayer = this.map.createLayer('Background', tileset);
        this.treeLayer = this.map.createLayer('Trees', biomTileset);
        this.treeLayer.setCollisionByProperty({collides: true});
        
        // Create player
        this.player = new Player(this, 400, 300, 'player', 16, 16);
        
        this.physics.add.collider(this.player, this.treeLayer, this.handleCollision());
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        // camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.8);
        this.deceleration = 0.5;
      
        this.physics.world.createDebugGraphic();
        // Add key to drop items
        this.dropKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.powerupKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        
        this.foodItems = this.add.group();
        this.powerUps = this.add.group();
        // Set up player's danger zone to detect food items
        this.player.setupDangerZoneOverlap(this.foodItems, this.powerUps);
        this.setupEventListeners();
        // Create UI text for inventory display
        this.inventoryText = this.add.text(530, 500, 'Inventory Empty', {
            fontSize: '12px',
            fill: '#ff0000',
            align: 'left'
        });
        this.inventoryText.setOrigin(0.5);
        this.inventoryText.setScrollFactor(0); // Fix to camera
        
        // Create UI text for recipe display
        let itemNames = "";
        this.recipe.ingredients.forEach(ing => {
            itemNames += `${ing.name}-${ing.quantity} `;
        })
        this.goalText = this.add.text(530, 520, `Goal: ${itemNames}`, {
            fontSize: '12px',
            fill: '#ff0000',
            align: 'left'
        });
        this.goalText.setOrigin(0.5);
        this.goalText.setScrollFactor(0); // Fix to camera
        // Create interaction message
        this.messageText = this.add.text(400, 550, '', {
            fontSize: '18px',
            fill: '#ffffff'
        });
        this.messageText.setOrigin(0.5);
        this.messageText.setScrollFactor(0);
        // Create the circular drop zone
        this.createDropZone(1200, 700, 100); // x, y, radius
        
        // Connection status text
        this.connectionText = this.add.text(400, 20, 'Connecting...', {
            fontSize: '18px',
            fill: '#ffffff'
        });
        this.connectionText.setOrigin(0.5);
        this.connectionText.setScrollFactor(0);
        this.scoreBoardText = this.add.text(100, 20, '', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#000000'
        });
        this.scoreBoardText.setOrigin(0.5);
        this.scoreBoardText.setScrollFactor(0);
        const playerName = "Player " + Math.floor(Math.random() * 100);
        this.playerName = this.add.text(400, 200, `${playerName}`, {
            fontSize: '18px',
            fill: '#000fff'
        });
        this.player.setName(playerName);
        this.playerName.setOrigin(0.5);
        this.playerName.setScrollFactor(0);
        await this.connectToServer(playerName);
        this.setupRoomListeners();
    }

    handleCollision() {
        this.player.handleCollision();
        this.dropItem((Math.random()*4) - 1);
    }
    setupEventListeners() {
        // Listen for the obstacleCollected event from the player
        this.events.on('foodCollected', (pickedItem) => {
            console.log(`Picked ${pickedItem.name}`);
            this.sound.play('pick');
            if (pickedItem instanceof FoodItem) {
                // Handle food item pickup
                pickedItem.pickup()
                let prevQty = this.invHash.get(pickedItem.name);
                if (prevQty !== undefined || prevQty !== null) {
                    this.invHash.set(pickedItem.name, prevQty+1);
                } else {
                    this.invHash.set(pickedItem.name, 1);
                }
                this.displayPickupMessage(pickedItem.name);
            }
            if (this.room) {
                this.room.send("itemPickup", {
                    playerId: this.room.sessionId,
                    itemId: pickedItem.getId(),
                });
            }
        });
        this.events.on('powerUpCollected', (pickedItem) => {
            console.log(`Picked ${pickedItem.name}`);
            this.sound.play('pick');
            if (pickedItem) {
                // Handle food item pickup
                pickedItem.pickup()
                this.powerUps.remove(pickedItem, true, true);
            }
            if (this.room) {
                this.room.send("powerUpPicked", {
                    playerId: this.room.sessionId,
                    powerUpId: pickedItem.getId(),
                });
            }
        });
    }

    async connectToServer(name) {
        try {
            this.client = new Client('http://localhost:2567');
            console.log("Client created", this.client, " playerName: ", name);
            this.room = await this.client.joinOrCreate('my_room', {
                name: this.playerName.text,
                x: this.player.x,
                y: this.player.y,
                rotation: this.player.rotation,
            });
            this.connectionText.setText('Connected');
            this.connectionText.setFill('#00ff00');
        } catch(error) {
            console.error("Failed to connect to server", error);
            this.connectionText.setText('Connection failed');
            this.connectionText.setFill('#ff0000');
        }
    }

    setupRoomListeners() {
        const $ = getStateCallbacks(this.room);
        $(this.room.state).players.onAdd((player, sessionId) => {
            if (sessionId === this.room.sessionId) return;

            const remotePlayer = new Player(this, player.x, player.y, 'player', 16, 16);
            this.physics.add.collider(remotePlayer, this.player, this.handleCollision());
            console.log(`Remote player ${player.name} joined`, player);
            remotePlayer.setName(player.name);
            remotePlayer.sessionId = sessionId;
            remotePlayer.rotation = player.rotation;
            this.remotePlayers.set(sessionId, remotePlayer);
            $(player).onChange(() => {
                if (remotePlayer) {
                    remotePlayer.setPosition(player.x, player.y);
                    remotePlayer.setRotation(player.rotation);
                    remotePlayer.updateDangerZone();
                    remotePlayer.updateText();
                }
            })
        })

        $(this.room.state).players.onRemove((player, sessionId) => {
            const remotePlayer = this.remotePlayers.get(sessionId);
            if (remotePlayer) {
                remotePlayer.destroy();
                this.remotePlayers.delete(sessionId);
            }
        });

        $(this.room.state).foodItems.onAdd((foodItem, sessionId) => {
            const item = new FoodItem(this, foodItem.x, foodItem.y, foodItem.texture, foodItem.name, foodItem.static ? "static" : "dynamic");
            item.setId(foodItem.id);
            this.foodItems.add(item);
        });

        $(this.room.state).powerUps.onAdd((powerUp, sessionId) => {
            const newPowerup = new DashPickup(this, powerUp.x, powerUp.y);
            newPowerup.setId(powerUp.id);
            this.powerUps.add(newPowerup);
        });

        $(this.room.state).scoreBoard.onAdd((score, sessionId) => {
            console.log("Scoreboard: ", score);
            this.scoreBoard.push(score);
        });

        this.room.onMessage("itemPickedUp", (data) => {
            const { playerId, itemId } = data;

            console.log(`Item picked up by player ${playerId}: ${itemId}`);
            // Find the item in the foodItems group
            const pickedItem = this.foodItems.getChildren().find(
                (item) => item.getId() === itemId
            );
            console.log("Picked item: ", pickedItem);

            if (pickedItem) {
                pickedItem.pickup();
            }
        });

        this.room.onMessage("powerUpPickedUp", (data) => {
            const { playerId, itemId } = data;

            console.log(`Power-up picked by player ${playerId}: ${itemId}`);
            // Find the item in the foodItems group
            const pickedItem = this.powerUps.getChildren().find(
                (item) => item.getId() === itemId
            );
            console.log("Picked item: ", pickedItem);

            if (pickedItem) {
                pickedItem.pickup();
                this.powerUps.remove(pickedItem, true, true);
            }
        });
        // Listen for player joined message
        this.room.onMessage("playerJoined", (data) => {
            this.displayMessage(`${data.playerName} joined the game!`);
        });
        
        // Listen for player left message
        this.room.onMessage("playerLeft", (data) => {
            this.displayMessage(`${data.playerName} left the game!`);
        });
    }

    createDropZone(x, y, radius) {
        // Create a zone game object
        this.dropZone = this.add.zone(x, y, radius * 2, radius * 2);
        
        // Set up the physics body for the zone
        this.physics.world.enable(this.dropZone, Phaser.Physics.Arcade.STATIC_BODY);
        
        // Make the zone's physics body circular
        this.dropZone.body.setCircle(radius);
        
        // Add overlap detection with the player
        this.physics.add.overlap(
            this.player, 
            this.dropZone, 
            this.handleDropZoneEnter, 
            null, 
            this
        );
        
        return this.dropZone;
    }
    checkIngredients() {
        let flag = true;
        this.recipe.ingredients.every(i => {
            const crntQty = this.invHash.get(i.name);
            if (crntQty !== i.quantity) {
                flag = false;
                return false;
            } else {
                return true;
            }
        })
        return flag;
    }

    handleDropZoneEnter(player, zone) {
        const inventorySize = player.inventory.length;
        if (this.checkIngredients()) {
            this.dropItem(inventorySize);
            this.player.isPlaying = false;
            this.room.send("playerFinished", {
                playerId: this.room.sessionId,
                playerName: this.player.name,
                playDuration: Math.round(this.player.duration/1000),
            });
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('GameOver', {score: Math.round(this.player.duration/1000)});
            });
        }
    }

    // Handle dropping the last picked up item
    dropItem(count) {
        for (let i = 0; i < count; i++) {
            if (this.player.inventory.length > 0) {
                const lastItem = this.player.inventory.pop();
                console.info(`Dropping ${lastItem.name}`);
                this.sound.play('drop');
                
                if (lastItem instanceof FoodItem) {
                    // Drop the item slightly in front of the player based on rotation
                    const angle = this.player.rotation + Phaser.Math.Angle.Between(0, 0, 500, 500);
                    const distance = this.player.width + 50;
                    
                    const dropX = this.player.x + Math.cos(angle) * distance;
                    const dropY = this.player.y + Math.sin(angle) * distance;
                    
                    lastItem.drop(dropX, dropY);
                    this.displayMessage(`Dropped: ${lastItem.name}`);
                    // Send item drop to server
                    if (this.room) {
                        this.room.send("itemDrop", {
                            itemId: lastItem.getId(),
                            itemName: lastItem.name,
                            x: dropX,
                            y: dropY
                        });
                    }
                }
            }
        }
    }

    // Update the inventory display text
    updateInventoryText() {
        if (this.player.inventory.length === 0) {
            this.inventoryText.setText('Inventory Empty');
        } else {
            let itemNames = "";
            this.recipe.ingredients.forEach(ing => {
                itemNames += `${ing.name}-${this.invHash.get(ing.name)} `;
            })
            this.inventoryText.setText(`Current: ${itemNames}`);
        }
    }

    updateScoreBoard() {
        let scoreText = "Scoreboard:\n";
        this.scoreBoard.forEach((player) => {
            scoreText += `${player.name}: ${player.playDuration} seconds\n`;
        });
        this.scoreBoardText.setText(scoreText);
    }
    update(time, delta) {
        this.player.update();
        // Update inventory display
        this.updateInventoryText();

        // Check for drop key press
        if (Phaser.Input.Keyboard.JustDown(this.dropKey) && this.player.inventory.length > 0) {
            this.dropItem(1);
        }
        if (Phaser.Input.Keyboard.JustDown(this.powerupKey)) {
            this.player.enablePowerUp();
        }
        if (this.room && (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0)) {
            this.room.send("playerMovement", {
                x: this.player.x,
                y: this.player.y,
                rotation: this.player.rotation,
            });
        }
    }

    // Display pickup message
    displayPickupMessage(itemName) {
        this.displayMessage(`Picked up: ${itemName}`);
    }

    // Generic message display
    displayMessage(text) {
        this.messageText.setText(text);
        this.messageText.setAlpha(1);
        
        // Clear the message after 2 seconds
        this.tweens.add({
            targets: this.messageText,
            alpha: 0,
            duration: 4000,
            ease: 'Power2'
        });
    }

        // Clean up when scene is shut down
    shutdown() {
        if (this.room) {
            this.room.leave();
        }
        
        // Clean up any event listeners here
        super.shutdown();
    }
}
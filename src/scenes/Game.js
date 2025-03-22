import {Client, getStateCallbacks} from 'colyseus.js';
import Player from '../player/Player.js';
import FoodItem from '../foodItems/FoodItem.js';
import FoodItemGenerator from '../foodItems/FoodItemGenerator.js';

export class Game extends Phaser.Scene
{
    constructor()
    {
        super({key: 'Game'});
        this.map = null;
        this.score = 0;
        this.recipe = {
		name: "Spicy Chicken",
		ingredients: [
			{name: "Tomato", quantity: "8"},
			{name: "Garlic", quantity: "1"},
			{name: "Chicken", quantity: "1"},
			{name: "Ginger", quantity: "3"},
			{name: "Green Chilli", quantity: "4"}
	    ]}
        this.invHash = new Map();
        this.recipe.ingredients.forEach(i => this.invHash.set(i.name, 0));
        // new Client
         this.client = null;
        this.room = null;
        this.remotePlayers = new Map();
    }


    preload()
    { 
        this.load.image('player', './../assets/circle-orange.png');
        this.load.image('food', './../assets/hexagon-blue.png');
        this.load.image('rabbit', './../assets/hexagon-gray.png');
        this.load.tilemapTiledJSON('map', './../assets/sproutMap.tmj');
        this.load.image('tiles', './../assets/Tilesets/Grass.png');
        this.load.image('biomTiles', './../assets/Objects/Basic_Grass_Biom_things.png');
        this.load.audio('pick', './../assets/sounds/pick.ogg');
        this.load.audio('drop', './../assets/sounds/drop.ogg');
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
        
        this.physics.add.collider(this.player, this.treeLayer);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        // camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.8);
        this.deceleration = 0.5;
      
        this.physics.world.createDebugGraphic();
        // Add key to drop items
        this.dropKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        this.foodItems = this.add.group();
        const foodItemGen = new FoodItemGenerator(this, 'food', this.map.widthInPixels, this.map.heightInPixels);
        const staticFoodItems = foodItemGen.generateStaticFood(30, this.recipe);
        staticFoodItems.forEach(f => this.foodItems.add(f));
        // Set up player's danger zone to detect food items
        this.player.setupDangerZoneOverlap(this.foodItems);

        // Listen for the obstacleCollected event from the player
        this.events.on('foodCollected', (pickedItem, inventory) => {
            console.log(`Picked ${pickedItem.name}`);
            this.sound.play('pick');
            if (pickedItem instanceof FoodItem) {
                // Handle food item pickup
                pickedItem.pickup(this.player);
                let prevQty = this.invHash.get(pickedItem.name);
                if (prevQty !== undefined || prevQty !== null) {
                    this.invHash.set(pickedItem.name, prevQty+1);
                } else {
                    this.invHash.set(pickedItem.name, 1);
                }
                this.displayPickupMessage(pickedItem.name);
            }
        });

        // Create UI text for inventory display
        this.inventoryText = this.add.text(510, 500, 'Inventory Empty', {
            fontSize: '12px',
            fill: '#ff0000'
        });
        this.inventoryText.setOrigin(0.5);
        this.inventoryText.setScrollFactor(0); // Fix to camera
        
        // Create UI text for recipe display
        let itemNames = "";
        this.recipe.ingredients.forEach(ing => {
            itemNames += `${ing.name}-${ing.quantity} `;
        })
        this.goalText = this.add.text(500, 520, `Goal: ${itemNames}`, {
            fontSize: '12px',
            fill: '#ff0000'
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
        const playerName = "Player" + Math.floor(Math.random() * 100);
        this.playerName = this.add.text(400, 200, `${playerName}`, {
            fontSize: '18px',
            fill: '#000fff'
        });
        this.playerName.setOrigin(0.5);
        this.playerName.setScrollFactor(0);
        await this.connectToServer(playerName);
        this.setupRoomListeners();
    }

    async connectToServer(playerName) {
        try {
            this.client = new Client('http://localhost:2567');
            this.room = await this.client.joinOrCreate('my_room', {
                name: playerName,
                x: this.player.x,
                y: this.player.y,
                rotation: this.player.rotation
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

            const remotePlayer = this.physics.add.sprite(player.x, player.y, 'player'); 
            remotePlayer.sessionId = sessionId;
            remotePlayer.rotation = player.rotation;
            this.remotePlayers.set(sessionId, remotePlayer);
            $(player).onChange(() => {
                if (remotePlayer) {
                    this.tweens.add({
                        targets: remotePlayer,
                        x: player.x,
                        y: player.y,
                        rotate: player.rotation,
                        duration: 100,
                        ease: 'Linear',
                        repeat: 0
                    })
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

        // Listen for food pickup broadcasts from server
        this.room.onMessage("itemPickedUp", (data) => {
            // Handle remote player picking up an item
            // Find the food item by ID and remove it from the scene
            const { itemId, playerId } = data;
            
            // Only process if it's not our own pickup
            if (playerId !== this.room.sessionId) {
                this.foodItems.getChildren().forEach(item => {
                    if (item.getId && item.getId() === itemId) {
                        item.destroy();
                    }
                });
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
            for (let i=0; i<inventorySize; i++) {
                this.dropItem();
            }
                this.cameras.main.fadeOut(200, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('GameOver', {score: Math.round(this.score)});
            });
        }
        

    }

    update(time, delta) {
        this.player.update();
        // Update inventory display
        this.updateInventoryText();

        // Check for drop key press
        if (Phaser.Input.Keyboard.JustDown(this.dropKey) && this.player.inventory.length > 0) {
            this.dropItem();
        }
        if (this.room && (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0)) {
            this.room.send("playerMovement", {
                x: this.player.x,
                y: this.player.y,
                rotation: this.player.rotation,
                velocityX: this.player.body.velocity.x,
                velocityY: this.player.body.velocity.y
            });
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
    // Display pickup message
    displayPickupMessage(itemName) {
        this.displayMessage(`Picked up: ${itemName}`);
    }

    // Handle dropping the last picked up item
    dropItem() {
        if (this.player.inventory.length > 0) {
            const lastItem = this.player.inventory.pop();
            console.info(`Dropping ${lastItem.name}`);
            this.sound.play('drop');
            
            if (lastItem instanceof FoodItem) {
                // Drop the item slightly in front of the player based on rotation
                const angle = this.player.rotation + Phaser.Math.Angle.Between(0, 0, 500, 500);
                const distance = this.player.width + 100;
                
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

    // Generic message display
    displayMessage(text) {
        this.messageText.setText(text);
        this.messageText.setAlpha(1);
        
        // Clear the message after 2 seconds
        this.tweens.add({
            targets: this.messageText,
            alpha: 0,
            duration: 2000,
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
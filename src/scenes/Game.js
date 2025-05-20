import { Client, getStateCallbacks } from "colyseus.js";
import Player from "../characters/Player.js";
import FoodItem from "../foodItems/FoodItem.js";
import DashPickup from "../pickups/DashPickup.js";
import MovingItem from "../foodItems/MovingItem.js";
import BasicUtensil from "../kitchen/BasicUtensil.js";

export class Game extends Phaser.Scene {
  constructor() {
    super({ key: "Game" });
    this.map = null;
    this.recipe = {
      name: "Veg Curry",
      ingredients: [
        { name: "Carrot", quantity: "3", texture: "vegetable_carrot" },
        { name: "Corn", quantity: "1", texture: "vegetable_corn" },
        { name: "Potato", quantity: "2", texture: "vegetable_potato" },
        { name: "Garlic", quantity: "4", texture: "vegetable_garlic" },
        { name: "Ginger", quantity: "2", texture: "vegetable_ginger" },
        { name: "Onion", quantity: "1", texture: "vegetable_onion" },
      ],
    };
    this.invHash = new Map();
    // new Client
    this.client = null;
    this.room = null;
    this.remotePlayers = new Map();
    this.scoreBoard = [];
    this.margin = { x: 200, y: 100 };
    this.selectedItem = null;
  }

  async create() {
    try {
      this.map = this.make.tilemap({ key: "map" });
      console.log("Map loaded.", this.map);
    } catch (error) {
      console.error("Failed to load map", error);
    }
    this.input.setDefaultCursor('url(./../assets/UI/spriteSheets/mouseSprites/Catpaw-pointing-Mouse-icon.cur), pointer');
    this.registry.set('recipe', this.recipe);
    this.registry.set('inventory', new Map());
    const tileset = this.map.addTilesetImage("Grass", "tiles");
    const biomTileset = this.map.addTilesetImage("Biom", "biomTiles");
    this.groundLayer = this.map.createLayer("Background", tileset)
    .on('pointerdown', pointer => this.player.setTargetLocation(pointer.x, pointer.y));
    this.treeLayer = this.map.createLayer("Trees", biomTileset);
    this.treeLayer.setCollisionByProperty({ collides: true });

    // utensils
    this.pan = new BasicUtensil(this, 300, 350, 'pan', 'Pan')
    // Create player
    this.player = new Player(this, 100, 100);
    this.player.setSizeToFrame(this.textures.get("player").frames[0]);
    this.physics.add.collider(
      this.player,
      this.treeLayer,
      this.handleCollision,
      null,
      this
    );
    this.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
    
    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
    this.cameras.main.setZoom(3);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);


    // Add key to drop items
    this.dropKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.powerupKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.Q
    );

    this.foodItems = this.add.group(null, {runChildUpdate: true});
    this.movingItems = this.add.group(null, {runChildUpdate: true});

    this.pan.setupCollisions(this);
    this.physics.add.collider(this.player, this.pan.utensil);
    this.powerUps = this.add.group();
    this.registry.set('powerups', 0);
    // Set up player's danger zone to detect food items
    this.player.setupDangerZoneOverlap(this.foodItems, this.powerUps);
    this.setupEventListeners();


    // Create the circular drop zone
    this.createDropZone(500, 700, 50); // x, y, radius

    this.playerName = "Player " + Math.floor(Math.random() * 100);
    this.player.setName(this.playerName);
    await this.connectToServer(this.playerName);
    if (this.room) {
      this.setupRoomListeners();
    }
  }

  handleCollision() {
    this.player.handleCollision();
  }

  setupEventListeners() {
    // Listen for the obstacleCollected event from the player
    this.events.on("foodCollected", (pickedItem) => {
      console.log(`Picked ${pickedItem.name}`);
      this.sound.play("pick");
      if (pickedItem instanceof FoodItem) {
        // Handle food item pickup
        pickedItem.pickup();
        let prevQty = this.invHash.get(pickedItem.name);
        if (prevQty > 0) {
          this.invHash.set(pickedItem.name, prevQty + 1);
        } else {
          this.invHash.set(pickedItem.name, 1);
        }
        const newHash = this.invHash;
        this.registry.set("inventory", newHash);
        this.displayPickupMessage(pickedItem.name);
      }
      if (this.room) {
        this.room.send("itemPickup", {
          playerId: this.room.sessionId,
          itemId: pickedItem.getId(),
        });
      }
    });
    const uiScene = this.scene.get("UIScene");
    uiScene.events.on("itemSelected", (data) => {
      this.selectedItem = data.name
    }, this)
    this.events.on('cookRecipe', args => {
      // filter out usedItems from foodItems and delete
      if (!args.usedItems && args.usedItems.length <= 0) return;
      args.usedItems.forEach(item => {
        this.foodItems.remove(item);
      })
    }, this);
    this.events.on("powerUpCollected", (pickedItem) => {
      console.log(`Picked ${pickedItem.name}`);
      this.sound.play("pick");
      if (pickedItem) {
        // Handle food item pickup
        pickedItem.pickup();
        this.powerUps.remove(pickedItem, true, true);
        this.updateDashText();
      }
      if (this.room) {
        this.room.send("powerUpPicked", {
          playerId: this.room.sessionId,
          powerUpId: pickedItem.getId(),
        });
      }
    });
    this.events.on("playerStunned", (dropItemCount) => {
      this.dropItem(dropItemCount);
    });
  }

  async connectToServer(name) {
    try {
      this.client = new Client("http://localhost:2567");
      console.log("Client created", this.client, " playerName: ", name);
      this.room = await this.client.joinOrCreate("my_room", {
        name: this.playerName,
        x: this.player.x,
        y: this.player.y,
        rotation: this.player.rotation,
      });
      this.events.emit("connected");
    } catch (error) {
      this.events.emit("connectionFailed");
      console.error("Failed to connect to server", error);
    }
  }

  setupRoomListeners() {
    const $ = getStateCallbacks(this.room);
    $(this.room.state).players.onAdd((player, sessionId) => {
      if (sessionId === this.room.sessionId) return;

      const remotePlayer = new Player(
        this,
        player.x,
        player.y,
        "player",
        16,
        16
      );
      this.physics.add.collider(
        remotePlayer,
        this.player,
        this.handleCollision()
      );
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
      });
    });

    $(this.room.state).players.onRemove((player, sessionId) => {
      const remotePlayer = this.remotePlayers.get(sessionId);
      if (remotePlayer) {
        remotePlayer.destroy();
        this.remotePlayers.delete(sessionId);
      }
    });

    $(this.room.state).foodItems.onAdd((foodItem, sessionId) => {
      if (foodItem.static) {
        const item = new FoodItem(
          this,
          foodItem.x,
          foodItem.y,
          foodItem.texture,
          foodItem.name,
        );
        item.setId(foodItem.id);
        this.foodItems.add(item);
      } else {
        const item = new MovingItem(this, foodItem.x, foodItem.y, foodItem.texture, foodItem.name);
        item.setId(foodItem.id);
        item.setupDangerZoneOverlap(this.player);
        this.movingItems.add(item);
        this.foodItems.add(item);
      }
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
      const pickedItem = this.foodItems
        .getChildren()
        .find((item) => item.getId() === itemId);
      console.log("Picked", pickedItem);
      this.displayMessage(`Picked ${pickedItem.name}`)

      if (pickedItem) {
        pickedItem.pickup();
      }
    });

    this.room.onMessage("itemDropped", (data) => {
      const { itemId, playerId, x, y } = data;
      const dropppedItem = this.foodItems
        .getChildren()
        .find((item) => item.getId() === itemId);
      if (dropppedItem && playerId === this.room.sessionId) {
        dropppedItem.drop(x, y);
      }
    });

    this.room.onMessage("powerUpPickedUp", (data) => {
      const { playerId, itemId } = data;

      console.log(`Dash picked by player ${playerId}: ${itemId}`);
      // Find the item in the foodItems group
      const pickedItem = this.powerUps
        .getChildren()
        .find((item) => item.getId() === itemId);
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
    const graphics = this.add.graphics({
      lineStyle: { width: 2, color: 0xa41fe0 },
    });
    graphics.strokeCircle(x, y, radius);

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
    this.recipe.ingredients.every((i) => {
      const crntQty = this.invHash.get(i.name);
      if (crntQty < i.quantity) {
        flag = false;
        return false;
      } else {
        return true;
      }
    });
    return flag;
  }

  handleDropZoneEnter(player, zone) {
    if (this.checkIngredients()) {
      this.player.isPlaying = false;
      console.log("Cooking finished in ", this.player.duration, " seconds");
      this.room.send("playerFinished", {
        playerId: this.room.sessionId,
        playerName: this.player.name,
        playDuration: Math.round(this.player.duration),
      });
      this.physics.world.disable(zone);
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.scene.start("GameOver", {
            score: Math.round(this.player.duration),
          });
        }
      );
    } else {
      this.displayMessage("Not enough ingredients!");
    }
  }

  // Handle dropping the last picked up item
  dropItem(dropX, dropY) {
    if (this.selectedItem !== null) {
      const lastItem = this.player.dropFoodItem(this.selectedItem);
      if (lastItem && !lastItem.isDropping) {
        // update the inventory
        const prevQty = this.invHash.get(this.selectedItem);
        this.invHash.set(this.selectedItem, prevQty - 1);
        const newHash = this.invHash;
        this.registry.set('inventory', newHash);
        console.info(`Player position before dropping: x${this.player.x} y: ${this.player.y}`);
        lastItem.drop(this.player, dropX, dropY);
        this.displayMessage(`Dropped ${this.selectedItem}`);
        // Send item drop to server
        if (this.room) {
          this.room.send("itemDrop", {
            itemId: lastItem.getId(),
            itemName: lastItem.name,
            x: dropX,
            y: dropY,
          });
        }
      }
    }
  }

  updateDashText() {
    this.registry.set('powerups', this.player.powerUps.length);
  }

  updateScoreBoard() {
    let scoreText = "Scoreboard:\n";
    this.scoreBoard.forEach((player) => {
      scoreText += `${player.name}: ${player.playDuration} seconds\n`;
    });
    this.registry.set('score', scoreText);
  }

  update(time, delta) {
    this.player.update(delta);
    // Check for drop key press
    if (Phaser.Input.Keyboard.JustDown(this.dropKey)) {
      this.player.toggleReadyToDrop();
      this.displayMessage(`${this.player.readyToDrop ? "" : "Not"} Ready to drop`)
    }
    if (Phaser.Input.Keyboard.JustDown(this.powerupKey)) {
      this.player.enablePowerUp();
      this.updateDashText();
    }
    const pointer = this.input.activePointer;
    if (pointer.isDown && this.player.readyToDrop) {
        const targetX = pointer.worldX;
        const targetY = pointer.worldY;
        this.dropItem(targetX, targetY);
    }
    if (
      this.room &&
      (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0)
    ) {
      this.room.send("playerMovement", {
        x: this.player.x,
        y: this.player.y,
        rotation: this.player.rotation,
      });
    }
    this.pan.update();
  }

  // Display pickup message
  displayPickupMessage(itemName) {
    this.displayMessage(`Picked up ${itemName}!`);
  }

  // Generic message display
  displayMessage(text) {
    this.registry.set('displayMessage', text);
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

import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player, FoodItem, PowerUp, Score } from "./schema/MyRoomState";

interface RecipeIngredient {
  name: string;
  quantity: string | number;
  texture: string;
}

interface Recipe {
  name: string;
  ingredients: RecipeIngredient[];
}

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;
  state = new MyRoomState();

  mapWidth = 1280;
  mapHeight = 720;
  recipe: Recipe = {
      name: "Veg Curry",
      ingredients: [
          {name: "Carrot", quantity: "2", texture: "vegetable_carrot"},
          {name: "Corn", quantity: "1", texture: "vegetable_corn"},
          {name: "Potato", quantity: "2", texture: "vegetable_potato"},
          {name: "Garlic", quantity: "1", texture: "vegetable_garlic"},
          {name: "Ginger", quantity: "2", texture: "vegetable_ginger"},
          {name: "Onion", quantity: "1", texture: "vegetable_onion"}
  ]}
  onCreate (options: any) {
    console.log("Game room created", options);

    this.onMessage("playerMovement", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = message.x;
        player.y = message.y;
        player.rotation = message.rotation;
      }
    });

    this.onMessage("itemPickup", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        const item = this.state.foodItems.get(message.itemId);
        if (item && item.isPickedUp === false) {
          item.isPickedUp = true;
          player.inventory.push(message.itemId);
        }
        this.broadcast("itemPickedUp", { itemId: message.itemId, playerId: client.sessionId });
      }
    });

        // Handle item drop
    this.onMessage("itemDrop", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      
      if (player) {
        // Find and remove the item from the inventory
        const index = player.inventory.indexOf(data.itemName);
        if (index > -1) {
          player.inventory.splice(index, 1);
        }
        
        // Broadcast item drop to all clients
        this.broadcast("itemDropped", {
          itemId: data.itemId,
          playerId: client.sessionId,
          x: data.x,
          y: data.y
        });
      }
    });

    this.onMessage("powerUpPicked", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        const powerUp = this.state.powerUps.get(message.powerUpId);
        if (powerUp) {
          this.broadcast("powerUpPickedUp", { powerUpId: message.powerUpId, playerId: client.sessionId });
          this.state.powerUps.delete(message.powerUpId);
        }
      }
    });

    this.onMessage("playerFinished", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.playDuration = message.playDuration;
        const playerScore = new Score();
        playerScore.playerId = client.sessionId;
        playerScore.playerName = player.name;
        playerScore.score = message.playDuration;
        this.state.scoreBoard.set(client.sessionId, playerScore);
      }
    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    player.name = options.name;
    player.x = Math.floor(Math.random() * 800);
    player.y = Math.floor(Math.random() * 500);
    player.rotation = 0;
    this.state.players.set(client.sessionId, player);
    const vegetables: RecipeIngredient[] = this.recipe.ingredients;
      vegetables.forEach((ing: RecipeIngredient) => {
          const x = Math.random()*this.mapWidth;
          const y = Math.random()*this.mapHeight;
          const quantity = typeof ing.quantity === 'string' ? parseInt(ing.quantity, 10) : ing.quantity;
          for (let i = 0; i < quantity; i++) {
              const foodItem = new FoodItem();
              foodItem.id = 'food_' + Math.random().toString(36);
              foodItem.name = ing.name;
              foodItem.texture = ing.texture;
              foodItem.x = x;
              foodItem.y = y;
              foodItem.isPickedUp = false;
              foodItem.static = true;
              this.state.foodItems.set(client.sessionId, foodItem);
          }
      });
    for(let i=0; i < 50; i++) {
        const x = Math.random()*this.mapWidth;
        const y = Math.random()*this.mapHeight;
        const random = Math.floor(Math.random() * vegetables.length);
        const foodItem = new FoodItem();
          foodItem.id = 'food_' + Math.random().toString(36);
          foodItem.name = vegetables[random].name;
          foodItem.texture = vegetables[random].texture;
          foodItem.x = x;
          foodItem.y = y;
          foodItem.isPickedUp = false;
          foodItem.static = true;
          this.state.foodItems.set(client.sessionId, foodItem);
    }
    for(let i=0; i < 10; i++) {
        const x = Math.random()*this.mapWidth;
        const y = Math.random()*this.mapHeight;
        const newPowerUp = new PowerUp();
        newPowerUp.id = 'powerup_' + Math.random().toString(36);
        newPowerUp.name = "dash";
        newPowerUp.x = x;
        newPowerUp.y = y;
        this.state.powerUps.set(newPowerUp.id, newPowerUp);
    }
    this.broadcast("playerJoined", { sessionId: client.sessionId, player });
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    const player = this.state.players.get(client.sessionId);
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId);
    }
    if (player) {
      this.broadcast("playerLeft", { sessionId: client.sessionId });
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}

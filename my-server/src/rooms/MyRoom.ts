import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player, FoodItem, PowerUp, Wrath, Score } from "./schema/MyRoomState";
import roomConfig from "./roomconfig.json";

export class MyRoom extends Room<MyRoomState> {
  maxClients = roomConfig.game.maxPlayers;
  state = new MyRoomState();

  mapWidth = roomConfig.map.width;
  mapHeight = roomConfig.map.width;
  idCharLength = 36;
  foodItems: FoodItem[] = []; 
  powerUps: PowerUp[] = [];

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

    this.clock.setInterval(() => {
      const newWrath = new Wrath();
      newWrath.id = 'wrath_' + Math.random().toString(this.idCharLength);
      newWrath.name = "wrath";
      newWrath.x = Math.random()*this.mapWidth;
      newWrath.y = Math.random()*this.mapHeight;
      newWrath.isAlive = true;
      this.state.wraths.set(newWrath.id, newWrath);
      if (this.state.wraths.size < roomConfig.game.maxWraths) {
        this.broadcast("wrathSpawned", { id: newWrath.id, x: newWrath.x, y: newWrath.y });
      }
    }, roomConfig.game.wrathSpawnInterval*1000);

    const getNearestPlayer = (wrath: Wrath): Player | null  => {
      const nearest = { player: null as Player | null, dist: Infinity };
      this.state.players.forEach((player) => {
        console.log(`Checking player ${player.name} at (${player.x}, ${player.y})`);
        const dist = Math.hypot(player.x - wrath.x, player.y - wrath.y);
        if (dist < nearest.dist) {
          nearest.player = player;
          nearest.dist = dist;
        }
      });
      return nearest.player;
    }

    const calculateSeekForce = (wrath: Wrath, target: Player | null) => {
      if (!target) return { x: 0, y: 0 };
      const desired = { x: target.x - wrath.x, y: target.y - wrath.y };
      const dist = Math.hypot(desired.x, desired.y);
      if (dist === 0) return { x: 0, y: 0 };
      desired.x /= dist;
      desired.y /= dist;
      desired.x *= roomConfig.game.wrathSpeed;
      desired.y *= roomConfig.game.wrathSpeed;
      // console.log(`Wrath ${wrath.id} desired: (${desired.x.toFixed(2)}, ${desired.y.toFixed(2)})`);
      // console.log(`Wrath ${wrath.id} current: (${(wrath.forceX || 0).toFixed(2)}, ${(wrath.forceY || 0).toFixed(2)})`);
      const steer = { x: desired.x - (wrath.forceX || 0), y: desired.y - (wrath.forceY || 0) };
      return steer;
    }

    const getNearbyWraths = (wrath: Wrath, grid: Map<string, string[]>) => {
      const nearby: Wrath[] = [];
      const cellX = Math.floor(wrath.x / roomConfig.game.tileSize);
      const cellY = Math.floor(wrath.y / roomConfig.game.tileSize);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const cellKey = `${cellX + dx},${cellY + dy}`;
          const cellWraths = grid.get(cellKey);
          if (cellWraths) {
            cellWraths.forEach((id) => {
              if (id !== wrath.id) {
                const other = this.state.wraths.get(id);
                if (other && other.isAlive) {
                  nearby.push(other);
                }
              }
            });
          }
        }
      }
      return nearby;
    }
    this.clock.setInterval(() => {
      const grid = new Map<string, string[]>();
      this.state.wraths.forEach((wrath) => {
        if (wrath.isAlive) {
          const cellX = Math.floor(wrath.x / roomConfig.game.tileSize);
          const cellY = Math.floor(wrath.y / roomConfig.game.tileSize);
          const cellKey = `${cellX},${cellY}`;
          if (!grid.has(cellKey)) {
            grid.set(cellKey, []);
          }
          grid.get(cellKey)?.push(wrath.id);
        }
      });
      this.state.wraths.forEach((wrath) => {
        if (wrath.isAlive) {
          // Find nearest player
          const targetPlayer = getNearestPlayer(wrath);
          const seekForce = calculateSeekForce(wrath, targetPlayer);
          // Get separation from nearby wraths
          const nearbyWraths = getNearbyWraths(wrath, grid);
          const separationForce = {x: 0, y: 0};
          nearbyWraths.forEach((other) => {
            const dx = wrath.x - other.x;
            const dy = wrath.y - other.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < roomConfig.game.wrathSeperation) {
              separationForce.x += dx / dist;
              separationForce.y += dy / dist;
            }
          });
          // Normalize separation force
          const sepDist = Math.hypot(separationForce.x, separationForce.y);
          if (sepDist > 0) {
            separationForce.x = (separationForce.x / sepDist) * roomConfig.game.wrathSpeed;
            separationForce.y = (separationForce.y / sepDist) * roomConfig.game.wrathSpeed;
          }
          // Apply some weight to separation
          separationForce.x *= roomConfig.game.wrathSeperation;
          separationForce.y *= roomConfig.game.wrathSeperation;
          // Combine forces
          // console.log(`Wrath ${wrath.id} seek: (${seekForce.x.toFixed(2)}, ${seekForce.y.toFixed(2)}) sep: (${separationForce.x.toFixed(2)}, ${separationForce.y.toFixed(2)})`);
          const totalForce = {x: seekForce.x + separationForce.x, y: seekForce.y + separationForce.y};
          wrath.x += totalForce.x;
          wrath.y += totalForce.y;
          // Keep within bounds
          wrath.x = Math.max(0, Math.min(this.mapWidth, wrath.x));
          wrath.y = Math.max(0, Math.min(this.mapHeight, wrath.y));
          // Update force for next frame
          wrath.forceX = seekForce.x;
          wrath.forceY = seekForce.y;
          console.log(`Wrath ${wrath.id} force: (${wrath.forceX.toFixed(2)}, ${wrath.forceY.toFixed(2)})`);
          // update forces for each client
          this.broadcast("wrathUpdated", wrath);
        }
      });
    }, roomConfig.game.wrathUpdateInterval*1000);

    const vegetables = roomConfig.foodCollection.find((item: { name: string; foodItems: any[] }) => item.name === "vegetables")?.foodItems;
    // console.log(vegetables);
    for(let i=0; i < roomConfig.game.foodItemAmount; i++) {
        const x = Math.random()*this.mapWidth;
        const y = Math.random()*this.mapHeight;
        const random = Math.floor(Math.random() * vegetables.length);
        const foodItem = new FoodItem();
          foodItem.id = 'food_' + Math.random().toString(this.idCharLength);
          foodItem.name = vegetables[random].name;
          foodItem.texture = vegetables[random].texture;
          foodItem.x = x;
          foodItem.y = y;
          foodItem.isPickedUp = false;
          foodItem.static = true;
          this.foodItems.push(foodItem);
    }
    for(let i=0; i < roomConfig.game.powerUpAmount; i++) {
        const x = Math.random()*this.mapWidth;
        const y = Math.random()*this.mapHeight;
        const newPowerUp = new PowerUp();
        newPowerUp.id = 'powerup_' + Math.random().toString(this.idCharLength);
        newPowerUp.name = "dash";
        newPowerUp.x = x;
        newPowerUp.y = y;
        this.powerUps.push(newPowerUp);
    }
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    player.name = options.name;
    player.x = Math.floor(Math.random() * this.mapWidth);
    player.y = Math.floor(Math.random() * this.mapHeight);
    player.rotation = 0;
    this.state.players.set(client.sessionId, player);
    this.broadcast("playerJoined", { sessionId: client.sessionId, player });
    this.foodItems.forEach((item) => {
      this.state.foodItems.set(item.id, item);
    });
    this.powerUps.forEach((item) => {
      this.state.powerUps.set(item.id, item);
    });
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

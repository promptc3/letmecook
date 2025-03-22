import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;
  state = new MyRoomState();

  onCreate (options: any) {
    console.log("Game room created", options);

    this.state = new MyRoomState();
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

  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    player.x = Math.floor(Math.random() * 800);
    player.y = Math.floor(Math.random() * 500);
    player.rotation = 0;

    this.state.players.set(client.sessionId, player);
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

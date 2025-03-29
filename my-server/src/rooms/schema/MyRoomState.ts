import { Schema, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") rotation = 0;
  @type("string") name = "";
  @type([ "string" ]) inventory: any = [];
  @type("number") playDuration = 0;
}
export class Score extends Schema {
  @type("string") playerId = "";
  @type("string") playerName = "";
  @type("number") score = 0;
}
export class PowerUp extends Schema {
  @type("string") id = "";
  @type("number") x = 0;
  @type("number") y = 0;
  @type("string") name = "";
}
export class FoodItem extends Schema {
  @type("string") id = "";
  @type("number") x = 0;
  @type("number") y = 0;
  @type("string") name = "";
  @type("string") texture = "";
  @type("boolean") static = true;
  @type("boolean") isPickedUp = false;
}
export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: FoodItem }) foodItems = new MapSchema<FoodItem>();
  @type({ map: PowerUp }) powerUps = new MapSchema<PowerUp>();
  @type({ map: Score }) scoreBoard = new MapSchema<Score>();
}

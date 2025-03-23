import { Schema, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") rotation = 0;
  @type("string") name = "";
  @type([ "string" ]) inventory: any = [];
}

export class FoodItem extends Schema {
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
}

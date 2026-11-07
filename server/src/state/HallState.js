import { MapSchema, Schema, defineTypes } from "@colyseus/schema";

/**
 * Synchronised hall state. Plain JavaScript with defineTypes - no decorators,
 * per the project rules.
 */

export class Player extends Schema {
  constructor() {
    super();
    this.id = "";
    this.username = "";
    this.x = 0;
    this.y = 0;
    this.dir = "down";
    /** The character JSON, as a string: schema has no nested object type for it. */
    this.character = "";
    /** Seat index, or -1 while standing. */
    this.seat = -1;
  }
}

defineTypes(Player, {
  id: "string",
  username: "string",
  x: "float32",
  y: "float32",
  dir: "string",
  character: "string",
  seat: "int8",
});

export class HallState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
  }
}

defineTypes(HallState, {
  players: { map: Player },
});

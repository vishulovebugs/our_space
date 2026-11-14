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
    /** Arcade cabinet the player is inside ("chess" | "tankers" | "cave"), or "". */
    this.activity = "";
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
  activity: "string",
});

/**
 * The wall TV. Everyone in the hall sees this; whether a player gets the
 * picture is the client's business. Timestamps stay numbers (float64 holds a
 * millisecond clock exactly well past this decade).
 */
export class Tv extends Schema {
  constructor() {
    super();
    /** Empty while nothing is playing. */
    this.videoId = "";
    /** Server time the position below was taken at, in ms. */
    this.startedAt = 0;
    /** Playback position in seconds at startedAt. */
    this.position = 0;
    this.playing = false;
    /** User id of the seated player holding the remote. */
    this.hostId = "";
  }
}

defineTypes(Tv, {
  videoId: "string",
  startedAt: "float64",
  position: "float64",
  playing: "boolean",
  hostId: "string",
});

export class HallState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.tv = new Tv();
  }
}

defineTypes(HallState, {
  players: { map: Player },
  tv: Tv,
});

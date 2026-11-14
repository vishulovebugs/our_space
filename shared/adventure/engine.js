import {
  INVENTORY_LIMIT,
  ITEMS,
  LAMP_BATTERY,
  MAX_SCORE,
  ROOMS,
  SCORE_ROOM,
  START_ROOM,
  TREASURES,
  TREASURE_POINTS,
} from "./data.js";
import { matchesWords, parse } from "./parser.js";

/**
 * The adventure, as a deterministic state machine.
 *
 * createGame() returns a plain, JSON-serialisable state; step(state, input)
 * returns { state, output } and never mutates its input. The only randomness
 * is a tiny seeded generator carried in the state, so replaying a command list
 * always produces the same story.
 */

/** Chance that moving through an unlit room ends the game. */
const DARK_DEATH_CHANCE = 0.25;

const START_SEED = 12345;

const HELP_LINES = [
  "Commands:",
  "  N S E W U D or GO <direction>   walk",
  "  LOOK or L                       describe the room",
  "  TAKE <item>, DROP <item>         pick up, put down",
  "  INVENTORY or I                  what you carry",
  "  OPEN/UNLOCK <door>              use a key on a door",
  "  USE <thing>                     for things that are not doors",
  "  LIGHT LAMP, EXTINGUISH LAMP     the lamp has a battery",
  "  EAT, READ <thing>, SCORE, HELP",
  "  SAVE, LOAD, QUIT",
];

export function createGame(seed = START_SEED) {
  return {
    roomId: START_ROOM,
    inventory: [],
    roomItems: Object.fromEntries(
      Object.entries(ROOMS).map(([id, room]) => [id, [...(room.items ?? [])]]),
    ),
    unlocked: [],
    lampLit: false,
    battery: LAMP_BATTERY,
    turns: 0,
    score: 0,
    deposited: [],
    seed,
    over: false,
    won: false,
  };
}

/**
 * @param {object} state
 * @param {unknown} input
 * @returns {{ state: object, output: string[], request?: "save" | "load" | "quit" }}
 */
export function step(state, input) {
  const next = clone(state);
  const command = parse(input);

  if (command.type === "command" && command.verb === "quit") {
    return { state: next, output: ["Goodbye."], request: "quit" };
  }

  if (next.over && !(command.type === "command" && command.verb === "score")) {
    return { state: next, output: ["The game is over. Type QUIT to leave."] };
  }

  next.turns += 1;

  let output;

  if (command.type === "unknown") {
    output = ["I don't understand that."];
  } else if (command.verb === "save") {
    output = ["Your game is saved."];
  } else if (command.verb === "load") {
    output = ["Loading your saved game..."];
  } else {
    output = run(next, command);
  }

  output = [...output, ...tickLamp(next)];

  const request = command.type === "command" && (command.verb === "save" || command.verb === "load");
  return request ? { state: next, output, request: command.verb } : { state: next, output };
}

// ---- commands -----------------------------------------------------------

function run(state, command) {
  switch (command.verb) {
    case "look":
      return command.noun ? lookAt(state, command.noun) : describe(state);
    case "go":
      return move(state, command.noun);
    case "inventory":
      return listInventory(state);
    case "take":
      return take(state, command.noun);
    case "drop":
      return drop(state, command.noun);
    case "unlock":
      return useOrUnlock(state, command.noun);
    case "light":
      return lightLamp(state);
    case "extinguish":
      return extinguishLamp(state);
    case "eat":
      return eat(state);
    case "read":
      return read(state, command.noun);
    case "score":
      return [scoreLine(state)];
    case "help":
      return HELP_LINES;
    default:
      return ["I don't understand that."];
  }
}

function describe(state) {
  const room = ROOMS[state.roomId];

  if (room.dark && !isLit(state)) {
    return ["It is pitch black. You cannot see a thing."];
  }

  const lines = [room.description];

  const items = state.roomItems[state.roomId] ?? [];
  if (items.length > 0) {
    lines.push(`You see: ${items.map((id) => ITEMS[id].name).join(", ")}.`);
  }

  const exits = Object.keys(room.exits ?? {});
  lines.push(exits.length > 0 ? `Exits: ${exits.join(", ")}.` : "There is no way out of here.");

  return lines;
}

function lookAt(state, noun) {
  const carried = findItem(state.inventory, noun);
  const onFloor = findItem(state.roomItems[state.roomId] ?? [], noun);
  const itemId = carried ?? onFloor;

  if (!itemId) return ["You see nothing special."];
  if (itemId === "note") return readNote();

  return [`A ${ITEMS[itemId].name}.`];
}

function move(state, direction) {
  const room = ROOMS[state.roomId];
  const targetId = room.exits?.[direction];

  if (!targetId || !ROOMS[targetId]) return ["You cannot go that way."];

  const lock = room.locked?.[direction];
  if (lock && !state.unlocked.includes(exitKey(state.roomId, direction))) {
    return [lock.message ?? `The ${lock.name} is locked.`];
  }

  const lines = [];

  // Walking blind through a dark room is how adventurers die.
  if (room.dark && !isLit(state)) {
    if (nextRandom(state) < DARK_DEATH_CHANCE) {
      state.over = true;
      return ["You stumble in the darkness and fall. The game is over."];
    }
    lines.push("You feel your way forward, one hand on cold rock.");
  }

  state.roomId = targetId;

  return [...lines, ...describe(state)];
}

function take(state, noun) {
  if (!noun) return ["Take what?"];

  // The floor wins over the pack: "take key" in the laboratory means the iron
  // key lying there, not the brass one you are already carrying.
  const items = state.roomItems[state.roomId] ?? [];
  const itemId = findItem(items, noun);

  if (!itemId) {
    const carried = findItem(state.inventory, noun);
    if (carried) return [`You are already carrying the ${ITEMS[carried].name}.`];

    return ["I don't see that here."];
  }

  const item = ITEMS[itemId];
  if (item.fixed) return [`The ${item.name} is fixed in place.`];
  if (state.inventory.length >= INVENTORY_LIMIT) {
    return [`You cannot carry any more than ${INVENTORY_LIMIT} things.`];
  }

  state.roomItems[state.roomId] = items.filter((id) => id !== itemId);
  state.inventory = [...state.inventory, itemId];

  return [`You take the ${item.name}.`];
}

function drop(state, noun) {
  if (!noun) return ["Drop what?"];

  const itemId = findItem(state.inventory, noun);
  if (!itemId) return ["You are not carrying that."];

  const item = ITEMS[itemId];
  state.inventory = state.inventory.filter((id) => id !== itemId);

  // Treasures only score on the hearth in the cabin, and only once each.
  if (state.roomId === SCORE_ROOM && item.treasure && !state.deposited.includes(itemId)) {
    state.deposited = [...state.deposited, itemId];
    state.score = Math.min(MAX_SCORE, state.score + TREASURE_POINTS);

    const lines = [`You set the ${item.name} on the hearth. ${TREASURE_POINTS} points.`];

    if (state.deposited.length === TREASURES.length) {
      state.won = true;
      state.over = true;
      lines.push("*** Every treasure is safe. You have won the cave! ***");
    }

    return lines;
  }

  state.roomItems[state.roomId] = [...(state.roomItems[state.roomId] ?? []), itemId];

  return [`You drop the ${item.name}.`];
}

function useOrUnlock(state, noun) {
  if (!noun) return ["Use what?"];

  // The rowboat is the one thing that moves you instead of opening a door.
  const isBoat = ITEMS.boat.keywords.some((keyword) => matchesWords(keyword, noun));
  if (isBoat) {
    if (state.roomId === "lakeShore") {
      state.roomId = "lakeIsland";
      return ["You row out across the still water.", ...describe(state)];
    }

    if (state.roomId === "lakeIsland") {
      state.roomId = "lakeShore";
      return ["You row back to the shore.", ...describe(state)];
    }
  }

  const room = ROOMS[state.roomId];
  const locked = Object.entries(room.locked ?? {}).map(([direction, lock]) => ({ direction, lock }));
  const match = locked.find(({ lock }) => matchesWords(lock.name, noun));

  if (!match) return ["That does nothing."];

  const { direction, lock } = match;

  if (state.unlocked.includes(exitKey(state.roomId, direction))) {
    return [`The ${lock.name} is already open.`];
  }

  if (!findItem(state.inventory, lock.key)) {
    return [`The ${lock.name} is locked, and nothing you carry fits it.`];
  }

  state.unlocked = [...state.unlocked, exitKey(state.roomId, direction)];

  return [`The ${lock.name} opens with the ${ITEMS[lock.key].name}.`];
}

function lightLamp(state) {
  if (!state.inventory.includes("lamp")) return ["You have no lamp."];
  if (state.battery <= 0) return ["The lamp is dead. Its battery is spent."];
  if (state.lampLit) return ["The lamp is already lit."];

  state.lampLit = true;

  return ["The lamp is lit. The brass is warm in your hand."];
}

function extinguishLamp(state) {
  if (!state.lampLit) return ["The lamp is not lit."];

  state.lampLit = false;

  return ["You extinguish the lamp."];
}

function eat(state) {
  const index = state.inventory.indexOf("rations");
  if (index < 0) return ["You have nothing to eat."];

  state.inventory = state.inventory.filter((id) => id !== "rations");

  return ["You eat the rations. It is not much, but it helps."];
}

function read(state, noun) {
  const target = noun || "note";
  const carried = findItem(state.inventory, target);
  const onFloor = findItem(state.roomItems[state.roomId] ?? [], target);
  const itemId = carried ?? onFloor;

  if (!itemId) return ["There is nothing here to read."];
  if (itemId === "note") return readNote();

  return [`The ${ITEMS[itemId].name} has nothing written on it.`];
}

function readNote() {
  return [
    "The note reads: \"The vault below the crypt takes an iron key.",
    "Mind the dark, and mind your lamp.\"",
  ];
}

function listInventory(state) {
  if (state.inventory.length === 0) return ["You are empty-handed."];

  return ["You are carrying:", ...state.inventory.map((id) => `  ${ITEMS[id].name}`)];
}

function scoreLine(state) {
  return `You have ${state.score} of ${MAX_SCORE} points in ${state.turns} turns.`;
}

// ---- helpers ------------------------------------------------------------

function tickLamp(state) {
  if (!state.lampLit) return [];

  state.battery -= 1;
  if (state.battery > 0) return [];

  state.lampLit = false;
  state.battery = 0;

  return ["The lamp flickers, dims, and dies."];
}

function isLit(state) {
  return state.lampLit && state.battery > 0 && state.inventory.includes("lamp");
}

/** Find an item id in a list, by any of its keywords. */
function findItem(itemIds, noun) {
  if (!noun) return null;

  return itemIds.find((id) => ITEMS[id].keywords.some((keyword) => matchesWords(keyword, noun))) ?? null;
}

function exitKey(roomId, direction) {
  return `${roomId}:${direction}`;
}

/** Deterministic LCG: the seed travels in the state, so replays match. */
function nextRandom(state) {
  state.seed = (state.seed * 1103515245 + 12345) % 2147483648;
  return state.seed / 2147483648;
}

function clone(state) {
  return JSON.parse(JSON.stringify(state));
}

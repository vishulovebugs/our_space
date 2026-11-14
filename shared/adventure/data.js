/**
 * An original cave, written as data and inspired by Colossal Cave Adventure
 * (1976). None of the rooms, treasure or wording are copied from that game.
 *
 * Rooms own their exits, their locked doors and the items that start on the
 * floor. Items are plain records so the whole state stays JSON-serialisable.
 */

export const START_ROOM = "cabin";

/** Dropping a treasure here scores it, once. */
export const SCORE_ROOM = "cabin";

/** The treasures worth carrying back. Five of them, twenty points each. */
export const TREASURES = ["coin", "figurine", "bell", "ruby", "crown"];

export const TREASURE_POINTS = 20;

export const MAX_SCORE = TREASURES.length * TREASURE_POINTS;

/** Turns of light in a full lamp battery. Managing it is part of the game. */
export const LAMP_BATTERY = 30;

export const INVENTORY_LIMIT = 8;

/**
 * @type {Record<string, { name: string, keywords: string[], fixed?: boolean, treasure?: boolean }>}
 */
export const ITEMS = {
  lamp: { name: "brass lamp", keywords: ["lamp", "lantern"] },
  brassKey: { name: "brass key", keywords: ["key", "brass"] },
  ironKey: { name: "iron key", keywords: ["key", "iron"] },
  rations: { name: "packet of rations", keywords: ["rations", "food", "ration"] },
  note: { name: "crumpled note", keywords: ["note", "paper"] },
  rope: { name: "coil of rope", keywords: ["rope"], fixed: true },
  boat: { name: "small rowboat", keywords: ["boat", "rowboat"], fixed: true },
  crystal: { name: "glowing crystal", keywords: ["crystal", "crystals"], fixed: true },
  coin: { name: "silver coin", keywords: ["coin", "silver"], treasure: true },
  figurine: { name: "jade figurine", keywords: ["figurine", "jade", "statue"], treasure: true },
  bell: { name: "brass bell", keywords: ["bell"], treasure: true },
  ruby: { name: "red ruby", keywords: ["ruby", "gem"], treasure: true },
  crown: { name: "gold crown", keywords: ["crown", "gold"], treasure: true },
};

/**
 * Every exit is two-way; adventure.test.js checks that claim across the map.
 * A locked exit names the item that opens it and what the door is called.
 */
export const ROOMS = {
  cabin: {
    name: "Cabin",
    description:
      "You are in a low log cabin. A cold hearth fills one wall and a steel grate sits in the floor, its hinges orange with rust. Daylight shows under the door to the east.",
    exits: { east: "meadow", down: "stairwell" },
    locked: {
      down: { key: "brassKey", name: "steel grate", message: "The steel grate is locked." },
    },
    items: ["lamp", "brassKey", "rations"],
  },

  meadow: {
    name: "Meadow",
    description:
      "Tall grass moves in the wind. The cabin stands behind you to the west, and a track leads east toward a grey hillside.",
    exits: { west: "cabin", east: "path" },
  },

  path: {
    name: "Path",
    description:
      "A packed dirt path runs beside a tumbled stone wall. The hillside ahead grows darker as it gets closer.",
    exits: { west: "meadow", east: "trailhead" },
  },

  trailhead: {
    name: "Trailhead",
    description:
      "The path ends at a hillside split by a wide, cold opening. A stair of wet stone drops away into it.",
    exits: { west: "path", down: "stairwell" },
  },

  stairwell: {
    name: "Stairwell",
    description:
      "Rough steps wind down between dripping stones. Passages lead north and west, and the steps continue down.",
    exits: { up: "cabin", north: "trailhead", west: "cellar", down: "antechamber" },
  },

  antechamber: {
    name: "Antechamber",
    description:
      "A broad cavern, lit by a shaft of daylight falling from far above. Drafts move through three openings.",
    exits: { up: "stairwell", west: "crawlway", east: "gallery" },
  },

  crawlway: {
    name: "Crawlway",
    description: "A low crawlway of broken rock. You have to stoop to move through it.",
    exits: { east: "antechamber", down: "narrows" },
    dark: true,
  },

  narrows: {
    name: "Narrows",
    description: "A crack in the rock, barely shoulder wide, sloping toward a wider space below.",
    exits: { up: "crawlway", south: "pit" },
    dark: true,
  },

  pit: {
    name: "Pit",
    description: "A steep-sided pit scattered with old bones and one glint of metal.",
    exits: { north: "narrows" },
    items: ["coin"],
    dark: true,
  },

  gallery: {
    name: "Gallery",
    description:
      "A long gallery of pale stone columns. Footsteps here take a long time to stop.",
    exits: { west: "antechamber", north: "chapel", south: "slope" },
    items: ["figurine"],
  },

  chapel: {
    name: "Chapel",
    description: "A round chamber where the stone has been worked into rows of low seats.",
    exits: { south: "gallery", east: "crypt" },
    items: ["bell"],
    dark: true,
  },

  crypt: {
    name: "Crypt",
    description:
      "A cold room of stone shelves. A doorway to the south is sealed with a slab of black iron.",
    exits: { west: "chapel", down: "laboratory", south: "vault" },
    locked: {
      south: { key: "ironKey", name: "vault door", message: "The vault door is barred." },
    },
    dark: true,
  },

  laboratory: {
    name: "Laboratory",
    description:
      "A cluttered workroom of glass and rusted tools. Someone worked here for a long time and left in a hurry.",
    exits: { up: "crypt", north: "storeroom" },
    items: ["ironKey", "note"],
  },

  storeroom: {
    name: "Storeroom",
    description: "Empty shelves and a coil of rope too rotten to trust.",
    exits: { south: "laboratory" },
    items: ["rope"],
  },

  vault: {
    name: "Vault",
    description: "A small strongroom, bare except for a stone ledge.",
    exits: { north: "crypt" },
    items: ["ruby"],
  },

  slope: {
    name: "Slope",
    description: "Rubble spills down a slope toward the sound of still water.",
    exits: { north: "gallery", down: "lakeShore" },
  },

  lakeShore: {
    name: "Lake Shore",
    description:
      "A black lake, flat as a table. A small rowboat is tied to a rock at the water's edge.",
    exits: { up: "slope", north: "stream" },
    items: ["boat"],
  },

  lakeIsland: {
    name: "Lake Island",
    description: "A muddy island in the middle of the lake, just wide enough to stand on.",
    exits: {},
    items: ["crown"],
  },

  stream: {
    name: "Stream",
    description: "Fast water runs through a low passage, loud enough to drown out thought.",
    exits: { south: "lakeShore", east: "waterfall" },
  },

  waterfall: {
    name: "Waterfall",
    description: "A waterfall thunders into a black pool. Spray soaks everything.",
    exits: { west: "stream", down: "ledge" },
    dark: true,
  },

  ledge: {
    name: "Ledge",
    description: "A wet ledge behind the falling water. A gap in the rock leads east.",
    exits: { up: "waterfall", east: "chimney" },
    dark: true,
  },

  chimney: {
    name: "Chimney",
    description: "A narrow chimney of hand-cut holds, climbing steeply.",
    exits: { west: "ledge", up: "tunnel" },
  },

  tunnel: {
    name: "Tunnel",
    description: "A low tunnel of packed earth, shored with old timber.",
    exits: { down: "chimney", north: "cellar", east: "grotto" },
  },

  cellar: {
    name: "Cellar",
    description: "A root cellar with a dirt floor and the smell of damp potatoes.",
    exits: { south: "tunnel", east: "stairwell" },
    dark: true,
  },

  grotto: {
    name: "Grotto",
    description: "A small grotto where pale crystal grows out of the walls like frost.",
    exits: { west: "tunnel" },
    items: ["crystal"],
    dark: true,
  },
};

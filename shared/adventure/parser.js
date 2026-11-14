/**
 * Adventure input: a verb, optionally followed by a noun.
 *
 * Only the first four letters of a word matter, as in the 1976 game, so "unlo
 * grat" is UNLOCK GRATE and "inv" is INVENTORY. The parser is pure syntax: it
 * never looks at rooms or inventory, which is the engine's job.
 */

const VERB_ALIASES = {
  go: ["go", "walk", "move", "run"],
  look: ["look", "l", "examine", "inspect", "x"],
  take: ["take", "get", "grab"],
  drop: ["drop"],
  inventory: ["inventory", "inv", "i"],
  unlock: ["unlock", "open", "use"],
  light: ["light"],
  extinguish: ["extinguish", "ext"],
  eat: ["eat"],
  read: ["read"],
  score: ["score"],
  help: ["help"],
  quit: ["quit", "exit", "leave"],
  save: ["save"],
  load: ["load"],
};

const DIRECTIONS = {
  n: "north",
  north: "north",
  s: "south",
  south: "south",
  e: "east",
  east: "east",
  w: "west",
  west: "west",
  u: "up",
  up: "up",
  d: "down",
  down: "down",
};

/** The only form of a word the game cares about. */
export function truncateWord(word) {
  return String(word).toLowerCase().slice(0, 4);
}

export function words(text) {
  return String(text).toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * True when every word of `phrase` appears in `text`, comparing only the
 * first four letters. Used for items and doors, never for syntax.
 */
export function matchesWords(text, phrase) {
  const haystack = words(text).map(truncateWord);
  return words(phrase)
    .map(truncateWord)
    .every((needle) => haystack.includes(needle));
}

/**
 * @param {unknown} input
 * @returns {{ type: "command", verb: string, noun: string } | { type: "unknown", raw: string }}
 */
export function parse(input) {
  if (typeof input !== "string") return { type: "unknown", raw: "" };

  const tokens = words(input);
  if (tokens.length === 0) return { type: "unknown", raw: "" };

  const [first, ...rest] = tokens;

  // A bare direction is a command on its own: "n", "south", "d".
  if (DIRECTIONS[first]) return command("go", DIRECTIONS[first]);

  const verb = verbFor(first);
  if (!verb) return { type: "unknown", raw: input };

  const noun = rest.join(" ");

  if (verb === "go") {
    const direction = DIRECTIONS[rest[0]] ?? rest[0] ?? "";
    return command("go", direction);
  }

  return command(verb, noun);
}

function command(verb, noun) {
  return { type: "command", verb, noun };
}

function verbFor(word) {
  const wanted = truncateWord(word);

  // An exact four-letter match wins, so "ligh" is LIGHT and never the "l" of LOOK.
  for (const [verb, aliases] of Object.entries(VERB_ALIASES)) {
    if (aliases.some((alias) => truncateWord(alias) === wanted)) return verb;
  }

  for (const [verb, aliases] of Object.entries(VERB_ALIASES)) {
    if (aliases.some((alias) => isPrefixPair(wanted, truncateWord(alias)))) return verb;
  }

  return null;
}

/**
 * "inv" and "inve" agree, "li" and "ligh" agree. A single letter only ever
 * matches itself, so "xyzzy" stays nonsense instead of becoming LOOK via "x".
 */
function isPrefixPair(a, b) {
  if (a === b) return true;
  if (a.length < 2 || b.length < 2) return false;

  return a.startsWith(b) || b.startsWith(a);
}

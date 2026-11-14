import { describe, expect, it } from "vitest";

import { INVENTORY_LIMIT, LAMP_BATTERY, MAX_SCORE, TREASURES } from "./data.js";
import { createGame, step } from "./engine.js";

/** Runs commands in order and keeps every output line. */
function run(state, commands) {
  let current = state;
  const output = [];

  for (const command of commands) {
    const result = step(current, command);
    current = result.state;
    output.push(...result.output);
  }

  return { state: current, output };
}

/** A fresh game placed in one room, for tests that do not need to walk there. */
function at(roomId, overrides = {}) {
  return { ...createGame(), roomId, ...overrides };
}

describe("a new game", () => {
  it("starts in the cabin with the opening kit on the floor", () => {
    const state = createGame();

    expect(state.roomId).toBe("cabin");
    expect(state.inventory).toEqual([]);
    expect(state.roomItems.cabin).toEqual(["lamp", "brassKey", "rations"]);
    expect(state.score).toBe(0);
    expect(state.turns).toBe(0);
    expect(state.over).toBe(false);
  });

  it("describes the room and its exits", () => {
    const { output } = run(createGame(), ["look"]);

    expect(output.join(" ")).toContain("log cabin");
    expect(output.join(" ")).toContain("Exits: east, down.");
  });

  it("counts turns and answers nonsense", () => {
    const { state, output } = run(createGame(), ["blorp"]);

    expect(output).toEqual(["I don't understand that."]);
    expect(state.turns).toBe(1);
  });
});

describe("inventory", () => {
  it("takes and drops an item", () => {
    const taken = run(createGame(), ["take lamp"]).state;
    expect(taken.inventory).toEqual(["lamp"]);
    expect(taken.roomItems.cabin).not.toContain("lamp");

    const dropped = run(taken, ["drop lamp"]).state;
    expect(dropped.inventory).toEqual([]);
    expect(dropped.roomItems.cabin).toContain("lamp");
  });

  it("will not take the same item twice", () => {
    const { state, output } = run(createGame(), ["take lamp", "take lamp"]);

    expect(state.inventory).toEqual(["lamp"]);
    expect(output.at(-1)).toContain("already carrying");
  });

  it("will not take a fixed item", () => {
    const { state, output } = run(at("lakeShore"), ["take boat"]);

    expect(state.inventory).toEqual([]);
    expect(output.at(-1)).toContain("fixed in place");
  });

  it("enforces the inventory limit", () => {
    const full = at("pit", {
      inventory: ["lamp", "brassKey", "ironKey", "rations", "note", "rope", "bell", "ruby"],
    });

    expect(full.inventory).toHaveLength(INVENTORY_LIMIT);

    const { state, output } = run(full, ["take coin"]);

    expect(state.inventory).toHaveLength(INVENTORY_LIMIT);
    expect(output.at(-1)).toContain("cannot carry");
  });

  it("lists what is carried", () => {
    const { output } = run(createGame(), ["take lamp", "inventory"]);

    expect(output.join(" ")).toContain("brass lamp");
  });
});

describe("the dark", () => {
  it("warns when you walk into a dark room without a light", () => {
    const { output } = run(at("antechamber"), ["west"]);

    expect(output.join(" ")).toContain("pitch black");
  });

  it("can kill you when you move in the dark", () => {
    let deaths = 0;

    for (let seed = 1; seed <= 60; seed++) {
      const { state } = run(at("crawlway", { seed }), ["down"]);
      if (state.over) deaths += 1;
    }

    expect(deaths).toBeGreaterThan(0);
    expect(deaths).toBeLessThan(60);
  });

  it("is safe while the lamp is lit", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const state = at("crawlway", { seed, inventory: ["lamp"], lampLit: true, battery: 10 });
      const { state: next } = run(state, ["down", "up", "down"]);

      expect(next.over).toBe(false);
    }
  });
});

describe("the lamp", () => {
  it("needs the lamp in hand, lights it, and refuses a second light", () => {
    expect(run(createGame(), ["light lamp"]).output.at(-1)).toBe("You have no lamp.");

    const lit = run(createGame(), ["take lamp", "light lamp"]);
    expect(lit.state.lampLit).toBe(true);
    expect(lit.output.at(-1)).toContain("is lit");

    expect(run(lit.state, ["light lamp"]).output.at(-1)).toContain("already lit");
  });

  it("runs its battery down and dies", () => {
    let result = run(createGame(), ["take lamp", "light lamp"]);
    let died = false;

    for (let turn = 0; turn < LAMP_BATTERY + 5; turn++) {
      const next = run(result.state, ["look"]);
      if (next.output.some((line) => line.includes("dies"))) died = true;
      result = next;
      if (died) break;
    }

    expect(died).toBe(true);
    expect(result.state.lampLit).toBe(false);
    expect(result.state.battery).toBe(0);
  });

  it("refuses to light a dead lamp", () => {
    const dead = at("cabin", { inventory: ["lamp"], battery: 0 });

    expect(run(dead, ["light lamp"]).output.at(-1)).toContain("dead");
  });
});

describe("the puzzles", () => {
  it("keeps the grate locked without the brass key", () => {
    const locked = run(createGame(), ["down"]);

    expect(locked.state.roomId).toBe("cabin");
    expect(locked.output.at(-1)).toContain("locked");

    const noKey = run(at("cabin", { inventory: ["lamp"] }), ["unlock grate"]);
    expect(noKey.state.unlocked).toEqual([]);
    expect(noKey.output.at(-1)).toContain("nothing you carry fits");
  });

  it("opens the grate with the brass key", () => {
    const { state, output } = run(at("cabin", { inventory: ["brassKey"] }), [
      "unlock grate",
      "down",
    ]);

    expect(output.join(" ")).toContain("opens with the brass key");
    expect(state.roomId).toBe("stairwell");
  });

  it("keeps the vault barred without the iron key", () => {
    const wrongKey = run(at("crypt", { inventory: ["brassKey"] }), ["unlock vault", "south"]);

    expect(wrongKey.state.roomId).toBe("crypt");
    expect(wrongKey.output.join(" ")).toContain("nothing you carry fits");
  });

  it("opens the vault with the iron key", () => {
    const { state } = run(at("crypt", { inventory: ["ironKey"] }), ["unlock vault", "south"]);

    expect(state.roomId).toBe("vault");
  });

  it("rows to the island and back", () => {
    const out = run(at("lakeShore"), ["use boat"]);
    expect(out.state.roomId).toBe("lakeIsland");

    const back = run(out.state, ["use boat"]);
    expect(back.state.roomId).toBe("lakeShore");
  });
});

describe("scoring", () => {
  it("scores a treasure once, on the cabin hearth", () => {
    const dropped = run(at("cabin", { inventory: ["coin"] }), ["drop coin"]);

    expect(dropped.state.score).toBe(20);
    expect(dropped.state.deposited).toEqual(["coin"]);

    // Dropping the same treasure again must not score a second time.
    const again = run({ ...dropped.state, inventory: ["coin"] }, ["drop coin"]);

    expect(again.state.score).toBe(20);
    expect(again.state.deposited).toEqual(["coin"]);
  });

  it("does not score a treasure left anywhere else", () => {
    const { state } = run(at("gallery", { inventory: ["coin"] }), ["drop coin"]);

    expect(state.score).toBe(0);
  });

  it("wins with every treasure deposited", () => {
    const carrying = at("cabin", { inventory: [...TREASURES] });
    const { state, output } = run(
      carrying,
      TREASURES.map((treasure) => `drop ${treasure}`),
    );

    expect(state.score).toBe(MAX_SCORE);
    expect(state.won).toBe(true);
    expect(state.over).toBe(true);
    expect(output.join(" ")).toContain("won the cave");

    // Once won, the game stops taking orders.
    expect(run(state, ["look"]).output.at(-1)).toContain("game is over");
  });
});

describe("saving, loading and determinism", () => {
  it("survives a JSON round trip unchanged", () => {
    const played = run(createGame(), ["take lamp", "take key", "light lamp", "unlock grate", "d"]);

    const restored = JSON.parse(JSON.stringify(played.state));
    const first = step(played.state, "look");
    const second = step(restored, "look");

    expect(second.state).toEqual(first.state);
    expect(second.output).toEqual(first.output);
  });

  it("asks the client to save and load", () => {
    expect(step(createGame(), "save").request).toBe("save");
    expect(step(createGame(), "load").request).toBe("load");
  });

  it("produces the same story for the same commands", () => {
    const commands = ["take lamp", "take key", "light lamp", "unlock grate", "d", "d", "w", "look"];

    const first = run(createGame(), commands);
    const second = run(createGame(), commands);

    expect(second.output).toEqual(first.output);
    expect(second.state).toEqual(first.state);
  });

  it("never mutates the state it is given", () => {
    const state = createGame();
    const snapshot = JSON.parse(JSON.stringify(state));

    step(state, "take lamp");

    expect(state).toEqual(snapshot);
  });
});

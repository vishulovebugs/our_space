import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MAX_SCORE } from "./data.js";
import { createGame, step } from "./engine.js";

/** The winning command list kept at the repo root, so it stays reviewable. */
const walkthrough = JSON.parse(
  readFileSync(new URL("../../adventure.test-walkthrough.json", import.meta.url), "utf8"),
);

describe("the regression walkthrough", () => {
  it("wins the cave with the maximum score", () => {
    let state = createGame();
    const output = [];

    for (const command of walkthrough.commands) {
      const result = step(state, command);
      state = result.state;
      output.push(...result.output);
    }

    expect(output.join(" ")).not.toContain("game is over");
    expect(state.won).toBe(true);
    expect(state.score).toBe(MAX_SCORE);
    expect(state.deposited).toHaveLength(5);
    expect(state.turns).toBe(walkthrough.commands.length);
  });

  it("is a deterministic replay", () => {
    const play = () =>
      walkthrough.commands.reduce(
        (current, command) => step(current.state, command),
        { state: createGame(), output: [] },
      );

    const first = play();
    const second = play();

    expect(second.state).toEqual(first.state);
    expect(second.output).toEqual(first.output);
  });
});

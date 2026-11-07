import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HAIR_IDS, validateCharacter } from "@pixel-hall/shared/character.js";

import CharacterCreator from "./CharacterCreator.jsx";

afterEach(cleanup);

function currentCharacter() {
  return JSON.parse(screen.getByRole("main").dataset.character);
}

describe("CharacterCreator", () => {
  it("cycles the hair with the next button", () => {
    render(<CharacterCreator onSave={vi.fn()} />);

    const start = currentCharacter().hair;
    const next = HAIR_IDS[(HAIR_IDS.indexOf(start) + 1) % HAIR_IDS.length];

    fireEvent.click(screen.getByRole("button", { name: /next hair/i }));

    expect(currentCharacter().hair).toBe(next);
    expect(screen.getByText(`Hair: ${next}`)).toBeDefined();
  });

  it("randomizes to a valid character 100 times", () => {
    render(<CharacterCreator onSave={vi.fn()} />);

    const randomize = screen.getByRole("button", { name: "Randomize" });

    for (let i = 0; i < 100; i++) {
      fireEvent.click(randomize);
      expect(validateCharacter(currentCharacter()).ok).toBe(true);
    }
  });

  it("saves a valid character", () => {
    const onSave = vi.fn();
    render(<CharacterCreator onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(validateCharacter(onSave.mock.calls[0][0]).ok).toBe(true);
  });
});

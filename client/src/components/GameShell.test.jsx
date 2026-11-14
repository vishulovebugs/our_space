import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import GameShell from "./GameShell.jsx";

afterEach(cleanup);

describe("GameShell", () => {
  it("renders the title and whatever is plugged into the slot", () => {
    render(
      <GameShell title="Chess" onClose={vi.fn()}>
        <p>slot content</p>
      </GameShell>,
    );

    expect(screen.getByRole("dialog", { name: "Chess" })).toBeDefined();
    expect(screen.getByText("slot content")).toBeDefined();
  });

  it("calls onClose when Exit is clicked", () => {
    const onClose = vi.fn();
    render(
      <GameShell title="Chess" onClose={onClose}>
        <p>slot content</p>
      </GameShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Exit" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("runs the open lifecycle once on mount", () => {
    const onOpen = vi.fn();
    render(
      <GameShell title="Chess" onOpen={onOpen} onClose={vi.fn()}>
        <p>slot content</p>
      </GameShell>,
    );

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it, vi } from "vitest";

import { createEventBridge } from "./bridge.js";

describe("event bridge", () => {
  it("delivers an event to a subscriber", () => {
    const bridge = createEventBridge();
    const handler = vi.fn();

    bridge.on("interact:seat", handler);
    bridge.emit("interact:seat", { seatId: "seat-3" });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ seatId: "seat-3" });
  });

  it("stops delivering after the returned unsubscribe is called", () => {
    const bridge = createEventBridge();
    const handler = vi.fn();

    const unsubscribe = bridge.on("interact:tv", handler);
    unsubscribe();
    bridge.emit("interact:tv", { tvId: "tv" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("keeps subscribers of the same event independent", () => {
    const bridge = createEventBridge();
    const first = vi.fn();
    const second = vi.fn();

    bridge.on("interact:arcade", first);
    const unsubscribeSecond = bridge.on("interact:arcade", second);
    unsubscribeSecond();
    bridge.emit("interact:arcade", { cabinet: "chess" });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it("ignores events nobody listens to", () => {
    const bridge = createEventBridge();

    expect(() => bridge.emit("interact:couch", {})).not.toThrow();
  });

  it("supports a handler that unsubscribes itself", () => {
    const bridge = createEventBridge();
    const handler = vi.fn(() => unsubscribe());

    const unsubscribe = bridge.on("interact:seat", handler);
    bridge.emit("interact:seat", { seatId: "seat-1" });
    bridge.emit("interact:seat", { seatId: "seat-1" });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

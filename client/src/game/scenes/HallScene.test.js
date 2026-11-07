import * as Phaser from "phaser";
import { describe, expect, it } from "vitest";

import { HallScene } from "./HallScene.js";

describe("HallScene", () => {
  it("can be imported and is a Phaser scene", () => {
    expect(typeof HallScene).toBe("function");
    expect(Object.getPrototypeOf(HallScene.prototype)).toBe(Phaser.Scene.prototype);
  });

  it("declares the interaction payloads the bridge carries", () => {
    // Guards the event names other modules subscribe to.
    const source = HallScene.prototype.emitNearestInteraction.toString();

    for (const event of ["interact:seat", "interact:tv", "interact:arcade"]) {
      expect(source).toContain(event);
    }
  });
});

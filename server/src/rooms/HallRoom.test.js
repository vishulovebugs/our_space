import { boot } from "@colyseus/testing";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Server } from "@colyseus/core";
import { defineRoom, defineServer } from "colyseus";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { HallRoom } from "./HallRoom.js";

// Spawn tile (14, 17) with the feet on the tile's bottom edge.
const SPAWN = { x: 14 * 16 + 8, y: 18 * 16 };
const CHARACTER = {
  body: "slim",
  hair: "short",
  outfit: "tee",
  accessory: "none",
  colors: { skin: "#f2c9a0", hair: "#2b2b3a", outfit: "#3fae7a" },
};

let colyseus;

beforeAll(async () => {
  const server = defineServer({
    transport: new WebSocketTransport(),
    rooms: { hall: defineRoom(HallRoom) },
  });

  expect(server).toBeInstanceOf(Server);
  colyseus = await boot(server);
}, 30000);

afterAll(async () => {
  await colyseus.shutdown();
});

afterEach(async () => {
  await colyseus.cleanup();
});

function join(overrides = {}) {
  return colyseus.sdk.joinOrCreate("hall", {
    token: "test:user-1:pixel_cat",
    character: CHARACTER,
    ...overrides,
  });
}

function playersOf(state) {
  const entries = [];
  state.players.forEach((player, sessionId) => entries.push({ sessionId, player }));

  return entries;
}

function playerWith(state, sessionId) {
  return playersOf(state).find((entry) => entry.sessionId === sessionId)?.player;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Patches arrive when they arrive: poll the client state instead of guessing. */
async function waitUntil(predicate, timeoutMs = 3000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) return;
    await wait(25);
  }
}

describe("HallRoom", () => {
  it("shows two players to both clients", async () => {
    const alice = await join({ token: "test:user-alice:pixel_cat" });
    const bob = await join({ token: "test:user-bob:pixel_dog" });

    await waitUntil(
      () => playersOf(alice.state).length === 2 && playersOf(bob.state).length === 2,
    );

    expect(playersOf(alice.state)).toHaveLength(2);
    expect(playersOf(bob.state)).toHaveLength(2);
    expect(playerWith(bob.state, alice.sessionId)?.username).toBe("pixel_cat");
  });

  it("accepts a move at walking speed and shows it to the other client", async () => {
    const alice = await join({ token: "test:user-alice:pixel_cat" });
    const bob = await join({ token: "test:user-bob:pixel_dog" });

    await wait(200);
    alice.send("move", { x: SPAWN.x + 4, y: SPAWN.y, dir: "right" });
    await waitUntil(() => Math.abs(playerWith(bob.state, alice.sessionId)?.x - (SPAWN.x + 4)) < 0.5);

    const seen = playerWith(bob.state, alice.sessionId);
    expect(seen.x).toBeCloseTo(SPAWN.x + 4, 1);
    expect(seen.y).toBeCloseTo(SPAWN.y, 1);
    expect(seen.dir).toBe("right");
  });

  it("rejects a move into a wall and snaps the player back", async () => {
    const alice = await join({ token: "test:user-alice:pixel_cat" });

    await wait(400);
    const snap = alice.waitForMessage("snap");
    // y = 320 is the last row: the south wall.
    alice.send("move", { x: SPAWN.x, y: 320, dir: "down" });

    const position = await snap;
    expect(position.x).toBeCloseTo(SPAWN.x, 1);
    expect(position.y).toBeCloseTo(SPAWN.y, 1);
  });

  it("rejects a teleport", async () => {
    const alice = await join({ token: "test:user-alice:pixel_cat" });

    await wait(200);
    const snap = alice.waitForMessage("snap");
    // Walkable floor, but 160px away in 200ms.
    alice.send("move", { x: 24 * 16 + 8, y: SPAWN.y, dir: "right" });

    const position = await snap;
    expect(position.x).toBeCloseTo(SPAWN.x, 1);
  });

  it("keeps one player when the same account joins twice", async () => {
    const first = await join({ token: "test:user-dup:pixel_cat" });
    const serverRoom = colyseus.getRoomById(first.roomId);

    const second = await join({ token: "test:user-dup:pixel_cat" });
    await wait(300);

    const players = playersOf(serverRoom.state);
    expect(players).toHaveLength(1);
    expect(players[0].sessionId).toBe(second.sessionId);
  });

  it("removes the player when a client leaves", async () => {
    const alice = await join({ token: "test:user-alice:pixel_cat" });
    const bob = await join({ token: "test:user-bob:pixel_dog" });
    const serverRoom = colyseus.getRoomById(alice.roomId);

    await bob.leave();
    await wait(300);

    expect(playersOf(serverRoom.state)).toHaveLength(1);
  });

  it("refuses the 31st client", async () => {
    const serverRoom = await colyseus.createRoom("hall", {
      token: "test:user-0:pixel_0",
      character: CHARACTER,
    });

    for (let index = 0; index < 30; index++) {
      await colyseus.connectTo(serverRoom, {
        token: `test:user-${index}:pixel_${index}`,
        character: CHARACTER,
      });
    }

    await expect(
      colyseus.connectTo(serverRoom, { token: "test:user-31:pixel_31", character: CHARACTER }),
    ).rejects.toThrow();
  }, 30000);
});

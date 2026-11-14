import { boot } from "@colyseus/testing";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Server } from "@colyseus/core";
import { defineRoom, defineServer } from "colyseus";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { HALL_LAYOUT, SEATS } from "@pixel-hall/shared/hallLayout.js";
import { isStandablePosition } from "@pixel-hall/shared/movement.js";
import { seatAnchor } from "@pixel-hall/shared/seats.js";

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

describe("couch seats", () => {
  const SEAT_INDEX = 2;
  const ANCHOR = seatAnchor(SEATS[SEAT_INDEX]);

  function placePlayer(serverRoom, sessionId, x, y) {
    const player = serverRoom.state.players.get(sessionId);
    player.x = x;
    player.y = y;
    return player;
  }

  async function joinNearSeat(overrides) {
    const client = await join(overrides);
    const serverRoom = colyseus.getRoomById(client.roomId);
    placePlayer(serverRoom, client.sessionId, ANCHOR.x, ANCHOR.y);

    return { client, serverRoom };
  }

  it("seats a player on a free seat at that seat's anchor", async () => {
    const { client, serverRoom } = await joinNearSeat({ token: "test:user-alice:pixel_cat" });

    client.send("sit", { seatIndex: SEAT_INDEX });
    await waitUntil(() => serverRoom.state.players.get(client.sessionId)?.seat === SEAT_INDEX);

    const player = serverRoom.state.players.get(client.sessionId);
    expect(player.x).toBeCloseTo(ANCHOR.x, 1);
    expect(player.y).toBeCloseTo(ANCHOR.y, 1);
    expect(player.dir).toBe(SEATS[SEAT_INDEX].facing);
  });

  it("refuses a seat that someone else already has", async () => {
    const alice = await joinNearSeat({ token: "test:user-alice:pixel_cat" });
    const bob = await joinNearSeat({ token: "test:user-bob:pixel_dog" });

    alice.client.send("sit", { seatIndex: SEAT_INDEX });
    await waitUntil(
      () => alice.serverRoom.state.players.get(alice.client.sessionId)?.seat === SEAT_INDEX,
    );

    const error = bob.client.waitForMessage("error");
    bob.client.send("sit", { seatIndex: SEAT_INDEX });

    expect((await error).message).toBeTruthy();
    expect(bob.serverRoom.state.players.get(bob.client.sessionId).seat).toBe(-1);
  });

  it("refuses sitting from too far away", async () => {
    const client = await join({ token: "test:user-alice:pixel_cat" });
    const serverRoom = colyseus.getRoomById(client.roomId);

    const error = client.waitForMessage("error");
    client.send("sit", { seatIndex: SEAT_INDEX });
    await error;

    const player = serverRoom.state.players.get(client.sessionId);
    expect(player.seat).toBe(-1);
    expect(player.y).toBeCloseTo(SPAWN.y, 1);
  });

  it("ignores move messages from a seated player", async () => {
    const { client, serverRoom } = await joinNearSeat({ token: "test:user-alice:pixel_cat" });

    client.send("sit", { seatIndex: SEAT_INDEX });
    await waitUntil(() => serverRoom.state.players.get(client.sessionId)?.seat === SEAT_INDEX);

    client.send("move", { x: ANCHOR.x + 40, y: ANCHOR.y, dir: "right" });
    await wait(300);

    const player = serverRoom.state.players.get(client.sessionId);
    expect(player.seat).toBe(SEAT_INDEX);
    expect(player.x).toBeCloseTo(ANCHOR.x, 1);
    expect(player.y).toBeCloseTo(ANCHOR.y, 1);
  });

  it("frees the seat on stand and on disconnect", async () => {
    const alice = await joinNearSeat({ token: "test:user-alice:pixel_cat" });

    alice.client.send("sit", { seatIndex: SEAT_INDEX });
    await waitUntil(
      () => alice.serverRoom.state.players.get(alice.client.sessionId)?.seat === SEAT_INDEX,
    );

    alice.client.send("stand");
    await waitUntil(() => alice.serverRoom.state.players.get(alice.client.sessionId)?.seat === -1);

    const stood = alice.serverRoom.state.players.get(alice.client.sessionId);
    expect(isStandablePosition(HALL_LAYOUT, stood.x, stood.y)).toBe(true);

    // The seat is free again: bob takes it, then drops while still seated.
    const bob = await joinNearSeat({ token: "test:user-bob:pixel_dog" });
    bob.client.send("sit", { seatIndex: SEAT_INDEX });
    await waitUntil(() => bob.serverRoom.state.players.get(bob.client.sessionId)?.seat === SEAT_INDEX);

    await bob.client.leave();
    await wait(300);

    const carol = await joinNearSeat({ token: "test:user-carol:pixel_owl" });
    carol.client.send("sit", { seatIndex: SEAT_INDEX });
    await waitUntil(
      () => carol.serverRoom.state.players.get(carol.client.sessionId)?.seat === SEAT_INDEX,
    );

    expect(carol.serverRoom.state.players.get(carol.client.sessionId).seat).toBe(SEAT_INDEX);
  });

  it("rejects invalid seat indexes without breaking the room", async () => {
    const { client, serverRoom } = await joinNearSeat({ token: "test:user-alice:pixel_cat" });

    for (const seatIndex of [-1, 5, "a", null]) {
      const error = client.waitForMessage("error");
      client.send("sit", { seatIndex });
      await error;
    }

    expect(serverRoom.state.players.get(client.sessionId).seat).toBe(-1);

    client.send("sit", { seatIndex: SEAT_INDEX });
    await waitUntil(() => serverRoom.state.players.get(client.sessionId)?.seat === SEAT_INDEX);

    expect(serverRoom.state.players.get(client.sessionId).seat).toBe(SEAT_INDEX);
  });
});

describe("terminal chat", () => {
  async function seatPlayer(token, seatIndex) {
    const client = await join({ token });
    const serverRoom = colyseus.getRoomById(client.roomId);
    const anchor = seatAnchor(SEATS[seatIndex]);

    const player = serverRoom.state.players.get(client.sessionId);
    player.x = anchor.x;
    player.y = anchor.y;

    client.send("sit", { seatIndex });
    await waitUntil(() => serverRoom.state.players.get(client.sessionId)?.seat === seatIndex);

    return { client, serverRoom };
  }

  it("refuses chat from a standing player", async () => {
    const alice = await join({ token: "test:user-alice:pixel_cat" });

    const error = alice.waitForMessage("error");
    alice.send("chat", { text: "hello" });

    expect((await error).message).toBeTruthy();
  });

  it("sends from a seated player to seated players only", async () => {
    const alice = await seatPlayer("test:user-alice:pixel_cat", 2);
    const bob = await seatPlayer("test:user-bob:pixel_dog", 3);
    const carol = await join({ token: "test:user-carol:pixel_owl" });

    const carolHeard = [];
    carol.onMessage("chat", (message) => carolHeard.push(message));

    const received = bob.client.waitForMessage("chat");
    alice.client.send("chat", { text: "hi couch" });

    const message = await received;
    expect(message.username).toBe("pixel_cat");
    expect(message.text).toBe("hi couch");
    expect(typeof message.ts).toBe("number");

    await wait(300);
    expect(carolHeard).toHaveLength(0);
  });

  it("strips tags and control characters before broadcasting", async () => {
    const alice = await seatPlayer("test:user-alice:pixel_cat", 2);
    const bob = await seatPlayer("test:user-bob:pixel_dog", 3);

    const received = bob.client.waitForMessage("chat");
    alice.client.send("chat", { text: "<script>alert(1)</script>" });

    expect((await received).text).toBe("alert(1)");
  });

  it("drops the sixth message in ten seconds with an error", async () => {
    const alice = await seatPlayer("test:user-alice:pixel_cat", 2);
    const bob = await seatPlayer("test:user-bob:pixel_dog", 3);

    const heard = [];
    bob.client.onMessage("chat", (message) => heard.push(message));

    for (let index = 0; index < 5; index++) {
      alice.client.send("chat", { text: `line ${index}` });
    }
    await waitUntil(() => heard.length === 5);

    const error = alice.client.waitForMessage("error");
    alice.client.send("chat", { text: "line 5" });

    expect((await error).message).toBeTruthy();
    await wait(300);
    expect(heard).toHaveLength(5);
  });

  it("replays the history to a player who sits later", async () => {
    const alice = await seatPlayer("test:user-alice:pixel_cat", 2);
    const bob = await seatPlayer("test:user-bob:pixel_dog", 3);

    const heard = bob.client.waitForMessage("chat");
    alice.client.send("chat", { text: "before you arrived" });
    await heard;

    const carol = await seatPlayer("test:user-carol:pixel_owl", 4);

    const history = carol.client.waitForMessage("chat:history");
    carol.client.send("chat:open");

    const { messages } = await history;
    expect(messages.at(-1)).toMatchObject({ username: "pixel_cat", text: "before you arrived" });
  });
});

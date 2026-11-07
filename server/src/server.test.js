import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createGameServer } from "./server.js";

let httpServer;
let gameServer;
let baseUrl;

beforeAll(async () => {
  ({ httpServer, gameServer } = createGameServer());

  // Port 0 lets the OS pick a free port, so the test never clashes with a
  // dev server on 2567.
  await gameServer.listen(0);
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
});

describe("GET /health", () => {
  it("reports ok", async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});

import { createServer as createHttpServer } from "node:http";

import { WebSocketTransport } from "@colyseus/ws-transport";
import { defineRoom, defineServer } from "colyseus";
import express from "express";

import { HallRoom } from "./rooms/HallRoom.js";

/**
 * The Express app, kept separate from the socket server so tests can start it
 * on any port.
 */
export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}

/**
 * Builds the HTTP + WebSocket server without binding a port, so the caller
 * (index.js, or a test) decides which one to use.
 */
export function createGameServer() {
  const app = createApp();
  const httpServer = createHttpServer(app);

  const gameServer = defineServer({
    transport: new WebSocketTransport({ server: httpServer }),
    rooms: {
      hall: defineRoom(HallRoom),
    },
  });

  return { app, httpServer, gameServer };
}

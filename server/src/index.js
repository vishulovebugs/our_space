import { createGameServer } from "./server.js";

const port = Number(process.env.PORT) || 2567;
const { gameServer } = createGameServer();

await gameServer.listen(port);

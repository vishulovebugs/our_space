import { useEffect, useState } from "react";

import GameCanvas from "../components/GameCanvas.jsx";
import { gameBridge } from "../game/bridge.js";

export default function Hall({ character, username, token, onLogout }) {
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const stopLost = gameBridge.on("connection:lost", () => setReconnecting(true));
    const stopRestored = gameBridge.on("connection:restored", () => setReconnecting(false));

    return () => {
      stopLost();
      stopRestored();
    };
  }, []);

  return (
    <div className="hall">
      <GameCanvas character={character} username={username} token={token} />
      <button type="button" className="logout" onClick={onLogout}>
        Log out
      </button>
      {reconnecting && <p className="reconnecting">Reconnecting...</p>}
    </div>
  );
}

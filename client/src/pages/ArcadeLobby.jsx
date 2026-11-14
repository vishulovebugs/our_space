import { useState } from "react";

import GameShell from "../components/GameShell.jsx";
import CaveGame from "./CaveGame.jsx";

/**
 * A cabinet's front door: a pixel-framed modal with Play and Close. Play opens
 * the shell that the games will fill in later phases; nothing is behind it yet,
 * so the slot holds a placeholder and a way back.
 */
export default function ArcadeLobby({ arcade, onClose }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    if (arcade.id === "cave") {
      return (
        <GameShell title={arcade.name} onClose={onClose}>
          <CaveGame onExit={onClose} />
        </GameShell>
      );
    }

    return (
      <GameShell title={arcade.name} onClose={onClose}>
        <p className="arcade-coming-soon">Coming soon</p>
        <button type="button" onClick={() => setPlaying(false)}>
          Back
        </button>
      </GameShell>
    );
  }

  return (
    <div className="arcade-modal" role="dialog" aria-label={arcade.name}>
      <div className="arcade-frame">
        <h2>{arcade.name}</h2>
        <div className="arcade-actions">
          <button type="button" onClick={() => setPlaying(true)}>
            Play
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

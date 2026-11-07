import * as Phaser from "phaser";
import { useEffect, useRef } from "react";

import { HallScene } from "../game/scenes/HallScene.js";

/**
 * Mounts the Phaser game. In FIT mode Phaser scales the 320x240 canvas up to
 * the container and keeps the pixels crisp.
 */
export default function GameCanvas({ character, username }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 320,
      height: 240,
      pixelArt: true,
      roundPixels: true,
      backgroundColor: "#0b0b12",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [HallScene],
      callbacks: {
        // Runs after the registry exists and before the scene is created.
        preBoot: (booted) => booted.registry.set("spawn", { character, username }),
      },
    });

    gameRef.current = game;

    return () => {
      gameRef.current = null;
      game.destroy(true);
    };
    // Built once per mount: the spawn data is captured here on purpose.
  }, []);

  return <div className="game-canvas" ref={containerRef} />;
}

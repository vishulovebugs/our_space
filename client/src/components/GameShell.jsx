import { useEffect } from "react";

/**
 * The shell every cabinet game plugs into: a full-screen overlay with a title
 * bar, an Exit button and a content slot. Games render into the slot and use
 * onOpen for setup; Exit is the one way out, so onClose stays the caller's.
 */
export default function GameShell({ title, onOpen, onClose, children }) {
  useEffect(() => {
    onOpen?.();
  }, []);

  return (
    <div className="game-shell" role="dialog" aria-label={title}>
      <header className="game-shell-bar">
        <h2>{title}</h2>
        <button type="button" onClick={onClose}>
          Exit
        </button>
      </header>
      <div className="game-shell-slot">{children}</div>
    </div>
  );
}

import { useEffect, useState } from "react";

import GameCanvas from "../components/GameCanvas.jsx";
import { gameBridge } from "../game/bridge.js";
import ChatOverlay from "./ChatOverlay.jsx";

export default function Hall({ character, username, token, onLogout }) {
  const [reconnecting, setReconnecting] = useState(false);
  const [seated, setSeated] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const stops = [
      gameBridge.on("connection:lost", () => {
        setReconnecting(true);
        setChatOpen(false);
      }),
      gameBridge.on("connection:restored", () => setReconnecting(false)),
      gameBridge.on("player:seated", () => setSeated(true)),
      gameBridge.on("player:stood", () => {
        setSeated(false);
        setChatOpen(false);
      }),
      // The scene emits this when the player presses T on a seat.
      gameBridge.on("chat:opened", () => {
        setLines([]);
        setChatOpen(true);
      }),
      gameBridge.on("chat:closed", () => setChatOpen(false)),
      gameBridge.on("chat:history", (messages) => setLines(messages)),
      gameBridge.on("chat:message", (message) => setLines((current) => [...current, message])),
      gameBridge.on("chat:error", (message) =>
        setLines((current) => [...current, { text: message, error: true }]),
      ),
    ];

    return () => stops.forEach((stop) => stop());
  }, []);

  function closeChat() {
    gameBridge.emit("chat:close");
    setChatOpen(false);
  }

  return (
    <div className="hall">
      <GameCanvas character={character} username={username} token={token} />
      <button type="button" className="logout" onClick={onLogout}>
        Log out
      </button>
      {seated && !chatOpen && <p className="chat-hint">Press T to open chat</p>}
      {chatOpen && (
        <ChatOverlay
          lines={lines}
          onSend={(message) => gameBridge.emit("chat:send", { message })}
          onClose={closeChat}
        />
      )}
      {reconnecting && <p className="reconnecting">Reconnecting...</p>}
    </div>
  );
}

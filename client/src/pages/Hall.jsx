import { useEffect, useState } from "react";

import { arcadeById } from "@pixel-hall/shared/arcade.js";

import GameCanvas from "../components/GameCanvas.jsx";
import TvPanel from "../components/TvPanel.jsx";
import { gameBridge } from "../game/bridge.js";
import ArcadeLobby from "./ArcadeLobby.jsx";
import ChatOverlay from "./ChatOverlay.jsx";

export default function Hall({ character, username, token, onLogout }) {
  const [reconnecting, setReconnecting] = useState(false);
  const [seated, setSeated] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [lines, setLines] = useState([]);
  const [tv, setTv] = useState(null);
  const [tvOpen, setTvOpen] = useState(false);
  const [tvError, setTvError] = useState("");
  const [arcade, setArcade] = useState(null);

  useEffect(() => {
    const stops = [
      gameBridge.on("connection:lost", () => {
        setReconnecting(true);
        setChatOpen(false);
        setTvOpen(false);
        setArcade(null);
      }),
      gameBridge.on("connection:restored", () => setReconnecting(false)),
      gameBridge.on("player:seated", () => setSeated(true)),
      gameBridge.on("player:stood", () => {
        setSeated(false);
        setChatOpen(false);
        setTvOpen(false);
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
      gameBridge.on("tv:opened", () => {
        setTvError("");
        setTvOpen(true);
      }),
      gameBridge.on("tv:closed", () => setTvOpen(false)),
      gameBridge.on("tv:state", (state) => setTv(state)),
      gameBridge.on("tv:error", (message) => setTvError(message)),
      gameBridge.on("arcade:opened", ({ id }) => setArcade(arcadeById(id))),
      gameBridge.on("arcade:closed", () => setArcade(null)),
    ];

    return () => stops.forEach((stop) => stop());
  }, []);

  function closeChat() {
    gameBridge.emit("chat:close");
    setChatOpen(false);
  }

  function closeTv() {
    gameBridge.emit("tv:close");
    setTvOpen(false);
  }

  function closeArcade() {
    gameBridge.emit("arcade:close");
    setArcade(null);
  }

  const hintVisible = seated && !chatOpen && !tvOpen;

  return (
    <div className="hall">
      <GameCanvas character={character} username={username} token={token} />
      <button type="button" className="logout" onClick={onLogout}>
        Log out
      </button>
      {hintVisible && <p className="chat-hint">Press T to open chat | Press V to open TV</p>}
      {chatOpen && (
        <ChatOverlay
          lines={lines}
          onSend={(message) => gameBridge.emit("chat:send", { message })}
          onClose={closeChat}
        />
      )}
      {tvOpen && seated && (
        <TvPanel
          tv={tv}
          isHost={Boolean(tv?.isHost)}
          error={tvError}
          onPlay={(url) => gameBridge.emit("tv:play", { url })}
          onPause={() => gameBridge.emit("tv:pause")}
          onResume={() => gameBridge.emit("tv:resume")}
          onStop={() => gameBridge.emit("tv:stop")}
          onClose={closeTv}
        />
      )}
      {arcade && <ArcadeLobby arcade={arcade} onClose={closeArcade} />}
      {reconnecting && <p className="reconnecting">Reconnecting...</p>}
    </div>
  );
}

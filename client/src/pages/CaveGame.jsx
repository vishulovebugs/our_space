import { useEffect, useRef, useState } from "react";

import { createGame, step } from "@pixel-hall/shared/adventure/engine.js";

import { supabase } from "../lib/supabase.js";

/** The first thing on screen: the engine's own description of the cabin. */
const OPENING_LINES = [...step(createGame(), "look").output, ""];

/**
 * The cave terminal. All the rules live in shared/adventure; this component
 * only keeps the scrollback, the input line and the save file in Supabase.
 */
export default function CaveGame({ onExit }) {
  const [state, setState] = useState(() => createGame());
  const [lines, setLines] = useState(OPENING_LINES);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: "end" });
  }, [lines]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") onExit();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onExit]);

  function append(newLines) {
    setLines((current) => [...current, ...newLines]);
  }

  async function currentUserId() {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  }

  async function saveGame(snapshot) {
    const userId = await currentUserId();
    if (!userId) return "You must be signed in to save.";

    const { error } = await supabase.from("adventure_saves").upsert({
      user_id: userId,
      state: snapshot,
      updated_at: new Date().toISOString(),
    });

    return error ? "The cave could not save your game." : "Game saved.";
  }

  async function loadGame() {
    const userId = await currentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from("adventure_saves")
      .select("state")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data?.state) return null;

    // A save from an older build might miss fields the engine now expects.
    return { ...createGame(), ...data.state };
  }

  async function submit(event) {
    event.preventDefault();

    const command = input;
    const result = step(state, command);

    setInput("");
    setHistoryIndex(-1);
    if (command.trim() !== "") setHistory((current) => [...current, command]);
    append([`> ${command}`, ...result.output, ""]);
    setState(result.state);

    if (result.request === "quit") {
      onExit();
      return;
    }

    if (result.request === "save") {
      append([await saveGame(result.state), ""]);
      return;
    }

    if (result.request === "load") {
      const loaded = await loadGame();
      if (!loaded) {
        append(["No saved game found.", ""]);
        return;
      }

      setState(loaded);
      append(["Save loaded.", ""]);
    }
  }

  function handleKeyDown(event) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    if (history.length === 0) return;

    if (event.key === "ArrowUp") {
      const nextIndex = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
      return;
    }

    const nextIndex = historyIndex + 1;
    if (historyIndex < 0 || nextIndex >= history.length) {
      setHistoryIndex(-1);
      setInput("");
      return;
    }

    setHistoryIndex(nextIndex);
    setInput(history[nextIndex]);
  }

  return (
    <div className="cave-game">
      <div className="cave-scroll">
        {lines.map((line, index) => (
          <p key={index} className="cave-line">
            {line}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="cave-input-line" onSubmit={submit}>
        <span className="cave-prompt">&gt;</span>
        <input
          ref={inputRef}
          className="cave-input"
          aria-label="Cave command"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}

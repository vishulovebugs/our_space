import { useEffect, useRef, useState } from "react";

import { parseInput } from "@pixel-hall/shared/chatParser.js";

/**
 * The dark chat space: pitch black, monospace, nothing but lines of text and a
 * blinking prompt. It owns the input line only - messages arrive from the
 * server through the scene, and closing is the parent's decision.
 */
export default function ChatOverlay({ lines, onSend, onClose }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: "end" });
  }, [lines]);

  function handleSubmit(event) {
    event.preventDefault();

    const parsed = parseInput(input);
    setInput("");

    if (parsed.type === "send") onSend(parsed.message);
    else if (parsed.type === "quit") onClose();
  }

  return (
    <div className="chat-overlay" data-testid="chat-overlay" role="log" aria-label="Chat">
      <div className="chat-lines">
        {lines.map((line, index) => (
          <p
            key={`${line.ts}-${index}`}
            className={line.error ? "chat-line chat-error" : "chat-line"}
          >
            {line.error ? line.text : `${line.username}: ${line.text}`}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-line" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="chat-input"
          aria-label="Chat input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}

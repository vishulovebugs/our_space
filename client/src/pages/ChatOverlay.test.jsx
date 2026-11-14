import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ChatOverlay from "./ChatOverlay.jsx";

afterEach(cleanup);

function submit(value) {
  const input = screen.getByLabelText("Chat input");

  fireEvent.change(input, { target: { value } });
  fireEvent.submit(input.closest("form"));

  return input;
}

describe("ChatOverlay", () => {
  it("renders only a black overlay of text, with no buttons", () => {
    render(
      <ChatOverlay
        lines={[{ username: "alice", text: "hello", ts: 1 }]}
        onSend={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const overlay = screen.getByTestId("chat-overlay");

    expect(overlay.className).toBe("chat-overlay");
    expect(overlay.querySelectorAll("button")).toHaveLength(0);
    expect(overlay.querySelectorAll("img")).toHaveLength(0);
    expect(screen.getByText("alice: hello")).toBeDefined();
    expect(screen.getByLabelText("Chat input")).toBeDefined();
  });

  it("sends the message after /t and clears the input", () => {
    const onSend = vi.fn();
    render(<ChatOverlay lines={[]} onSend={onSend} onClose={vi.fn()} />);

    const input = submit("/t hi");

    expect(onSend).toHaveBeenCalledWith("hi");
    expect(input.value).toBe("");
  });

  it("closes on /q", () => {
    const onClose = vi.fn();
    render(<ChatOverlay lines={[]} onSend={vi.fn()} onClose={onClose} />);

    submit("/q");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores plain text silently", () => {
    const onSend = vi.fn();
    const onClose = vi.fn();
    render(<ChatOverlay lines={[]} onSend={onSend} onClose={onClose} />);

    submit("hello");

    expect(onSend).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

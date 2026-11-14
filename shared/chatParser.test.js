import { describe, expect, it } from "vitest";

import { CHAT_MESSAGE_MAX, parseInput } from "./chatParser.js";

describe("parseInput", () => {
  it("sends the message after /t", () => {
    expect(parseInput("/t hello")).toEqual({ type: "send", message: "hello" });
  });

  it("ignores /t with nothing after it", () => {
    expect(parseInput("/t")).toEqual({ type: "ignore" });
    expect(parseInput("/t   ")).toEqual({ type: "ignore" });
  });

  it("quits on /q", () => {
    expect(parseInput("/q")).toEqual({ type: "quit" });
    expect(parseInput("/Q")).toEqual({ type: "quit" });
  });

  it("ignores plain text", () => {
    expect(parseInput("hello")).toEqual({ type: "ignore" });
    expect(parseInput("")).toEqual({ type: "ignore" });
    expect(parseInput("  ")).toEqual({ type: "ignore" });
  });

  it("is case-insensitive about the command", () => {
    expect(parseInput("/T hi")).toEqual({ type: "send", message: "hi" });
  });

  it("trims leading and trailing space around the command and the message", () => {
    expect(parseInput("   /t   hello there   ")).toEqual({ type: "send", message: "hello there" });
  });

  it("truncates a message longer than the limit", () => {
    const long = "x".repeat(CHAT_MESSAGE_MAX + 1);
    const parsed = parseInput(`/t ${long}`);

    expect(parsed.type).toBe("send");
    expect(parsed.message).toHaveLength(CHAT_MESSAGE_MAX);
  });

  it("keeps inner spaces and slashes in the message", () => {
    expect(parseInput("/t a /t b")).toEqual({ type: "send", message: "a /t b" });
  });

  it("ignores non-strings", () => {
    expect(parseInput(null)).toEqual({ type: "ignore" });
    expect(parseInput(undefined)).toEqual({ type: "ignore" });
    expect(parseInput(42)).toEqual({ type: "ignore" });
  });
});

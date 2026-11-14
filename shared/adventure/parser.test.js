import { describe, expect, it } from "vitest";

import { matchesWords, parse, truncateWord } from "./parser.js";

function verbOf(input) {
  return parse(input).verb;
}

describe("parse", () => {
  it("turns single letters into directions", () => {
    const expected = {
      n: "north",
      s: "south",
      e: "east",
      w: "west",
      u: "up",
      d: "down",
    };

    for (const [letter, direction] of Object.entries(expected)) {
      expect(parse(letter)).toEqual({ type: "command", verb: "go", noun: direction });
    }
  });

  it("accepts full directions and GO <direction>", () => {
    expect(parse("north")).toEqual({ type: "command", verb: "go", noun: "north" });
    expect(parse("go south")).toEqual({ type: "command", verb: "go", noun: "south" });
    expect(parse("GO WEST")).toEqual({ type: "command", verb: "go", noun: "west" });
  });

  it("understands verb and verb+noun", () => {
    expect(parse("look")).toEqual({ type: "command", verb: "look", noun: "" });
    expect(parse("l")).toEqual({ type: "command", verb: "look", noun: "" });
    expect(parse("get lamp")).toEqual({ type: "command", verb: "take", noun: "lamp" });
    expect(parse("take coin")).toEqual({ type: "command", verb: "take", noun: "coin" });
    expect(parse("drop fig")).toEqual({ type: "command", verb: "drop", noun: "fig" });
    expect(parse("inv")).toEqual({ type: "command", verb: "inventory", noun: "" });
    expect(parse("i")).toEqual({ type: "command", verb: "inventory", noun: "" });
    expect(parse("inventory")).toEqual({ type: "command", verb: "inventory", noun: "" });
    expect(parse("unlock grate")).toEqual({ type: "command", verb: "unlock", noun: "grate" });
    expect(parse("open vault")).toEqual({ type: "command", verb: "unlock", noun: "vault" });
    expect(parse("light lamp")).toEqual({ type: "command", verb: "light", noun: "lamp" });
    expect(parse("extinguish lamp")).toEqual({ type: "command", verb: "extinguish", noun: "lamp" });
    expect(parse("eat")).toEqual({ type: "command", verb: "eat", noun: "" });
    expect(parse("read note")).toEqual({ type: "command", verb: "read", noun: "note" });
    expect(parse("score")).toEqual({ type: "command", verb: "score", noun: "" });
    expect(parse("help")).toEqual({ type: "command", verb: "help", noun: "" });
    expect(parse("quit")).toEqual({ type: "command", verb: "quit", noun: "" });
    expect(parse("save")).toEqual({ type: "command", verb: "save", noun: "" });
    expect(parse("load")).toEqual({ type: "command", verb: "load", noun: "" });
  });

  it("cares only about the first four letters", () => {
    expect(parse("unlo grat")).toEqual({ type: "command", verb: "unlock", noun: "grat" });
    expect(parse("inve")).toEqual({ type: "command", verb: "inventory", noun: "" });
    expect(parse("exam lamp")).toEqual({ type: "command", verb: "look", noun: "lamp" });
    expect(verbOf("exti")).toBe("extinguish");
  });

  it("keeps abbreviations apart from look", () => {
    // "light" must not be read as the one-letter LOOK alias.
    expect(verbOf("light")).toBe("light");
    expect(verbOf("l")).toBe("look");
    expect(verbOf("li")).toBe("light");
  });

  it("ignores case and extra spaces", () => {
    expect(parse("  GET    LAMP  ")).toEqual({ type: "command", verb: "take", noun: "lamp" });
    expect(parse("UNLO GRAT")).toEqual({ type: "command", verb: "unlock", noun: "grat" });
    expect(parse("QuIt")).toEqual({ type: "command", verb: "quit", noun: "" });
  });

  it("rejects empty and unknown input", () => {
    expect(parse("")).toEqual({ type: "unknown", raw: "" });
    expect(parse("   ")).toEqual({ type: "unknown", raw: "" });
    expect(parse("frobnicate the pillar")).toEqual({ type: "unknown", raw: "frobnicate the pillar" });
    expect(parse("xyzzy").type).toBe("unknown");
    expect(parse(null).type).toBe("unknown");
    expect(parse(42).type).toBe("unknown");
  });
});

describe("truncateWord and matchesWords", () => {
  it("truncates to four letters", () => {
    expect(truncateWord("Lantern")).toBe("lant");
    expect(truncateWord("key")).toBe("key");
  });

  it("matches a noun against a name with extra words", () => {
    expect(matchesWords("steel grate", "grate")).toBe(true);
    expect(matchesWords("vault door", "door")).toBe(true);
    expect(matchesWords("small rowboat", "boat")).toBe(false);
    expect(matchesWords("brass lamp", "crown")).toBe(false);
  });
});

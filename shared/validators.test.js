import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PASSWORD_MIN_LENGTH, USERNAME_PATTERN, validatePassword, validateUsername } from "./validators.js";

describe("validateUsername", () => {
  it("accepts a normal username", () => {
    expect(validateUsername("pixel_cat")).toEqual({ ok: true, error: null });
  });

  it("rejects names shorter than 3 characters", () => {
    expect(validateUsername("ab").ok).toBe(false);
  });

  it("rejects names longer than 16 characters", () => {
    expect(validateUsername("a".repeat(17)).ok).toBe(false);
  });

  it("rejects spaces", () => {
    expect(validateUsername("has space").ok).toBe(false);
  });

  it("rejects emoji", () => {
    expect(validateUsername("emoji😀").ok).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(validateUsername(undefined).ok).toBe(false);
  });

  it("keeps the SQL check constraint in sync", () => {
    const schema = readFileSync(new URL("../server/db/schema.sql", import.meta.url), "utf8");

    expect(schema).toContain(USERNAME_PATTERN.source);
  });
});

describe("validatePassword", () => {
  it("accepts a password at the minimum length", () => {
    expect(validatePassword("a".repeat(PASSWORD_MIN_LENGTH))).toEqual({ ok: true, error: null });
  });

  it("rejects a short password", () => {
    expect(validatePassword("short").ok).toBe(false);
    expect(validatePassword("short").error).toBe("At least 8 characters.");
  });

  it("rejects non-strings", () => {
    expect(validatePassword(null).ok).toBe(false);
  });
});

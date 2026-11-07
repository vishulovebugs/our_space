import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { verifyToken } from "./auth.js";

const SECRET = "test-jwt-secret";
const TEST_NODE_ENV = "test";

function signJwt(payload, secret) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode(payload);
  const signature = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");

  return `${header}.${body}.${signature}`;
}

function validPayload(overrides = {}) {
  return {
    sub: "3f0b0b26-0000-4000-8000-000000000001",
    exp: Math.floor(Date.now() / 1000) + 3600,
    user_metadata: { username: "pixel_cat" },
    ...overrides,
  };
}

beforeEach(() => {
  process.env.NODE_ENV = TEST_NODE_ENV;
  process.env.SUPABASE_JWT_SECRET = SECRET;
});

afterEach(() => {
  process.env.NODE_ENV = TEST_NODE_ENV;
  delete process.env.SUPABASE_JWT_SECRET;
});

describe("verifyToken - test tokens", () => {
  it("parses a test token", async () => {
    await expect(verifyToken("test:user-1:pixel_cat")).resolves.toEqual({
      userId: "user-1",
      username: "pixel_cat",
    });
  });

  it("rejects malformed test tokens", async () => {
    const bad = [
      "test:user-1",
      "test::pixel_cat",
      "test:user-1:ab",
      "test:user-1:pixel_cat:extra",
      "test:user-1:has space",
    ];

    for (const token of bad) {
      await expect(verifyToken(token)).rejects.toThrow("Malformed test token");
    }
  });

  it("refuses the test bypass when NODE_ENV is production", async () => {
    process.env.NODE_ENV = "production";

    await expect(verifyToken("test:user-1:pixel_cat")).rejects.toThrow(
      "Test tokens are only accepted when NODE_ENV is test",
    );
  });
});

describe("verifyToken - Supabase JWTs", () => {
  it("accepts a JWT signed with the project secret", async () => {
    const token = signJwt(validPayload(), SECRET);

    await expect(verifyToken(token)).resolves.toEqual({
      userId: "3f0b0b26-0000-4000-8000-000000000001",
      username: "pixel_cat",
    });
  });

  it("rejects a token signed with another secret", async () => {
    const token = signJwt(validPayload(), "not-the-secret");

    await expect(verifyToken(token)).rejects.toThrow("Invalid token signature");
  });

  it("rejects an expired token", async () => {
    const token = signJwt(validPayload({ exp: Math.floor(Date.now() / 1000) - 10 }), SECRET);

    await expect(verifyToken(token)).rejects.toThrow("Token expired");
  });

  it("rejects an empty token", async () => {
    await expect(verifyToken("")).rejects.toThrow("Missing token");
  });
});

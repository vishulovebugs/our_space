import { createHmac, timingSafeEqual } from "node:crypto";

import { validateUsername } from "@pixel-hall/shared/validators.js";

const TEST_TOKEN_PREFIX = "test:";

/**
 * Resolves a bearer token to the user behind it.
 *
 * In tests, "test:<userId>:<username>" stands in for a Supabase JWT so no
 * network is needed.
 *
 * @param {string} token
 * @returns {Promise<{ userId: string, username: string | null }>}
 */
export async function verifyToken(token) {
  if (typeof token !== "string" || token === "") {
    throw new Error("Missing token");
  }

  if (token.startsWith(TEST_TOKEN_PREFIX)) {
    return parseTestToken(token);
  }

  return verifySupabaseJwt(token);
}

/**
 * The bypass checks NODE_ENV on every call rather than at import time, so a
 * test build cannot leak it into a running server.
 */
function parseTestToken(token) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Test tokens are only accepted when NODE_ENV is test");
  }

  const parts = token.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed test token");
  }

  const [, userId, username] = parts;
  if (!userId || !username || !validateUsername(username).ok) {
    throw new Error("Malformed test token");
  }

  return { userId, username };
}

/**
 * Verifies a Supabase-issued HS256 JWT with the project's JWT secret. No
 * network call, no extra dependency.
 *
 * @param {string} token
 * @returns {{ userId: string, username: string | null }}
 */
function verifySupabaseJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed token");
  }

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error("SUPABASE_JWT_SECRET is not set");
  }

  const header = decodeJsonSegment(parts[0]);
  if (header.alg !== "HS256") {
    throw new Error("Unsupported token algorithm");
  }

  const expected = createHmac("sha256", secret).update(`${parts[0]}.${parts[1]}`).digest();
  const actual = Buffer.from(parts[2], "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Invalid token signature");
  }

  const payload = decodeJsonSegment(parts[1]);
  if (typeof payload.sub !== "string") {
    throw new Error("Token has no subject");
  }
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
    throw new Error("Token expired");
  }

  return {
    userId: payload.sub,
    username: payload.user_metadata?.username ?? null,
  };
}

function decodeJsonSegment(segment) {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
  } catch {
    throw new Error("Malformed token");
  }
}

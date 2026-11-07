/**
 * Username and password rules, shared by the login form, the server and the
 * database check constraint (server/db/schema.sql).
 */

/** 3-16 characters: letters, numbers, underscore. Case-insensitive uniqueness is citext's job. */
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,16}$/;

export const PASSWORD_MIN_LENGTH = 8;

/**
 * @param {unknown} name
 * @returns {{ ok: boolean, error: string | null }}
 */
export function validateUsername(name) {
  if (typeof name !== "string" || !USERNAME_PATTERN.test(name)) {
    return { ok: false, error: "3-16 characters, letters, numbers or underscore." };
  }
  return { ok: true, error: null };
}

/**
 * @param {unknown} password
 * @returns {{ ok: boolean, error: string | null }}
 */
export function validatePassword(password) {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `At least ${PASSWORD_MIN_LENGTH} characters.` };
  }
  return { ok: true, error: null };
}

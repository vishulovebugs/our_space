/**
 * Terminal chat input: one line in, one action out.
 *
 * Pure data, no DOM and no network, so the overlay and the server can agree on
 * what a line means. "/t <message>" sends, "/q" quits, everything else is
 * ignored. Commands are case-insensitive.
 */

/** Longest message the server accepts, in characters. */
export const CHAT_MESSAGE_MAX = 280;

/**
 * @param {unknown} text
 * @returns {{ type: "send", message: string } | { type: "quit" } | { type: "ignore" }}
 */
export function parseInput(text) {
  if (typeof text !== "string") return { type: "ignore" };

  const line = text.trim();

  if (/^\/q$/i.test(line)) return { type: "quit" };

  const send = /^\/t(?:\s+([\s\S]*))?$/i.exec(line);
  if (!send) return { type: "ignore" };

  const message = (send[1] ?? "").trim().slice(0, CHAT_MESSAGE_MAX).trim();

  return message === "" ? { type: "ignore" } : { type: "send", message };
}

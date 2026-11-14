/**
 * YouTube links, reduced to the one thing the embed player needs: an
 * 11-character video id. The server runs this too, so a client cannot smuggle
 * anything but a real video id into the TV state.
 */

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * @param {unknown} input
 * @returns {string | null} the video id, or null when the link is not a single
 *   YouTube video
 */
export function parseYouTubeUrl(input) {
  if (typeof input !== "string") return null;

  const text = input.trim();
  if (text === "") return null;

  let url;
  try {
    // A pasted link usually has no scheme; "javascript:" and friends keep
    // theirs and are rejected by the protocol check below.
    url = new URL(SCHEME.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");

  if (host === "youtu.be") return idFromPath(url.pathname);

  // Anything else - including lookalikes such as youtube.com.evil.com - is out.
  if (host !== "youtube.com") return null;

  if (url.pathname === "/watch") return asVideoId(url.searchParams.get("v"));

  const short = /^\/(?:shorts|embed)\/([^/]+)\/?$/.exec(url.pathname);

  return short ? asVideoId(short[1]) : null;
}

function idFromPath(pathname) {
  const match = /^\/([^/]+)\/?$/.exec(pathname);

  return match ? asVideoId(match[1]) : null;
}

function asVideoId(value) {
  return typeof value === "string" && VIDEO_ID.test(value) ? value : null;
}

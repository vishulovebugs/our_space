import { describe, expect, it } from "vitest";

import { parseYouTubeUrl } from "./youtube.js";

const ID = "dQw4w9WgXcQ";

describe("parseYouTubeUrl", () => {
  it("accepts every supported link shape", () => {
    const valid = [
      `https://www.youtube.com/watch?v=${ID}`,
      `http://youtube.com/watch?v=${ID}`,
      `https://youtube.com/watch?v=${ID}&list=PL123&index=4`,
      `https://m.youtube.com/watch?v=${ID}&t=42s`,
      `https://youtu.be/${ID}`,
      `https://www.youtu.be/${ID}?t=10`,
      `https://youtube.com/shorts/${ID}`,
      `https://www.youtube.com/shorts/${ID}?feature=share`,
      `https://youtube.com/embed/${ID}`,
      `https://www.youtube.com/embed/${ID}?rel=0`,
      `youtube.com/watch?v=${ID}`,
      `  https://youtu.be/${ID}  `,
    ];

    for (const input of valid) {
      expect(parseYouTubeUrl(input), input).toBe(ID);
    }
  });

  it("rejects everything that is not a single YouTube video", () => {
    const invalid = [
      "",
      "   ",
      "hello",
      null,
      undefined,
      42,
      `https://vimeo.com/${ID}`,
      `https://youtube.com.evil.com/watch?v=${ID}`,
      `https://notyoutube.com/watch?v=${ID}`,
      "https://www.youtube.com/playlist?list=PL123",
      "https://www.youtube.com/watch?list=PL123",
      `https://youtu.be/${ID.slice(0, 10)}`,
      `https://youtu.be/${ID}extra`,
      "https://youtu.be/abc!@#$%^&*()",
      "javascript:alert(1)",
      `javascript:https://youtu.be/${ID}`,
      "https://www.youtube.com/",
      "https://www.youtube.com/watch",
      `https://www.youtube.com/embed/${ID}/extra`,
    ];

    for (const input of invalid) {
      expect(parseYouTubeUrl(input), String(input)).toBeNull();
    }
  });
});

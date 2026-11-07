import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Phaser's "main" points at its source, which needs the dev-only
      // phaser3spectorjs package. Use the ESM build that ships to browsers,
      // so Vite and Vitest resolve the same file.
      phaser: "phaser/dist/phaser.esm.js",
    },
  },
  // The client tests render React into a DOM, so vitest needs jsdom here.
  test: {
    environment: "jsdom",
    // jsdom cannot rasterise canvas; the mock stores pixels instead.
    setupFiles: ["./src/test/setup.js"],
  },
});

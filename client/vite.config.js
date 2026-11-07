import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // The client tests render React into a DOM, so vitest needs jsdom here.
  test: {
    environment: "jsdom",
    // jsdom cannot rasterise canvas; the mock stores pixels instead.
    setupFiles: ["./src/test/setup.js"],
  },
});

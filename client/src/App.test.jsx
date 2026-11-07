import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App.jsx";

vi.mock("./lib/supabase.js", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signOut: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      }),
      update: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }),
  },
}));

afterEach(cleanup);

describe("App", () => {
  it("renders the Pixel Hall title", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Pixel Hall" })).toBeDefined();
  });
});

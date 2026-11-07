import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Login from "./Login.jsx";

const mocks = vi.hoisted(() => ({
  profileEq: vi.fn(),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock("../lib/supabase.js", () => ({
  supabase: {
    auth: {
      signUp: mocks.signUp,
      signInWithPassword: mocks.signInWithPassword,
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
    from: () => ({
      select: () => ({ eq: mocks.profileEq }),
      insert: vi.fn(),
    }),
  },
}));

beforeEach(() => {
  mocks.profileEq.mockReset().mockResolvedValue({ data: [], error: null });
  mocks.signUp.mockReset();
  mocks.signInWithPassword.mockReset();
});

afterEach(cleanup);

function fill(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function openCreateForm() {
  render(<Login onSignedIn={vi.fn()} />);
  fireEvent.click(screen.getByRole("tab", { name: "Create account" }));
}

describe("Login", () => {
  it("switches between sign in and create account", () => {
    render(<Login onSignedIn={vi.fn()} />);

    expect(screen.queryByLabelText("Username")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Create account" }));
    expect(screen.getByLabelText("Username")).toBeDefined();

    fireEvent.click(screen.getByRole("tab", { name: "Sign in" }));
    expect(screen.queryByLabelText("Username")).toBeNull();
  });

  it("shows an error for an invalid username and disables submit", () => {
    openCreateForm();

    fill("Username", "ab");
    fill("Email", "player@example.com");
    fill("Password", "longenough");

    expect(screen.getByText("3-16 characters, letters, numbers or underscore.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Create account" }).disabled).toBe(true);
  });

  it("reports a taken username and does not call signUp", async () => {
    mocks.profileEq.mockResolvedValue({ data: [{ username: "pixel_cat" }], error: null });
    openCreateForm();

    fill("Username", "pixel_cat");
    fill("Email", "player@example.com");
    fill("Password", "longenough");

    expect(await screen.findByText("Username taken")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
});

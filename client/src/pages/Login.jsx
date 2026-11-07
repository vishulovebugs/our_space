import { useEffect, useState } from "react";

import { validatePassword, validateUsername } from "@pixel-hall/shared/validators.js";

import { supabase } from "../lib/supabase.js";

// Long enough that typing a username does not fire one query per keystroke.
const CHECK_DELAY_MS = 300;

export default function Login({ onSignedIn }) {
  const [mode, setMode] = useState("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [taken, setTaken] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isCreate = mode === "create";
  const usernameCheck = validateUsername(username);
  const passwordCheck = validatePassword(password);

  // Live availability check. citext makes `eq` case-insensitive, so "Pixel_Cat"
  // and "pixel_cat" collide as intended.
  useEffect(() => {
    if (!isCreate || !usernameCheck.ok) {
      setTaken(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data, error: lookupError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username);

      if (cancelled || lookupError) return;
      setTaken((data ?? []).length > 0);
    }, CHECK_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isCreate, username, usernameCheck.ok]);

  const canSubmit = isCreate
    ? usernameCheck.ok && passwordCheck.ok && email !== "" && !taken && !busy
    : email !== "" && password !== "" && !busy;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError("");

    try {
      if (isCreate) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          // Read back by the server as the username claim once sessions exist.
          options: { data: { username } },
        });
        if (signUpError) return setError(signUpError.message);
        if (!data.session) return setError("Confirm your email, then sign in.");

        const { error: profileError } = await supabase
          .from("profiles")
          .insert({ id: data.session.user.id, username });
        if (profileError) return setError(profileError.message);

        onSignedIn(data.session);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) return setError(signInError.message);

        onSignedIn(data.session);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="screen">
      <h1>Pixel Hall</h1>

      <div className="tabs" role="tablist" aria-label="Sign in or create an account">
        <button
          type="button"
          role="tab"
          aria-selected={!isCreate}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isCreate}
          onClick={() => setMode("create")}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {isCreate && (
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              value={username}
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value)}
            />
            {username !== "" && !usernameCheck.ok && (
              <span className="error">{usernameCheck.error}</span>
            )}
            {taken && <span className="error">Username taken</span>}
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            autoComplete={isCreate ? "new-password" : "current-password"}
            onChange={(event) => setPassword(event.target.value)}
          />
          {isCreate && password !== "" && !passwordCheck.ok && (
            <span className="error">{passwordCheck.error}</span>
          )}
        </div>

        {error !== "" && <p className="error">{error}</p>}

        <button type="submit" disabled={!canSubmit}>
          {isCreate ? "Create account" : "Sign in"}
        </button>
      </form>

      {isCreate && <p className="hint">Letters, numbers and underscore. Case does not matter.</p>}
    </main>
  );
}

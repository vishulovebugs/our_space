import { useEffect, useState } from "react";

import { nextScreen } from "@pixel-hall/shared/character.js";

import CharacterCreator from "./pages/CharacterCreator.jsx";
import Login from "./pages/Login.jsx";
import Welcome from "./pages/Welcome.jsx";
import { supabase } from "./lib/supabase.js";

async function loadProfile(userId) {
  const { data } = await supabase
    .from("profiles")
    .select("username, character")
    .eq("id", userId)
    .single();

  return data ?? {};
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  // Supabase persists the session in localStorage; this restores it on reload.
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const stored = data.session ?? null;
      setSession(stored);
      if (stored) setProfile(await loadProfile(stored.user.id));
      setReady(true);
    });
  }, []);

  async function handleSignedIn(nextSession) {
    setSession(nextSession);
    setProfile(await loadProfile(nextSession.user.id));
  }

  async function handleSaveCharacter(character) {
    const { error } = await supabase
      .from("profiles")
      .update({ character })
      .eq("id", session.user.id);

    if (!error) setProfile((current) => ({ ...current, character }));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  if (!ready) return null;
  if (!session) return <Login onSignedIn={handleSignedIn} />;

  if (nextScreen(profile) === "creator") {
    return <CharacterCreator initialCharacter={profile?.character} onSave={handleSaveCharacter} />;
  }

  return (
    <Welcome
      username={profile?.username ?? session.user.user_metadata?.username ?? session.user.email}
      onLogout={handleLogout}
    />
  );
}

import { useEffect, useState } from "react";

import Login from "./pages/Login.jsx";
import Welcome from "./pages/Welcome.jsx";
import { supabase } from "./lib/supabase.js";

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  // Supabase persists the session in localStorage; this restores it on reload.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  if (!session) return <Login onSignedIn={setSession} />;

  return (
    <Welcome
      username={session.user.user_metadata?.username ?? session.user.email}
      onLogout={async () => {
        await supabase.auth.signOut();
        setSession(null);
      }}
    />
  );
}

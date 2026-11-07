import { createClient } from "@supabase/supabase-js";

/**
 * Reads the signed-in player's profile using the anon key plus the user's own
 * access token, so row level security decides what is visible. No service-role
 * key is used or needed.
 */
export async function loadProfile(token, userId) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set to load profiles");
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase
    .from("profiles")
    .select("username, character")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Could not load profile: ${error.message}`);
  }

  return data ?? {};
}

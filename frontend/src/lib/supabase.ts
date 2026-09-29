import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function getSupabaseClient() {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("Supabase Storage is not configured in the frontend environment.");
  }
  client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

import { createBrowserClient } from "@supabase/ssr";

// Client Supabase pour le NAVIGATEUR (composants côté client).
// Utilise la clé "publishable" : sans danger car la RLS protège les données.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

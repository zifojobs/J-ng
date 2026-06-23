import { createClient } from "@supabase/supabase-js";

// Client Supabase ADMINISTRATEUR — utilise la clé SECRÈTE.
// ⚠️ À n'utiliser QUE côté serveur (jamais dans un composant client).
// Il sert à créer des comptes (élèves, parents, admins) sans email de confirmation.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

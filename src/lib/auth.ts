import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profil = {
  id: string;
  prenom: string;
  nom: string;
  role: string;
  ecole_id: string | null;
};

// Récupère l'utilisateur connecté et son profil.
// Redirige vers /login si personne n'est connecté.
export async function requireProfil() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profil } = await supabase
    .from("profils")
    .select("id, prenom, nom, role, ecole_id")
    .eq("id", user.id)
    .single<Profil>();

  if (!profil) {
    redirect("/login");
  }

  return { supabase, user, profil };
}

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
//
// Option `ignorerSuspension` : par défaut (false), si l'école de l'utilisateur
// est suspendue, on l'envoie vers l'écran « /suspendu ». La page /suspendu
// elle-même passe `true` pour ne pas boucler à l'infini.
export async function requireProfil(options?: { ignorerSuspension?: boolean }) {
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

  // Robinet d'abonnement : une école suspendue ne donne plus accès à ses
  // utilisateurs. Le super-admin (sans école) n'est jamais bloqué.
  if (
    !options?.ignorerSuspension &&
    profil.role !== "super_admin" &&
    profil.ecole_id
  ) {
    const { data: ecole } = await supabase
      .from("ecoles")
      .select("statut")
      .eq("id", profil.ecole_id)
      .single<{ statut: string }>();

    if (ecole?.statut === "suspendu") {
      redirect("/suspendu");
    }
  }

  return { supabase, user, profil };
}

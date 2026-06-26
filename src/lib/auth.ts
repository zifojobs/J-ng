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

  // Robinet d'abonnement : on bloque si l'école est suspendue (manuel) OU si sa
  // date d'échéance est dépassée (automatique). Le super-admin n'est jamais bloqué.
  if (
    !options?.ignorerSuspension &&
    profil.role !== "super_admin" &&
    profil.ecole_id
  ) {
    const { data: ecole } = await supabase
      .from("ecoles")
      .select("statut, date_echeance")
      .eq("id", profil.ecole_id)
      .single<{ statut: string; date_echeance: string | null }>();

    // "fr-CA" donne AAAA-MM-JJ, directement comparable à une date stockée.
    const aujourdhui = new Date().toLocaleDateString("fr-CA");
    const echeanceDepassee =
      !!ecole?.date_echeance && ecole.date_echeance < aujourdhui;

    if (ecole?.statut === "suspendu" || echeanceDepassee) {
      redirect("/suspendu");
    }
  }

  return { supabase, user, profil };
}

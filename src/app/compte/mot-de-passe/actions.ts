"use server";

import { redirect } from "next/navigation";
import { requireProfil } from "@/lib/auth";

// Change le mot de passe de l'utilisateur CONNECTÉ (tous rôles). On agit sur la
// session en cours : Supabase met à jour le mot de passe du compte authentifié,
// pas besoin de flux email.
export async function changerMonMotDePasse(formData: FormData) {
  const { supabase } = await requireProfil();

  const nouveau = String(formData.get("nouveau") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  const echec = (msg: string) =>
    redirect("/compte/mot-de-passe?erreur=" + encodeURIComponent(msg));

  if (nouveau.length < 6) {
    echec("Le mot de passe doit faire au moins 6 caractères.");
  }
  if (nouveau !== confirmation) {
    echec("Les deux mots de passe ne correspondent pas.");
  }

  const { error } = await supabase.auth.updateUser({ password: nouveau });
  if (error) {
    echec("Impossible de changer le mot de passe. Réessayez.");
  }

  redirect("/compte/mot-de-passe?succes=1");
}

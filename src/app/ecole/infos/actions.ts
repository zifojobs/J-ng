"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";

// Enregistre les coordonnées de l'école de l'admin connecté.
// On ne touche QUE les colonnes de coordonnées (jamais le nom, le slug ou le
// statut), et la RLS garantit qu'on ne modifie que SA propre école.
export async function enregistrerCoordonnees(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const adresse = String(formData.get("adresse") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const directeur = String(formData.get("directeur") ?? "").trim();

  // Champs facultatifs : vide -> null (on n'affiche rien sur le bulletin).
  const { error } = await supabase
    .from("ecoles")
    .update({
      adresse: adresse || null,
      telephone: telephone || null,
      directeur: directeur || null,
    })
    .eq("id", profil.ecole_id);

  if (error) {
    redirect("/ecole/infos?erreur=" + encodeURIComponent("Impossible d'enregistrer les coordonnées."));
  }

  revalidatePath("/ecole/infos");
  redirect("/ecole/infos?succes=" + encodeURIComponent("Coordonnées enregistrées."));
}

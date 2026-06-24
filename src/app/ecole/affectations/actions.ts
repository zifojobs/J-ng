"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";

// Ajoute une affectation (prof + matière + classe) à l'école de l'admin connecté.
export async function ajouterAffectation(formData: FormData) {
  // Sécurité : réservé à l'admin d'école.
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const professeurId = String(formData.get("professeur_id") ?? "").trim();
  const matiereId = String(formData.get("matiere_id") ?? "").trim();
  const classeId = String(formData.get("classe_id") ?? "").trim();

  if (!professeurId || !matiereId || !classeId) {
    redirect(
      "/ecole/affectations?erreur=" +
        encodeURIComponent("Choisissez un professeur, une matière et une classe.")
    );
  }

  // ecole_id posé côté serveur depuis le profil (jamais depuis le navigateur).
  const { error } = await supabase.from("affectations").insert({
    ecole_id: profil.ecole_id,
    professeur_id: professeurId,
    matiere_id: matiereId,
    classe_id: classeId,
  });

  if (error) {
    redirect(
      "/ecole/affectations?erreur=" +
        encodeURIComponent("Impossible d'ajouter (cette affectation existe peut-être déjà).")
    );
  }

  revalidatePath("/ecole/affectations");
  redirect("/ecole/affectations?succes=" + encodeURIComponent("Affectation ajoutée."));
}

// Supprime une affectation (la RLS garantit qu'on ne touche que sa propre école).
export async function supprimerAffectation(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/ecole/affectations?erreur=" + encodeURIComponent("Affectation introuvable."));
  }

  const { error } = await supabase.from("affectations").delete().eq("id", id);

  if (error) {
    redirect(
      "/ecole/affectations?erreur=" +
        encodeURIComponent("Impossible de supprimer cette affectation.")
    );
  }

  revalidatePath("/ecole/affectations");
  redirect("/ecole/affectations?succes=" + encodeURIComponent("Affectation supprimée."));
}

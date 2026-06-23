"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";

// Ajoute une année scolaire à l'école de l'admin connecté.
export async function ajouterAnnee(formData: FormData) {
  // Sécurité : réservé à l'admin d'école.
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const libelle = String(formData.get("libelle") ?? "").trim();
  if (!libelle) {
    redirect("/ecole/annees?erreur=" + encodeURIComponent("Le libellé de l'année est obligatoire."));
  }

  // ecole_id posé côté serveur depuis le profil (jamais depuis le navigateur).
  const { error } = await supabase.from("annees_scolaires").insert({
    ecole_id: profil.ecole_id,
    libelle,
  });

  if (error) {
    redirect("/ecole/annees?erreur=" + encodeURIComponent("Impossible d'ajouter (cette année existe peut-être déjà)."));
  }

  revalidatePath("/ecole/annees");
  redirect("/ecole/annees?succes=" + encodeURIComponent(`Année « ${libelle} » ajoutée.`));
}

// Rend une année "active" (l'année en cours) ; désactive les autres d'abord.
export async function definirAnneeActive(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/ecole/annees?erreur=" + encodeURIComponent("Année introuvable."));
  }

  // 1) Désactiver toutes les années de l'école (évite d'avoir deux années actives).
  const { error: erreurReset } = await supabase
    .from("annees_scolaires")
    .update({ active: false })
    .eq("ecole_id", profil.ecole_id);

  if (erreurReset) {
    redirect("/ecole/annees?erreur=" + encodeURIComponent("Impossible de mettre à jour l'année active."));
  }

  // 2) Activer celle choisie.
  const { error: erreurSet } = await supabase
    .from("annees_scolaires")
    .update({ active: true })
    .eq("id", id);

  if (erreurSet) {
    redirect("/ecole/annees?erreur=" + encodeURIComponent("Impossible de définir cette année comme active."));
  }

  revalidatePath("/ecole/annees");
  redirect("/ecole/annees?succes=" + encodeURIComponent("Année active mise à jour."));
}

// Supprime une année scolaire (la RLS garantit qu'on ne touche que sa propre école).
export async function supprimerAnnee(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/ecole/annees?erreur=" + encodeURIComponent("Année introuvable."));
  }

  const { error } = await supabase.from("annees_scolaires").delete().eq("id", id);

  if (error) {
    redirect("/ecole/annees?erreur=" + encodeURIComponent("Impossible de supprimer cette année."));
  }

  revalidatePath("/ecole/annees");
  redirect("/ecole/annees?succes=" + encodeURIComponent("Année supprimée."));
}

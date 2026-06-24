"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";

// Ajoute une classe (rattachée à une année scolaire) à l'école de l'admin connecté.
export async function ajouterClasse(formData: FormData) {
  // Sécurité : réservé à l'admin d'école.
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const nom = String(formData.get("nom") ?? "").trim();
  const anneeScolaireId = String(formData.get("annee_scolaire_id") ?? "").trim();

  if (!anneeScolaireId) {
    redirect("/ecole/classes?erreur=" + encodeURIComponent("Choisissez d'abord une année scolaire."));
  }
  if (!nom) {
    redirect(
      "/ecole/classes?annee=" + anneeScolaireId +
      "&erreur=" + encodeURIComponent("Le nom de la classe est obligatoire.")
    );
  }

  // ecole_id posé côté serveur depuis le profil (jamais depuis le navigateur).
  const { error } = await supabase.from("classes").insert({
    ecole_id: profil.ecole_id,
    annee_scolaire_id: anneeScolaireId,
    nom,
  });

  if (error) {
    redirect(
      "/ecole/classes?annee=" + anneeScolaireId +
      "&erreur=" + encodeURIComponent("Impossible d'ajouter (cette classe existe peut-être déjà).")
    );
  }

  revalidatePath("/ecole/classes");
  redirect(
    "/ecole/classes?annee=" + anneeScolaireId +
    "&succes=" + encodeURIComponent(`Classe « ${nom} » ajoutée.`)
  );
}

// Supprime une classe (la RLS garantit qu'on ne touche que sa propre école).
export async function supprimerClasse(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  const anneeScolaireId = String(formData.get("annee_scolaire_id") ?? "").trim();
  if (!id) {
    redirect("/ecole/classes?erreur=" + encodeURIComponent("Classe introuvable."));
  }

  const { error } = await supabase.from("classes").delete().eq("id", id);

  if (error) {
    redirect(
      "/ecole/classes?annee=" + anneeScolaireId +
      "&erreur=" + encodeURIComponent("Impossible de supprimer cette classe.")
    );
  }

  revalidatePath("/ecole/classes");
  redirect(
    "/ecole/classes?annee=" + anneeScolaireId +
    "&succes=" + encodeURIComponent("Classe supprimée.")
  );
}

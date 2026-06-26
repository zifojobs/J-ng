"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";

// Crée un devoir pour une affectation (matière + classe) du prof connecté.
export async function ajouterDevoir(formData: FormData) {
  // Sécurité : réservé aux professeurs.
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "professeur" || !profil.ecole_id) {
    redirect("/login");
  }

  const affectationId = String(formData.get("affectation_id") ?? "").trim();
  const titre = String(formData.get("titre") ?? "").trim();
  const consigne = String(formData.get("consigne") ?? "").trim();
  const datePourLe = String(formData.get("date_pour_le") ?? "").trim();

  const base = "/espace/devoirs/" + affectationId;
  const echec = (msg: string) => redirect(base + "?erreur=" + encodeURIComponent(msg));

  if (!affectationId) echec("Affectation introuvable.");
  if (!titre) echec("Donnez un titre au devoir.");
  if (titre.length > 200) echec("Le titre est trop long (200 caractères max).");
  if (consigne.length > 2000) echec("La consigne est trop longue (2000 caractères max).");

  // ecole_id posé côté serveur. La RLS vérifie que l'affectation est bien
  // celle de ce prof (il ne peut donner un devoir que via SES affectations).
  const { error } = await supabase.from("devoirs").insert({
    ecole_id: profil.ecole_id,
    affectation_id: affectationId,
    titre,
    consigne: consigne || null,
    date_pour_le: datePourLe || null,
  });

  if (error) {
    echec("Impossible d'enregistrer le devoir.");
  }

  revalidatePath(base);
  redirect(base + "?succes=" + encodeURIComponent("Devoir enregistré."));
}

// Supprime un devoir (la RLS garantit que seul le prof de l'affectation le peut).
export async function supprimerDevoir(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "professeur" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  const affectationId = String(formData.get("affectation_id") ?? "").trim();
  const base = "/espace/devoirs/" + affectationId;

  if (!id) redirect(base + "?erreur=" + encodeURIComponent("Devoir introuvable."));

  const { error } = await supabase.from("devoirs").delete().eq("id", id);

  if (error) {
    redirect(base + "?erreur=" + encodeURIComponent("Impossible de supprimer ce devoir."));
  }

  revalidatePath(base);
  redirect(base + "?succes=" + encodeURIComponent("Devoir supprimé."));
}

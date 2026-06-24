"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";

// Ajoute une note à un élève, pour une affectation du prof connecté.
export async function ajouterNote(formData: FormData) {
  // Sécurité : réservé aux professeurs.
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "professeur" || !profil.ecole_id) {
    redirect("/login");
  }

  const affectationId = String(formData.get("affectation_id") ?? "").trim();
  const eleveId = String(formData.get("eleve_id") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const titre = String(formData.get("titre") ?? "").trim();
  const valeurBrute = String(formData.get("valeur") ?? "").trim().replace(",", ".");
  const coefBrut = String(formData.get("coefficient") ?? "").trim().replace(",", ".");
  const dateEval = String(formData.get("date_evaluation") ?? "").trim();

  const base = "/espace/notes/" + affectationId;
  const echec = (msg: string) => redirect(base + "?erreur=" + encodeURIComponent(msg));

  if (!affectationId || !eleveId) echec("Choisissez un élève.");
  if (type !== "devoir" && type !== "composition") echec("Choisissez le type d'évaluation.");

  const valeur = Number(valeurBrute);
  if (!Number.isFinite(valeur) || valeur < 0 || valeur > 20) {
    echec("La note doit être un nombre entre 0 et 20.");
  }

  const coefficient = coefBrut ? Number(coefBrut) : 1;
  if (!Number.isFinite(coefficient) || coefficient <= 0) {
    echec("Le coefficient doit être un nombre supérieur à 0.");
  }

  // ecole_id posé côté serveur. La RLS vérifie que l'affectation est bien
  // celle de ce prof (il ne peut noter que via SES affectations).
  const { error } = await supabase.from("notes").insert({
    ecole_id: profil.ecole_id,
    affectation_id: affectationId,
    eleve_id: eleveId,
    type,
    titre: titre || null,
    valeur,
    coefficient,
    date_evaluation: dateEval || undefined,
  });

  if (error) {
    echec("Impossible d'enregistrer la note.");
  }

  revalidatePath(base);
  redirect(base + "?succes=" + encodeURIComponent("Note enregistrée."));
}

// Supprime une note (la RLS garantit que seul le prof de l'affectation le peut).
export async function supprimerNote(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "professeur" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  const affectationId = String(formData.get("affectation_id") ?? "").trim();
  const base = "/espace/notes/" + affectationId;

  if (!id) redirect(base + "?erreur=" + encodeURIComponent("Note introuvable."));

  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) {
    redirect(base + "?erreur=" + encodeURIComponent("Impossible de supprimer cette note."));
  }

  revalidatePath(base);
  redirect(base + "?succes=" + encodeURIComponent("Note supprimée."));
}

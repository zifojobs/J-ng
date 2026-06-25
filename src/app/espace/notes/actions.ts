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
  const semestre = Number(String(formData.get("semestre") ?? "1").trim());
  const titre = String(formData.get("titre") ?? "").trim();
  const valeurBrute = String(formData.get("valeur") ?? "").trim().replace(",", ".");
  const dateEval = String(formData.get("date_evaluation") ?? "").trim();

  const base = "/espace/notes/" + affectationId;
  const echec = (msg: string) => redirect(base + "?erreur=" + encodeURIComponent(msg));

  if (!affectationId || !eleveId) echec("Choisissez un élève.");
  if (type !== "devoir" && type !== "composition") echec("Choisissez le type d'évaluation.");
  if (semestre !== 1 && semestre !== 2) echec("Choisissez le semestre.");

  const valeur = Number(valeurBrute);
  if (!Number.isFinite(valeur) || valeur < 0 || valeur > 20) {
    echec("La note doit être un nombre entre 0 et 20.");
  }

  // ecole_id posé côté serveur. La RLS vérifie que l'affectation est bien
  // celle de ce prof (il ne peut noter que via SES affectations).
  const { error } = await supabase.from("notes").insert({
    ecole_id: profil.ecole_id,
    affectation_id: affectationId,
    eleve_id: eleveId,
    type,
    semestre,
    titre: titre || null,
    valeur,
    date_evaluation: dateEval || undefined,
  });

  if (error) {
    echec("Impossible d'enregistrer la note.");
  }

  revalidatePath(base);
  redirect(base + "?succes=" + encodeURIComponent("Note enregistrée."));
}

// Enregistre (ou efface) l'appréciation d'un élève pour une matière + semestre.
// Texte vide = on retire l'appréciation existante ; sinon on crée/met à jour.
export async function enregistrerAppreciation(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "professeur" || !profil.ecole_id) {
    redirect("/login");
  }

  const affectationId = String(formData.get("affectation_id") ?? "").trim();
  const eleveId = String(formData.get("eleve_id") ?? "").trim();
  const semestre = Number(String(formData.get("semestre") ?? "1").trim());
  const texte = String(formData.get("texte") ?? "").trim();

  const base = "/espace/notes/" + affectationId;
  const retour = (params: string) => redirect(base + "?app_semestre=" + semestre + "&" + params);
  const echec = (msg: string) => retour("erreur=" + encodeURIComponent(msg));

  if (!affectationId || !eleveId) echec("Élève introuvable.");
  if (semestre !== 1 && semestre !== 2) echec("Choisissez le semestre.");
  if (texte.length > 500) echec("L'appréciation est trop longue (500 caractères max).");

  // Texte vide : on supprime l'appréciation si elle existait.
  if (!texte) {
    const { error } = await supabase
      .from("appreciations")
      .delete()
      .eq("affectation_id", affectationId)
      .eq("eleve_id", eleveId)
      .eq("semestre", semestre);
    if (error) echec("Impossible d'effacer l'appréciation.");
    revalidatePath(base);
    retour("succes=" + encodeURIComponent("Appréciation effacée."));
  }

  // ecole_id posé côté serveur. La RLS vérifie que l'affectation est bien
  // celle de ce prof. onConflict = la contrainte d'unicité (une par trio).
  const { error } = await supabase.from("appreciations").upsert(
    {
      ecole_id: profil.ecole_id,
      affectation_id: affectationId,
      eleve_id: eleveId,
      semestre,
      texte,
    },
    { onConflict: "affectation_id,eleve_id,semestre" }
  );

  if (error) echec("Impossible d'enregistrer l'appréciation.");

  revalidatePath(base);
  retour("succes=" + encodeURIComponent("Appréciation enregistrée."));
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

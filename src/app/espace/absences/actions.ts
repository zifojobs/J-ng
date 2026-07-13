"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";

// Enregistre (ou ré-enregistre) l'appel d'un cours pour une journée donnée.
// Principe : on remplace les lignes du jour. On supprime d'abord toutes les
// absences de cette affectation à cette date, puis on ré-insère uniquement les
// élèves marqués « absent » ou « retard » (les autres sont présents par défaut).
export async function enregistrerAppel(formData: FormData) {
  // Sécurité : réservé aux professeurs.
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "professeur" || !profil.ecole_id) {
    redirect("/login");
  }

  const affectationId = String(formData.get("affectation_id") ?? "").trim();
  const dateAbsence = String(formData.get("date_absence") ?? "").trim();
  const elevesIds = String(formData.get("eleve_ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const base = "/espace/absences/" + affectationId;
  const echec = (msg: string) => redirect(base + "?erreur=" + encodeURIComponent(msg));

  if (!affectationId) echec("Affectation introuvable.");
  if (!dateAbsence) echec("Choisissez une date pour l'appel.");

  // On ne garde que les élèves marqués absent ou en retard.
  const aInserer = elevesIds
    .map((eleveId) => ({
      eleveId,
      statut: String(formData.get("statut_" + eleveId) ?? "present").trim(),
    }))
    .filter((e) => e.statut === "absent" || e.statut === "retard")
    .map((e) => ({
      ecole_id: profil.ecole_id,
      affectation_id: affectationId,
      eleve_id: e.eleveId,
      date_absence: dateAbsence,
      statut: e.statut,
    }));

  // 1) On efface l'appel existant de ce jour (la RLS limite au prof de l'affectation).
  const { error: errSuppr } = await supabase
    .from("absences")
    .delete()
    .eq("affectation_id", affectationId)
    .eq("date_absence", dateAbsence);

  if (errSuppr) echec("Impossible d'enregistrer l'appel.");

  // 2) On ré-insère les absents / retards du jour (s'il y en a).
  if (aInserer.length > 0) {
    const { error: errIns } = await supabase.from("absences").insert(aInserer);
    if (errIns) echec("Impossible d'enregistrer l'appel.");
  }

  revalidatePath(base);
  redirect(base + "?succes=" + encodeURIComponent("Appel enregistré."));
}

// Le parent justifie une absence de son enfant (met à jour justifie + motif).
// La RLS garantit qu'il ne peut toucher qu'une absence de SES enfants.
export async function justifierAbsence(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "parent") {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  const enfantId = String(formData.get("enfant_id") ?? "").trim();
  const motif = String(formData.get("motif") ?? "").trim();

  const base = "/espace/enfants/" + enfantId + "/absences";

  if (!id) redirect(base + "?erreur=" + encodeURIComponent("Absence introuvable."));

  // Liste fermée (doit rester en phase avec le <select> de ListeAbsences.tsx et
  // la contrainte SQL de la migration 0025). Empêche toute donnée de santé libre.
  const MOTIFS_AUTORISES = ["Familial", "Médical", "Autre"];
  if (!MOTIFS_AUTORISES.includes(motif)) {
    redirect(base + "?erreur=" + encodeURIComponent("Motif invalide."));
  }

  const { error } = await supabase
    .from("absences")
    .update({ justifie: true, motif: motif || null })
    .eq("id", id);

  if (error) {
    redirect(base + "?erreur=" + encodeURIComponent("Impossible d'enregistrer la justification."));
  }

  revalidatePath(base);
  redirect(base + "?succes=" + encodeURIComponent("Absence justifiée."));
}

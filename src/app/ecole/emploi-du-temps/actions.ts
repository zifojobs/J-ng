"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";

// Ajoute un créneau d'emploi du temps (une affectation placée un jour, à une heure).
export async function ajouterCreneau(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const affectationId = String(formData.get("affectation_id") ?? "").trim();
  const classeId = String(formData.get("classe_id") ?? "").trim();
  const jour = Number(String(formData.get("jour") ?? "").trim());
  const heureDebut = String(formData.get("heure_debut") ?? "").trim();
  const heureFin = String(formData.get("heure_fin") ?? "").trim();
  const salle = String(formData.get("salle") ?? "").trim();

  const base = "/ecole/emploi-du-temps?classe=" + classeId;
  const echec = (msg: string) => redirect(base + "&erreur=" + encodeURIComponent(msg));

  if (!affectationId) echec("Choisissez une matière (affectation).");
  if (!Number.isInteger(jour) || jour < 1 || jour > 6) echec("Choisissez un jour.");
  if (!heureDebut || !heureFin) echec("Indiquez l'heure de début et de fin.");
  if (heureFin <= heureDebut) echec("L'heure de fin doit être après l'heure de début.");

  // L'affectation doit appartenir à l'école de l'admin (la RLS limite déjà la
  // lecture à sa propre école : si elle est ailleurs, on ne la trouve pas).
  const { data: affectation } = await supabase
    .from("affectations")
    .select("id")
    .eq("id", affectationId)
    .maybeSingle();
  if (!affectation) echec("Cette affectation est introuvable.");

  const { error } = await supabase.from("creneaux").insert({
    ecole_id: profil.ecole_id,
    affectation_id: affectationId,
    jour,
    heure_debut: heureDebut,
    heure_fin: heureFin,
    salle: salle || null,
  });

  if (error) echec("Impossible d'ajouter ce créneau.");

  revalidatePath(base);
  redirect(base + "&succes=" + encodeURIComponent("Créneau ajouté."));
}

// Supprime un créneau (la RLS garantit qu'on ne touche que sa propre école).
export async function supprimerCreneau(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  const classeId = String(formData.get("classe_id") ?? "").trim();
  const base = "/ecole/emploi-du-temps?classe=" + classeId;

  if (!id) redirect(base + "&erreur=" + encodeURIComponent("Créneau introuvable."));

  const { error } = await supabase.from("creneaux").delete().eq("id", id);

  if (error) redirect(base + "&erreur=" + encodeURIComponent("Impossible de supprimer."));

  revalidatePath(base);
  redirect(base + "&succes=" + encodeURIComponent("Créneau supprimé."));
}

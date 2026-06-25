"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";

// Ajoute une matière à l'école de l'admin connecté.
export async function ajouterMatiere(formData: FormData) {
  // Sécurité : réservé à l'admin d'école.
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const nom = String(formData.get("nom") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const coefficientBrut = String(formData.get("coefficient_defaut") ?? "1").trim();
  const coefficient = Number(coefficientBrut.replace(",", "."));

  if (!nom) {
    redirect("/ecole/matieres?erreur=" + encodeURIComponent("Le nom de la matière est obligatoire."));
  }
  if (!Number.isFinite(coefficient) || coefficient <= 0) {
    redirect("/ecole/matieres?erreur=" + encodeURIComponent("Le coefficient doit être un nombre supérieur à 0."));
  }

  // ecole_id posé côté serveur depuis le profil (jamais depuis le navigateur).
  const { error } = await supabase.from("matieres").insert({
    ecole_id: profil.ecole_id,
    nom,
    code: code || null,
    coefficient_defaut: coefficient,
  });

  if (error) {
    redirect("/ecole/matieres?erreur=" + encodeURIComponent("Impossible d'ajouter (cette matière existe peut-être déjà)."));
  }

  revalidatePath("/ecole/matieres");
  redirect("/ecole/matieres?succes=" + encodeURIComponent(`Matière « ${nom} » ajoutée.`));
}

// Modifie le coefficient d'une matière existante.
export async function modifierCoefficient(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  const coefficient = Number(String(formData.get("coefficient_defaut") ?? "").trim().replace(",", "."));

  if (!id) {
    redirect("/ecole/matieres?erreur=" + encodeURIComponent("Matière introuvable."));
  }
  if (!Number.isFinite(coefficient) || coefficient <= 0) {
    redirect("/ecole/matieres?erreur=" + encodeURIComponent("Le coefficient doit être un nombre supérieur à 0."));
  }

  // La RLS garantit qu'on ne modifie qu'une matière de sa propre école.
  const { error } = await supabase
    .from("matieres")
    .update({ coefficient_defaut: coefficient })
    .eq("id", id);

  if (error) {
    redirect("/ecole/matieres?erreur=" + encodeURIComponent("Impossible de modifier le coefficient."));
  }

  revalidatePath("/ecole/matieres");
  redirect("/ecole/matieres?succes=" + encodeURIComponent("Coefficient mis à jour."));
}

// Supprime une matière (la RLS garantit qu'on ne touche que sa propre école).
export async function supprimerMatiere(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/ecole/matieres?erreur=" + encodeURIComponent("Matière introuvable."));
  }

  const { error } = await supabase.from("matieres").delete().eq("id", id);

  if (error) {
    redirect("/ecole/matieres?erreur=" + encodeURIComponent("Impossible de supprimer cette matière."));
  }

  revalidatePath("/ecole/matieres");
  redirect("/ecole/matieres?succes=" + encodeURIComponent("Matière supprimée."));
}

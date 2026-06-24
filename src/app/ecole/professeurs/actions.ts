"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Inscrit un professeur dans l'école de l'admin connecté :
// 1) crée son compte de connexion (email + mot de passe, confirmé directement),
// 2) crée son profil (rôle professeur) rattaché à l'école.
export async function ajouterProfesseur(formData: FormData) {
  // Sécurité : réservé à l'admin d'école.
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!prenom || !nom || !email || password.length < 6) {
    redirect(
      "/ecole/professeurs?erreur=" +
      encodeURIComponent("Champs manquants ou mot de passe trop court (min. 6 caractères).")
    );
  }

  // 1) Créer le compte (côté serveur, clé secrète, email confirmé directement).
  const admin = createAdminClient();
  const { data: userCree, error: erreurUser } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (erreurUser || !userCree?.user) {
    redirect(
      "/ecole/professeurs?erreur=" +
      encodeURIComponent("Impossible de créer le compte (email déjà utilisé ?).")
    );
  }

  // 2) Créer le profil du professeur, rattaché à l'école de l'admin.
  // ecole_id posé côté serveur depuis le profil (jamais depuis le navigateur).
  const { error: erreurProfil } = await supabase.from("profils").insert({
    id: userCree.user.id,
    ecole_id: profil.ecole_id,
    role: "professeur",
    prenom,
    nom,
    email,
  });

  if (erreurProfil) {
    // On annule le compte créé pour ne pas laisser de demi-création.
    await admin.auth.admin.deleteUser(userCree.user.id);
    redirect(
      "/ecole/professeurs?erreur=" +
      encodeURIComponent("Erreur lors de la création du profil professeur.")
    );
  }

  revalidatePath("/ecole/professeurs");
  redirect(
    "/ecole/professeurs?succes=" +
    encodeURIComponent(`Professeur ${prenom} ${nom} ajouté.`)
  );
}

// Supprime un professeur : on supprime son compte de connexion,
// ce qui supprime aussi son profil (lien "on delete cascade").
export async function supprimerProfesseur(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/ecole/professeurs?erreur=" + encodeURIComponent("Professeur introuvable."));
  }

  // Garde-fou : vérifier que ce profil est bien un professeur de SON école
  // (la RLS limite déjà la lecture à l'école de l'admin).
  const { data: cible } = await supabase
    .from("profils")
    .select("id, role")
    .eq("id", id)
    .single();

  if (!cible || cible.role !== "professeur") {
    redirect("/ecole/professeurs?erreur=" + encodeURIComponent("Professeur introuvable."));
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    redirect("/ecole/professeurs?erreur=" + encodeURIComponent("Impossible de supprimer ce professeur."));
  }

  revalidatePath("/ecole/professeurs");
  redirect("/ecole/professeurs?succes=" + encodeURIComponent("Professeur supprimé."));
}

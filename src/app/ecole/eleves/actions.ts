"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailTechnique } from "@/lib/identifiants";

// Inscrit un élève dans une classe de l'école de l'admin connecté :
// 1) crée son compte de connexion (matricule -> email technique, mot de passe),
// 2) crée son profil (rôle eleve) rattaché à l'école ET à la classe.
export async function ajouterEleve(formData: FormData) {
  // Sécurité : réservé à l'admin d'école.
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const matricule = String(formData.get("matricule") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const classeId = String(formData.get("classe_id") ?? "").trim();

  if (!classeId) {
    redirect("/ecole/eleves?erreur=" + encodeURIComponent("Choisissez d'abord une classe."));
  }
  const retour = "/ecole/eleves?classe=" + classeId;
  if (!prenom || !nom || !matricule || password.length < 6) {
    redirect(retour + "&erreur=" + encodeURIComponent("Champs manquants ou mot de passe trop court (min. 6 caractères)."));
  }

  // Garde-fou : la classe choisie appartient bien à MON école. La RLS limite la
  // lecture de `classes` aux classes de l'école de l'admin, donc si on retrouve
  // la ligne, c'est qu'elle est de la bonne école (empêche d'injecter l'UUID
  // d'une classe d'une autre école).
  const { data: classe } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classeId)
    .maybeSingle();
  if (!classe) {
    redirect(retour + "&erreur=" + encodeURIComponent("Classe introuvable."));
  }

  // Le slug de l'école sert à fabriquer l'email technique (RLS : sa propre école).
  const { data: ecole } = await supabase.from("ecoles").select("slug").single();
  if (!ecole?.slug) {
    redirect(retour + "&erreur=" + encodeURIComponent("École introuvable."));
  }

  const email = emailTechnique(matricule, ecole.slug);

  // 1) Créer le compte (côté serveur, clé secrète, email technique confirmé directement).
  const admin = createAdminClient();
  const { data: userCree, error: erreurUser } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (erreurUser || !userCree?.user) {
    redirect(retour + "&erreur=" + encodeURIComponent("Impossible de créer le compte (ce matricule est peut-être déjà pris)."));
  }

  // 2) Créer le profil de l'élève, rattaché à l'école et à la classe.
  // ecole_id posé côté serveur depuis le profil (jamais depuis le navigateur).
  const { error: erreurProfil } = await supabase.from("profils").insert({
    id: userCree.user.id,
    ecole_id: profil.ecole_id,
    role: "eleve",
    prenom,
    nom,
    identifiant: matricule,
    classe_id: classeId,
  });

  if (erreurProfil) {
    // On annule le compte créé pour ne pas laisser de demi-création.
    await admin.auth.admin.deleteUser(userCree.user.id);
    redirect(retour + "&erreur=" + encodeURIComponent("Erreur lors de la création de l'élève (matricule déjà utilisé ?)."));
  }

  revalidatePath("/ecole/eleves");
  redirect(retour + "&succes=" + encodeURIComponent(`Élève ${prenom} ${nom} ajouté.`));
}

// Supprime un élève : on supprime son compte de connexion,
// ce qui supprime aussi son profil (lien "on delete cascade").
export async function supprimerEleve(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  const classeId = String(formData.get("classe_id") ?? "").trim();
  const retour = "/ecole/eleves?classe=" + classeId;
  if (!id) {
    redirect(retour + "&erreur=" + encodeURIComponent("Élève introuvable."));
  }

  // Garde-fou : vérifier que ce profil est bien un élève de SON école
  // (la RLS limite déjà la lecture à l'école de l'admin).
  const { data: cible } = await supabase
    .from("profils")
    .select("id, role")
    .eq("id", id)
    .single();

  if (!cible || cible.role !== "eleve") {
    redirect(retour + "&erreur=" + encodeURIComponent("Élève introuvable."));
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    redirect(retour + "&erreur=" + encodeURIComponent("Impossible de supprimer cet élève."));
  }

  revalidatePath("/ecole/eleves");
  redirect(retour + "&succes=" + encodeURIComponent("Élève supprimé."));
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailTechnique } from "@/lib/identifiants";

// Crée un compte parent (matricule -> email technique) et le lie à un enfant.
export async function ajouterParent(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const matricule = String(formData.get("matricule") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const eleveId = String(formData.get("eleve_id") ?? "").trim();

  const echec = (msg: string) =>
    redirect("/ecole/parents?erreur=" + encodeURIComponent(msg));

  if (!prenom || !nom || !matricule || password.length < 6) {
    echec("Champs manquants ou mot de passe trop court (min. 6 caractères).");
  }
  if (!eleveId) {
    echec("Choisissez l'enfant à rattacher à ce parent.");
  }

  const { data: ecole } = await supabase.from("ecoles").select("slug").single();
  if (!ecole?.slug) echec("École introuvable.");

  const email = emailTechnique(matricule, ecole!.slug);

  // 1) Créer le compte (côté serveur, email technique confirmé directement).
  const admin = createAdminClient();
  const { data: userCree, error: erreurUser } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (erreurUser || !userCree?.user) {
    echec("Impossible de créer le compte (ce matricule est peut-être déjà pris).");
    return;
  }
  const parentUserId = userCree.user.id;

  // 2) Créer le profil parent.
  const { error: erreurProfil } = await supabase.from("profils").insert({
    id: parentUserId,
    ecole_id: profil.ecole_id,
    role: "parent",
    prenom,
    nom,
    identifiant: matricule,
  });
  if (erreurProfil) {
    await admin.auth.admin.deleteUser(parentUserId);
    echec("Erreur lors de la création du parent (matricule déjà utilisé ?).");
  }

  // 3) Lier le parent à l'enfant choisi.
  const { error: erreurLien } = await supabase.from("parents_eleves").insert({
    ecole_id: profil.ecole_id,
    parent_id: parentUserId,
    eleve_id: eleveId,
  });
  if (erreurLien) {
    echec("Parent créé, mais le lien avec l'enfant a échoué.");
  }

  revalidatePath("/ecole/parents");
  redirect("/ecole/parents?succes=" + encodeURIComponent(`Parent ${prenom} ${nom} ajouté.`));
}

// Lie un enfant supplémentaire à un parent existant.
export async function lierEnfant(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const parentId = String(formData.get("parent_id") ?? "").trim();
  const eleveId = String(formData.get("eleve_id") ?? "").trim();
  const echec = (msg: string) =>
    redirect("/ecole/parents?erreur=" + encodeURIComponent(msg));

  if (!parentId || !eleveId) echec("Choisissez un enfant à rattacher.");

  const { error } = await supabase.from("parents_eleves").insert({
    ecole_id: profil.ecole_id,
    parent_id: parentId,
    eleve_id: eleveId,
  });
  if (error) echec("Impossible de rattacher (cet enfant est peut-être déjà lié).");

  revalidatePath("/ecole/parents");
  redirect("/ecole/parents?succes=" + encodeURIComponent("Enfant rattaché."));
}

// Retire un lien parent ↔ enfant (sans supprimer le compte parent).
export async function delierEnfant(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/ecole/parents?erreur=" + encodeURIComponent("Lien introuvable."));

  const { error } = await supabase.from("parents_eleves").delete().eq("id", id);
  if (error) {
    redirect("/ecole/parents?erreur=" + encodeURIComponent("Impossible de retirer ce lien."));
  }

  revalidatePath("/ecole/parents");
  redirect("/ecole/parents?succes=" + encodeURIComponent("Lien retiré."));
}

// Supprime un parent : on supprime son compte, ce qui supprime son profil
// et ses liens (on delete cascade).
export async function supprimerParent(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  const echec = (msg: string) =>
    redirect("/ecole/parents?erreur=" + encodeURIComponent(msg));
  if (!id) echec("Parent introuvable.");

  // Garde-fou : c'est bien un parent de SON école (RLS limite déjà la lecture).
  const { data: cible } = await supabase
    .from("profils")
    .select("id, role")
    .eq("id", id)
    .single();
  if (!cible || cible.role !== "parent") echec("Parent introuvable.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) echec("Impossible de supprimer ce parent.");

  revalidatePath("/ecole/parents");
  redirect("/ecole/parents?succes=" + encodeURIComponent("Parent supprimé."));
}

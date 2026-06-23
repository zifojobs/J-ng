"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Transforme "Collège Jàng de Dakar" -> "college-jang-de-dakar".
function slugify(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // enlève les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // remplace tout le reste par des tirets
    .replace(/^-+|-+$/g, ""); // enlève les tirets au début/fin
}

export async function creerEcoleEtAdmin(formData: FormData) {
  // Sécurité : seul le super-admin peut créer une école.
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "super_admin") {
    redirect("/login");
  }

  const nomEcole = String(formData.get("nom_ecole") ?? "").trim();
  const adminPrenom = String(formData.get("admin_prenom") ?? "").trim();
  const adminNom = String(formData.get("admin_nom") ?? "").trim();
  const adminEmail = String(formData.get("admin_email") ?? "").trim().toLowerCase();
  const adminPassword = String(formData.get("admin_password") ?? "");

  if (!nomEcole || !adminEmail || adminPassword.length < 6) {
    redirect("/super-admin?erreur=" + encodeURIComponent("Champs manquants ou mot de passe trop court (min. 6 caractères)."));
  }

  const slug = slugify(nomEcole);

  // 1) Créer l'école (autorisé par la RLS : super-admin).
  const { data: ecole, error: erreurEcole } = await supabase
    .from("ecoles")
    .insert({ nom: nomEcole, slug })
    .select("id")
    .single();

  if (erreurEcole || !ecole) {
    redirect("/super-admin?erreur=" + encodeURIComponent("Impossible de créer l'école (nom déjà utilisé ?)."));
  }

  // 2) Créer le compte de l'admin (côté serveur, email confirmé directement).
  const admin = createAdminClient();
  const { data: userCree, error: erreurUser } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (erreurUser || !userCree?.user) {
    // On annule l'école créée pour ne pas laisser de demi-création.
    await supabase.from("ecoles").delete().eq("id", ecole.id);
    redirect("/super-admin?erreur=" + encodeURIComponent("Impossible de créer l'admin (email déjà utilisé ?)."));
  }

  // 3) Créer le profil de l'admin, rattaché à son école.
  const { error: erreurProfil } = await supabase.from("profils").insert({
    id: userCree.user.id,
    ecole_id: ecole.id,
    role: "admin_ecole",
    prenom: adminPrenom,
    nom: adminNom,
    email: adminEmail,
  });

  if (erreurProfil) {
    await admin.auth.admin.deleteUser(userCree.user.id);
    await supabase.from("ecoles").delete().eq("id", ecole.id);
    redirect("/super-admin?erreur=" + encodeURIComponent("Erreur lors de la création du profil admin."));
  }

  revalidatePath("/super-admin");
  redirect("/super-admin?succes=" + encodeURIComponent(`École « ${nomEcole} » créée avec son administrateur.`));
}

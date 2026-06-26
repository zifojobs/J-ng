"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Transforme "Collège Jàng de Dakar" -> "college-jang-de-dakar".
function slugify(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // enlève les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // remplace tout le reste par des tirets
    .replace(/^-+|-+$/g, ""); // enlève les tirets au début/fin
}

// Crée une école + son compte admin. Renvoie un message d'erreur (ou null si OK).
// Annule tout en cas d'échec partiel (pas de demi-création).
async function creerEcoleAdmin(
  supabase: Supabase,
  params: { nomEcole: string; prenom: string; nom: string; email: string; password: string }
): Promise<string | null> {
  const { nomEcole, prenom, nom, email, password } = params;

  if (!nomEcole || !email || password.length < 6) {
    return "Champs manquants ou mot de passe trop court (min. 6 caractères).";
  }

  const slug = slugify(nomEcole);

  // 1) Créer l'école (autorisé par la RLS : super-admin).
  const { data: ecole, error: erreurEcole } = await supabase
    .from("ecoles")
    .insert({ nom: nomEcole, slug })
    .select("id")
    .single();

  if (erreurEcole || !ecole) {
    return "Impossible de créer l'école (nom déjà utilisé ?).";
  }

  // 2) Créer le compte de l'admin (côté serveur, email confirmé directement).
  const admin = createAdminClient();
  const { data: userCree, error: erreurUser } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (erreurUser || !userCree?.user) {
    await supabase.from("ecoles").delete().eq("id", ecole.id);
    return "Impossible de créer l'admin (email déjà utilisé ?).";
  }

  // 3) Créer le profil de l'admin, rattaché à son école.
  const { error: erreurProfil } = await supabase.from("profils").insert({
    id: userCree.user.id,
    ecole_id: ecole.id,
    role: "admin_ecole",
    prenom,
    nom,
    email,
  });

  if (erreurProfil) {
    await admin.auth.admin.deleteUser(userCree.user.id);
    await supabase.from("ecoles").delete().eq("id", ecole.id);
    return "Erreur lors de la création du profil admin.";
  }

  return null;
}

// Création « à la main » par le super-admin (formulaire libre).
export async function creerEcoleEtAdmin(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "super_admin") {
    redirect("/login");
  }

  const nomEcole = String(formData.get("nom_ecole") ?? "").trim();
  const erreur = await creerEcoleAdmin(supabase, {
    nomEcole,
    prenom: String(formData.get("admin_prenom") ?? "").trim(),
    nom: String(formData.get("admin_nom") ?? "").trim(),
    email: String(formData.get("admin_email") ?? "").trim().toLowerCase(),
    password: String(formData.get("admin_password") ?? ""),
  });

  if (erreur) {
    redirect("/super-admin?erreur=" + encodeURIComponent(erreur));
  }

  revalidatePath("/super-admin");
  redirect(
    "/super-admin?succes=" +
      encodeURIComponent(`École « ${nomEcole} » créée avec son administrateur.`)
  );
}

// Création depuis une demande d'inscription : crée l'école + admin, puis marque
// la demande comme traitée.
export async function creerEcoleDepuisDemande(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "super_admin") {
    redirect("/login");
  }

  const demandeId = String(formData.get("demande_id") ?? "").trim();
  const nomEcole = String(formData.get("nom_ecole") ?? "").trim();

  const erreur = await creerEcoleAdmin(supabase, {
    nomEcole,
    prenom: String(formData.get("admin_prenom") ?? "").trim(),
    nom: String(formData.get("admin_nom") ?? "").trim(),
    email: String(formData.get("admin_email") ?? "").trim().toLowerCase(),
    password: String(formData.get("admin_password") ?? ""),
  });

  if (erreur) {
    redirect("/super-admin?erreur=" + encodeURIComponent(erreur));
  }

  // L'école est créée : on marque la demande comme traitée.
  if (demandeId) {
    await supabase
      .from("demandes_inscription")
      .update({ statut: "traitee" })
      .eq("id", demandeId);
  }

  revalidatePath("/super-admin");
  redirect(
    "/super-admin?succes=" +
      encodeURIComponent(`École « ${nomEcole} » créée à partir de la demande.`)
  );
}

// Change le statut (abonnement) d'une école : essai / actif / suspendu.
// Réservé au super-admin ; le verrou en base (migration 0021) l'impose aussi.
export async function changerStatutEcole(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "super_admin") {
    redirect("/login");
  }

  const ecoleId = String(formData.get("ecole_id") ?? "").trim();
  const statut = String(formData.get("statut") ?? "").trim();

  // On n'accepte que les trois valeurs prévues par le type en base.
  if (!ecoleId || !["essai", "actif", "suspendu"].includes(statut)) {
    redirect("/super-admin?erreur=" + encodeURIComponent("Statut invalide."));
  }

  const { error } = await supabase
    .from("ecoles")
    .update({ statut })
    .eq("id", ecoleId);

  if (error) {
    redirect(
      "/super-admin?erreur=" +
        encodeURIComponent("Impossible de changer le statut.")
    );
  }

  revalidatePath("/super-admin");
  redirect("/super-admin?succes=" + encodeURIComponent("Statut mis à jour."));
}

// Rejette une demande d'inscription (sans créer d'école).
export async function rejeterDemande(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "super_admin") {
    redirect("/login");
  }

  const demandeId = String(formData.get("demande_id") ?? "").trim();
  if (demandeId) {
    await supabase
      .from("demandes_inscription")
      .update({ statut: "rejetee" })
      .eq("id", demandeId);
  }

  revalidatePath("/super-admin");
  redirect("/super-admin?succes=" + encodeURIComponent("Demande rejetée."));
}

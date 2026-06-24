"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfil } from "@/lib/auth";

// Enregistre les coordonnées de l'école de l'admin connecté.
// On ne touche QUE les colonnes de coordonnées (jamais le nom, le slug ou le
// statut), et la RLS garantit qu'on ne modifie que SA propre école.
export async function enregistrerCoordonnees(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const adresse = String(formData.get("adresse") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const directeur = String(formData.get("directeur") ?? "").trim();

  // Champs facultatifs : vide -> null (on n'affiche rien sur le bulletin).
  const { error } = await supabase
    .from("ecoles")
    .update({
      adresse: adresse || null,
      telephone: telephone || null,
      directeur: directeur || null,
    })
    .eq("id", profil.ecole_id);

  if (error) {
    redirect("/ecole/infos?erreur=" + encodeURIComponent("Impossible d'enregistrer les coordonnées."));
  }

  revalidatePath("/ecole/infos");
  redirect("/ecole/infos?succes=" + encodeURIComponent("Coordonnées enregistrées."));
}

// Chemin du logo dans le Storage : un fichier par école, dans son propre dossier.
function cheminLogo(ecoleId: string): string {
  return `${ecoleId}/logo`;
}

// Téléverse (ou remplace) le logo de l'école dans le Storage `logos`.
export async function enregistrerLogo(formData: FormData) {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  const fichier = formData.get("logo");
  if (!(fichier instanceof File) || fichier.size === 0) {
    redirect("/ecole/infos?erreur=" + encodeURIComponent("Choisissez d'abord un fichier image."));
  }
  const image = fichier as File;
  if (!image.type.startsWith("image/")) {
    redirect("/ecole/infos?erreur=" + encodeURIComponent("Le fichier doit être une image (PNG, JPG…)."));
  }
  if (image.size > 2 * 1024 * 1024) {
    redirect("/ecole/infos?erreur=" + encodeURIComponent("Image trop lourde (maximum 2 Mo)."));
  }

  const chemin = cheminLogo(profil.ecole_id);

  // upsert : remplace le logo précédent s'il existe.
  const { error: erreurUpload } = await supabase.storage
    .from("logos")
    .upload(chemin, image, { upsert: true, contentType: image.type });

  if (erreurUpload) {
    redirect("/ecole/infos?erreur=" + encodeURIComponent("Échec du téléversement du logo."));
  }

  // Adresse publique + paramètre anti-cache pour forcer l'affichage du nouveau logo.
  const { data: pub } = supabase.storage.from("logos").getPublicUrl(chemin);
  const url = `${pub.publicUrl}?t=${Date.now()}`;

  const { error: erreurMaj } = await supabase
    .from("ecoles")
    .update({ logo_url: url })
    .eq("id", profil.ecole_id);

  if (erreurMaj) {
    redirect("/ecole/infos?erreur=" + encodeURIComponent("Logo envoyé mais non enregistré."));
  }

  revalidatePath("/ecole/infos");
  redirect("/ecole/infos?succes=" + encodeURIComponent("Logo enregistré."));
}

// Retire le logo (fichier + référence en base).
export async function supprimerLogo() {
  const { supabase, profil } = await requireProfil();
  if (profil.role !== "admin_ecole" || !profil.ecole_id) {
    redirect("/login");
  }

  await supabase.storage.from("logos").remove([cheminLogo(profil.ecole_id)]);
  await supabase.from("ecoles").update({ logo_url: null }).eq("id", profil.ecole_id);

  revalidatePath("/ecole/infos");
  redirect("/ecole/infos?succes=" + encodeURIComponent("Logo retiré."));
}
